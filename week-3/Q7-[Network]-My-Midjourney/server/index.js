import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import generateRouter from './routes/generate.js';

const PORT = process.env.PORT || 3002;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';

if (!process.env.GOOGLE_API_KEY) {
  console.log(
    '[My-Midjourney] 안내: 서버에 GOOGLE_API_KEY가 설정되어 있지 않습니다. 브라우저 화면의 "API 키 설정" 패널에서 키를 입력해서 사용하세요 (권장). server/.env에 키를 넣어 서버 쪽 기본값으로 쓸 수도 있습니다.'
  );
}

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    allowedHeaders: ['Content-Type', 'X-Google-Api-Key'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.use('/api/generate', generateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[My-Midjourney] 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
