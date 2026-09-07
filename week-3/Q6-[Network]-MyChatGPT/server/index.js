import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '[MyChatGPT] 경고: OPENAI_API_KEY가 설정되어 있지 않습니다. server/.env.example을 복사해 server/.env를 만들고 키를 입력하세요.'
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

function buildSystemPrompt(profile = {}) {
  const {
    name = 'AI 어시스턴트',
    personality = '친절하고 도움이 되는 성격',
    tone = '정중하고 부드럽게',
    expertise = '다양한 분야의 지식',
  } = profile;

  return `당신은 ${name}입니다. 성격: ${personality}. 말투: ${tone}. 전문분야: ${expertise}. 항상 이 설정에 맞게 답변하세요.`;
}

app.post('/api/chat', async (req, res) => {
  const { profile, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '메시지가 비어 있습니다.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: '서버에 OPENAI_API_KEY가 설정되어 있지 않습니다. server/.env 파일을 확인하세요.',
    });
  }

  try {
    const systemPrompt = buildSystemPrompt(profile);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices?.[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err) {
    console.error('[MyChatGPT] OpenAI 호출 실패:', err?.message || err);
    const status = err?.status || 500;
    res.status(status).json({
      error: 'AI 응답을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[MyChatGPT] 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
