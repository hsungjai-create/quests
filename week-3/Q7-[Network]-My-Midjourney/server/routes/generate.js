import { Router } from 'express';
import { LEGO_STYLE, buildFinalPrompt } from '../constants/styles.js';

const router = Router();

// 나노 바나나(Gemini 2.5 Flash Image) 모델. 정식 모델이 막히면 preview로 자동 재시도합니다.
const IMAGE_MODELS = [
  process.env.GOOGLE_IMAGE_MODEL || 'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
];

async function callGemini(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message || `${model} 요청 실패 (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart) {
    throw new Error(`${model}이(가) 이미지를 반환하지 않았습니다.`);
  }

  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

router.post('/', async (req, res) => {
  const { prompt } = req.body || {};

  // 브라우저의 "API 키 설정" 패널에서 입력한 키를 최우선으로 사용합니다.
  // 이 키는 요청 처리 중에만 메모리에 존재하고, 응답 후 즉시 버려집니다.
  // (디스크/로그/DB 어디에도 저장하지 않음) 헤더가 없으면 server/.env의 값을 보조로 사용합니다.
  const apiKey = req.get('x-google-api-key')?.trim() || process.env.GOOGLE_API_KEY;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: '프롬프트를 입력해주세요.' });
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Google API 키가 설정되어 있지 않습니다. 화면 상단의 "API 키 설정" 패널에서 키를 입력해주세요.',
    });
  }

  const finalPrompt = buildFinalPrompt(prompt);

  let lastErr = null;
  for (const model of IMAGE_MODELS) {
    try {
      const imageUrl = await callGemini(model, apiKey, finalPrompt);
      return res.json({
        imageUrl,
        finalPrompt,
        style: LEGO_STYLE.name,
      });
    } catch (err) {
      lastErr = err;
      console.error(`[My-Midjourney] ${model} 이미지 생성 실패:`, err?.message || err);
    }
  }

  const status = lastErr?.status || 500;
  res.status(status).json({
    error: '이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  });
});

export default router;
