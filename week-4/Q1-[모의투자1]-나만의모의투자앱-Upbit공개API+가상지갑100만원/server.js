require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const START_CASH = 1000000;

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── DB lazy init ──────────────────────────────
let dbInitialized = false;
async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY,
      cash NUMERIC NOT NULL DEFAULT ${START_CASH},
      holdings JSONB NOT NULL DEFAULT '{}'
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      market TEXT NOT NULL,
      side TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      price NUMERIC NOT NULL,
      memo TEXT
    )
  `);
  await pool.query(
    `INSERT INTO wallet (id, cash, holdings) VALUES (1, $1, '{}')
     ON CONFLICT (id) DO NOTHING`,
    [START_CASH]
  );
  dbInitialized = true;
}

app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ── Upbit helper ──────────────────────────────
async function getCurrentPrice(market) {
  const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(market)}`);
  if (!res.ok) {
    throw new Error('Upbit API request failed');
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Unknown market');
  }
  return data[0];
}

async function getWalletRow() {
  const result = await pool.query('SELECT cash, holdings FROM wallet WHERE id = 1');
  return result.rows[0];
}

async function getPricesFor(markets) {
  if (markets.length === 0) return {};
  const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets.map(encodeURIComponent).join(',')}`);
  if (!res.ok) {
    throw new Error('Upbit API request failed');
  }
  const tickers = await res.json();
  return Object.fromEntries(tickers.map((t) => [t.market, Number(t.trade_price)]));
}

// 보유 코인별 수량/평균매수가/현재가/평가손익을 계산
async function buildPositions(holdings) {
  const heldMarkets = Object.keys(holdings).filter((m) => Number(holdings[m]?.qty) > 0);
  const priceByMarket = await getPricesFor(heldMarkets);
  return heldMarkets.map((m) => {
    const qty = Number(holdings[m].qty);
    const avgPrice = Number(holdings[m].avgPrice) || 0;
    const currentPrice = priceByMarket[m] || 0;
    const evaluated = qty * currentPrice;
    const costBasis = qty * avgPrice;
    const profit = evaluated - costBasis;
    const profitRate = costBasis > 0 ? profit / costBasis : 0;
    return { market: m, qty, avgPrice, currentPrice, evaluated, profit, profitRate };
  });
}

// ── API routes ───────────────────────────────
app.get('/api/price', async (req, res) => {
  const market = typeof req.query.market === 'string' ? req.query.market : 'KRW-BTC';
  try {
    const ticker = await getCurrentPrice(market);
    res.json({ success: true, data: ticker });
  } catch (err) {
    console.error(err);
    res.status(502).json({ success: false, message: 'Failed to fetch price from Upbit' });
  }
});

app.get('/api/wallet', async (req, res) => {
  try {
    const wallet = await getWalletRow();
    const cash = Number(wallet.cash);
    const holdings = wallet.holdings || {};
    let positions = [];
    try {
      positions = await buildPositions(holdings);
    } catch (err) {
      console.error('price lookup for wallet failed', err);
    }
    const evaluated = positions.reduce((sum, p) => sum + p.evaluated, 0);
    const total = cash + evaluated;
    const profitRate = (total - START_CASH) / START_CASH;
    res.json({
      success: true,
      data: { cash, holdings, positions, evaluated, total, profitRate, startCash: START_CASH },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load wallet' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, created_at, market, side, amount, price, memo FROM orders ORDER BY created_at DESC, id DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

app.post('/api/order', async (req, res) => {
  const { market, side, amount, memo } = req.body || {};
  if (typeof market !== 'string' || !market.trim()) {
    return res.status(400).json({ success: false, message: 'market is required' });
  }
  if (side !== 'buy' && side !== 'sell') {
    return res.status(400).json({ success: false, message: 'side must be buy or sell' });
  }
  const qty = Number(amount);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'amount must be a positive number' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const walletResult = await client.query('SELECT cash, holdings FROM wallet WHERE id = 1 FOR UPDATE');
    const wallet = walletResult.rows[0];
    const cash = Number(wallet.cash);
    const holdings = { ...(wallet.holdings || {}) };

    const ticker = await getCurrentPrice(market.trim());
    const price = Number(ticker.trade_price);
    const cost = qty * price;

    if (side === 'buy') {
      if (cash < cost) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: '현금이 부족합니다' });
      }
      // 평균매수가는 이동평균법으로 계산: (기존 보유금액 + 이번 매수금액) / 총 수량
      const prev = holdings[market] || { qty: 0, avgPrice: 0 };
      const newQty = prev.qty + qty;
      const newAvgPrice = (prev.qty * prev.avgPrice + qty * price) / newQty;
      holdings[market] = { qty: newQty, avgPrice: newAvgPrice };
      const newCash = cash - cost;
      await client.query('UPDATE wallet SET cash = $1, holdings = $2 WHERE id = 1', [newCash, holdings]);
    } else {
      const prev = holdings[market] || { qty: 0, avgPrice: 0 };
      if (prev.qty < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: '보유 수량이 부족합니다' });
      }
      // 매도는 평균매수가에 영향 없음 (남은 수량의 원가는 그대로 유지)
      const newQty = prev.qty - qty;
      holdings[market] = { qty: newQty, avgPrice: newQty > 0 ? prev.avgPrice : 0 };
      const newCash = cash + cost;
      await client.query('UPDATE wallet SET cash = $1, holdings = $2 WHERE id = 1', [newCash, holdings]);
    }

    const orderResult = await client.query(
      `INSERT INTO orders (market, side, amount, price, memo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, market, side, amount, price, memo`,
      [market, side, qty, price, memo || null]
    );

    await client.query('COMMIT');

    const updatedWallet = await getWalletRow();
    res.status(201).json({
      success: true,
      data: {
        wallet: { cash: Number(updatedWallet.cash), holdings: updatedWallet.holdings },
        order: orderResult.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// ── SPA fallback (Express 5 문법) ─────────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Error handler ────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Local: 서버 시작 / Vercel: app export
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
