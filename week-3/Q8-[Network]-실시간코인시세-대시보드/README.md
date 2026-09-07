# 🪙 실시간 코인 시세 대시보드

CoinGecko 공개 API를 활용해 관심 코인들의 실시간 시세(KRW)와 24시간 등락률을
카드 형태로 보여주는 단일 페이지 웹 대시보드입니다. 별도 백엔드 없이 정적 파일만으로
동작하며, GitHub Pages에 그대로 배포할 수 있습니다.

## 실행 방법

### 1) 로컬에서 바로 열기
1. 이 폴더의 `config.example.js`를 복사해 `config.js`로 이름을 바꿉니다.
2. `index.html`을 브라우저로 열면 바로 동작합니다. (API Key 없이도 동작하되, 요청량이 많으면 rate limit에 걸릴 수 있습니다)

### 2) GitHub Pages로 배포
1. 이 폴더를 별도 저장소(public repo)에 push 합니다.
2. 저장소 설정 → Pages에서 배포 브랜치/폴더를 지정합니다.
3. 배포된 URL로 접속하면 동일하게 동작합니다.

## API Key 설정 방법

1. `config.example.js` 파일을 복사해 `config.js`라는 이름으로 저장합니다.
2. `config.js` 안의 `COINGECKO_API_KEY` 값에 본인의 CoinGecko Demo API Key를 입력합니다.

```js
const CONFIG = {
  COINGECKO_API_KEY: "본인의_API_KEY",
};
```

3. `config.js`는 `.gitignore`에 등록되어 있어 절대 GitHub에 커밋되지 않습니다.
4. API Key가 없어도 앱은 정상 동작합니다(무료 public 엔드포인트는 키 없이 호출 가능). 다만 요청이 많아지면 CoinGecko의 rate limit(429 오류)에 걸릴 수 있으니, 가능하면 Demo API Key를 발급받아 사용하는 것을 권장합니다.

## 사용한 API

- [CoinGecko API](https://www.coingecko.com/en/api) — `GET /api/v3/simple/price`
  - 파라미터: `ids`, `vs_currencies=krw,usd`, `include_24hr_change=true`
  - API Key 사용 시 요청 헤더에 `x-cg-demo-api-key`를 추가

## 주요 기능

- `watchList` 배열로 관심 코인 목록 관리 (자유롭게 추가/삭제 가능)
- 코인별 현재가(₩, 천 단위 콤마)와 24시간 등락률(%) 카드 UI 표시
- 등락률에 따른 색상 분기 (상승: 초록 `#16c784`, 하락: 빨강 `#ea3943`, 보합: 회색) + ▲/▼ 화살표 아이콘
- 카드 hover 시 확대 인터랙션 효과
- "🔄 새로고침" 버튼으로 수동 갱신
- 자동 갱신 on/off 토글 (기본 15초 주기, `setInterval` 사용)
- 마지막 업데이트 시각 표시
- API 호출 실패 시 에러 토스트 안내 + 콘솔 상세 로그, 로딩 중 스켈레톤 UI
- `auto-fill` grid 기반 반응형 레이아웃 (모바일/데스크톱 대응)

## 파일 구조

```
├── index.html          # 페이지 마크업
├── style.css           # 다크 테마 카드 UI 스타일
├── script.js           # API 호출, 렌더링, 자동 갱신 등 핵심 로직
├── config.example.js   # API Key placeholder (커밋 대상)
├── config.js           # 실제 API Key (gitignore 처리, 커밋 금지)
├── .gitignore
└── screenshots/         # 스크린샷 저장 폴더
```

## 스크린샷

- 대시보드 동작 화면: `screenshots/dashboard.png`
  ![대시보드 동작 화면](screenshots/dashboard.png)
- 에이전트와의 대화: `screenshots/agent-chat.png`
  ![에이전트 대화 스크린샷](screenshots/agent-chat.png)

## 제출물 체크리스트

- [ ] GitHub 저장소 링크 (코드 포함, public repo)
- [ ] 동작 스크린샷 최소 1장 (`screenshots/dashboard.png`)
- [ ] 에이전트와의 대화 스크린샷 최소 1장 (`screenshots/agent-chat.png`)
