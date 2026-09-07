// 고정 화풍(스타일) 설정 - 다른 화풍으로 교체하려면 이 파일만 수정하면 됩니다.
// 실제 이미지 생성 API에 전달되는 최종 프롬프트는 이 파일이 유일한 기준(source of truth)입니다.
// (클라이언트가 프롬프트를 조작해서 보내더라도, 서버가 항상 이 접미사를 다시 붙여서 호출합니다.)
export const LEGO_STYLE = {
  id: 'lego-brick',
  name: '레고 브릭 스타일 (LEGO brick style)',
  description:
    '모든 사물이 레고 브릭으로 조립된 것처럼 표현되는 화풍입니다. ' +
    '각진 블록 형태, 광택 있는 플라스틱 질감, 원색 계열의 밝은 색감, ' +
    '표면마다 보이는 스터드(돌기) 디테일, 미니피규어 캐릭터, ' +
    '스튜디오 제품 사진 조명이 특징입니다.',
  promptSuffix:
    'in the style of LEGO brick art, made entirely of plastic LEGO bricks, ' +
    'blocky and geometric shapes, glossy plastic texture, ' +
    'bright primary colors, visible stud (bump) details on every surface, ' +
    'minifigure-style characters, studio product photography lighting, ' +
    'soft shadows, plain background',
};

export function buildFinalPrompt(userPrompt) {
  return `${userPrompt.trim()}, ${LEGO_STYLE.promptSuffix}`;
}
