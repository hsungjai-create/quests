// 고정 화풍(스타일) 설정 - 다른 화풍으로 교체하려면 이 파일만 수정하면 됩니다.
// 주의: 실제 이미지 생성 API 호출에 사용되는 최종 프롬프트는 항상 server/constants/styles.js 를
// 기준으로 서버에서 조합됩니다. 이 파일은 화면에 스타일 이름/설명을 보여주기 위한 것입니다.
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
