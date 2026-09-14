require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

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
    CREATE TABLE IF NOT EXISTS memos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
app.get('/api/memos', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  try {
    const result = q
      ? await pool.query(
          `SELECT id, title, content, created_at FROM memos
           WHERE title ILIKE $1 OR content ILIKE $1
           ORDER BY created_at DESC, id DESC`,
          [`%${q}%`]
        )
      : await pool.query(
          'SELECT id, title, content, created_at FROM memos ORDER BY created_at DESC, id DESC'
        );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load memos' });
  }
});

app.get('/api/memos/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      'SELECT id, title, content, created_at FROM memos WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load memo' });
  }
});

app.post('/api/memos', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO memos (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at',
      [title.trim(), content || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create memo' });
  }
});

app.patch('/api/memos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body || {};
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ success: false, message: 'title cannot be empty' });
  }
  try {
    const result = await pool.query(
      `UPDATE memos
       SET title = COALESCE($1, title),
           content = COALESCE($2, content)
       WHERE id = $3
       RETURNING id, title, content, created_at`,
      [title !== undefined ? title.trim() : null, content !== undefined ? content : null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update memo' });
  }
});

app.delete('/api/memos/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      'DELETE FROM memos WHERE id = $1 RETURNING id, title, content, created_at',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Memo not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete memo' });
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
