# PRD — 나만의 모의투자 앱 (Upbit 공개 API + 가상 지갑 100만원)

## 1. 개요
실제 돈 없이 업비트(Upbit) 실시간 시세로 코인을 사고파는 연습을 할 수 있는 웹 앱. 시작 현금은 100만원이며, 매수/매도할 때마다 가상 지갑(현금 + 보유 코인 수량)이 갱신되고 주문 내역이 기록된다.

같은 저장소의 `week-4/quests-wk4/고블린1-[DB]-메모장앱`(Express + pg + Supabase 연동)과 동일한 패턴을 따른다.

## 2. 범위
- 포함: 현재가 조회(Upbit 공개 API), 가상 지갑 조회(현금/보유코인/평가금액/수익률), 매수/매도 주문 처리, 주문 내역 조회, 단일 페이지 프론트엔드
- 제외: 로그인/회원 구분(지갑은 1개만 존재), 캔들 차트, 실시간 자동매매, 여러 마켓 동시 보유 외의 고급 포트폴리오 기능

## 3. 기술 스택 (수업 컨벤션 준수)
- 백엔드: Node.js + Express, 단일 `server.js`
- DB 드라이버: `pg` (node-postgres), `.env`의 `DATABASE_URL`로 Supabase Postgres에 연결
- 프론트엔드: 단일 `index.html` (React + Tailwind CDN, 빌드 도구 없이 fetch로 API 호출)
- 배포 설정: `vercel.json`
- 환경변수: `.env`(gitignore 처리), `.env.example` 제공
- 외부 API: Upbit 공개 API (키 불필요)
  - 현재가: `GET https://api.upbit.com/v1/ticker?markets=KRW-BTC`

## 4. DB 스키마

### wallet (딱 1행만 사용, id=1)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PRIMARY KEY | 항상 1 |
| cash | NUMERIC NOT NULL DEFAULT 1000000 | 보유 현금 (원) |
| holdings | JSONB NOT NULL DEFAULT '{}' | 보유 코인별 수량+평균매수가, 예: `{ "KRW-BTC": { "qty": 0.001, "avgPrice": 105000000 } }` |

평균매수가는 이동평균법(moving average cost)으로 계산한다. 매수 시 `(기존 보유금액 + 이번 매수금액) / 총 수량`으로 갱신하고, 매도 시에는 평균매수가를 바꾸지 않는다(남은 수량의 원가는 그대로 유지). 보유 수량이 0이 되면 평균매수가도 0으로 초기화한다.

### orders
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PRIMARY KEY | 자동 증가 ID |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | 주문 시각 |
| market | TEXT NOT NULL | 마켓 코드 (예: KRW-BTC) |
| side | TEXT NOT NULL | buy 또는 sell |
| amount | NUMERIC NOT NULL | 체결 수량 |
| price | NUMERIC NOT NULL | 체결 단가 |
| memo | TEXT | 메모 (선택) |

서버 기동 시 `CREATE TABLE IF NOT EXISTS`로 lazy init, wallet에 id=1 행이 없으면 자동 생성(INSERT).

## 5. API 명세

| Method | Endpoint | 설명 | Body/Query | 응답 |
|---|---|---|---|---|
| GET | /api/price | Upbit 현재가 조회 | `?market=KRW-BTC` | `{ success, data: { market, trade_price, ... } }` |
| GET | /api/wallet | 지갑 조회 (현금/보유코인별 평균매수가/전체 평가금액/수익률) | - | `{ success, data: { cash, holdings, positions, evaluated, total, profitRate } }` |
| GET | /api/orders | 주문 내역 (최신순) | - | `{ success, data: Order[] }` |
| POST | /api/order | 매수/매도 주문 | `{ market, side, amount }` | `{ success, data: { wallet, order } }` (201) 또는 잔고 부족 시 400 |

- `side`는 `buy` 또는 `sell`만 허용.
- `amount`는 0보다 큰 숫자여야 함.
- buy: `cash < amount * 현재가`이면 400 거절 ("현금이 부족합니다").
- sell: 보유 수량이 `amount`보다 적으면 400 거절 ("보유 수량이 부족합니다").
- 체결가는 항상 주문 시점의 Upbit 현재가를 사용.
- `총 평가금액`/`수익률`은 화면에서 어떤 마켓을 선택했는지와 무관하게, **보유 중인 모든 코인**을 각자의 현재가로 평가해 합산한 값이다(한 코인만 반영되지 않도록 주의).

## 6. 프론트엔드 요구사항
- 마켓 선택(KRW-BTC, KRW-ETH 등) + 현재가 표시, 일정 주기로 자동 갱신
- 내 지갑 카드: 현금, 보유 코인 수량, 평가금액, 수익률(%) — 이익/손실에 따라 색상 구분
- 보유 코인 표(창의성 포인트): 코인별 보유 수량 / 평균매수가 / 현재가 / 평가금액 / 평가손익(금액+%)을 한눈에 비교
- 매수/매도: 수량 입력 후 버튼 클릭 → 성공 시 지갑/내역 즉시 갱신, 실패 시 에러 메시지 표시
- 주문 내역: 시간, 마켓, 매수/매도, 수량, 체결가, 메모를 표로 최신순 표시
- 로딩/에러 상태 최소한으로 표시

## 7. 파일 구조
```
Q1.-[모의투자1]-나만의모의투자앱-Upbit공개API+가상지갑100만원/
├── PRD.md
├── server.js
├── index.html
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── .gitignore
└── vercel.json
```
