require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const CATEGORIES = ['고민', '칭찬', '응원'];
const MAX_CONTENT_LENGTH = 500;

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
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0
    )
  `);
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

// ── API routes ───────────────────────────────
app.get('/api/posts', async (req, res) => {
  const sort = req.query.sort === 'likes' ? 'likes' : 'latest';
  const orderBy = sort === 'likes' ? 'likes DESC, created_at DESC' : 'created_at DESC';
  try {
    const result = await pool.query(
      `SELECT id, created_at, category, content, likes FROM posts ORDER BY ${orderBy}`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { category, content } = req.body || {};
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category는 ${CATEGORIES.join('/')} 중 하나여야 합니다` });
  }
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ success: false, message: '내용을 입력해주세요' });
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ success: false, message: `내용은 ${MAX_CONTENT_LENGTH}자 이하로 입력해주세요` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (category, content) VALUES ($1, $2)
       RETURNING id, created_at, category, content, likes`,
      [category, trimmed]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid post id' });
  }
  try {
    const result = await pool.query(
      `UPDATE posts SET likes = likes + 1 WHERE id = $1
       RETURNING id, created_at, category, content, likes`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to like post' });
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
