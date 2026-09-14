# PRD — 메모장 앱 (PostgreSQL 연동)

## 1. 개요
메모를 작성 / 목록 조회 / 수정 / 삭제할 수 있는 웹 앱. 모든 메모는 PostgreSQL DB에 저장되어 서버(앱)를 껐다 켜도 데이터가 유지되어야 한다.

같은 저장소의 `week-4/class/todo-02`(Express + pg + DB 연동 투두앱)와 동일한 패턴을 따른다. 이 예제를 그대로 참고/재사용해서 만든다.

## 2. 범위
- 포함: 메모 CRUD(생성/조회/수정/삭제), PostgreSQL 영구 저장, 단일 페이지 프론트엔드, REST API 서버
- 제외: 로그인/회원 구분(모든 메모는 공용), 검색/태그/첨부파일, 실시간 동기화(WebSocket 등)

## 3. 기술 스택 (수업 컨벤션 준수)
- 백엔드: Node.js + Express 5, 단일 `server.js`
- DB 드라이버: `pg` (node-postgres), `.env`의 `DATABASE_URL`로 연결
- 프론트엔드: 단일 `index.html` (별도 빌드 도구 없이 fetch로 API 호출)
- 배포 설정: `vercel.json` (다른 class 예제와 동일하게 정적 파일 + `/api/*` 라우팅)
- 환경변수: `.env`(gitignore 처리), `.env.example` 제공

## 4. DB 스키마
`memos` 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PRIMARY KEY | 자동 증가 ID |
| title | TEXT NOT NULL | 메모 제목 |
| content | TEXT | 메모 내용 (빈 값 허용) |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | 생성 시각 |

서버 기동 시 `CREATE TABLE IF NOT EXISTS`로 lazy init (todo-02 방식과 동일).

> 수정 시각까지 추적하고 싶다면 `updated_at` 컬럼 추가 가능 — 이번 범위에서는 제외(필요하면 요청).

## 5. API 명세

| Method | Endpoint | 설명 | Body | 응답 |
|---|---|---|---|---|
| GET | /api/memos | 메모 목록 (최신순), `?q=검색어`로 제목/내용 검색 | - | `{ success, data: Memo[] }` |
| GET | /api/memos/:id | 메모 단건 조회 | - | `{ success, data: Memo }` |
| POST | /api/memos | 메모 생성 | `{ title, content }` | `{ success, data: Memo }` (201) |
| PATCH | /api/memos/:id | 메모 수정 | `{ title?, content? }` | `{ success, data: Memo }` |
| DELETE | /api/memos/:id | 메모 삭제 | - | `{ success, data: Memo }` |

- `title`은 필수(빈 문자열 불가), `content`는 선택.
- 존재하지 않는 id 접근 시 404, 검증 실패 시 400, 서버/DB 오류 시 500.

## 6. 프론트엔드 요구사항
- 메모 목록: 제목 + 내용 일부 + 작성일시, 최신순 정렬
- 작성 폼: 제목/내용 입력 후 저장 → 목록에 즉시 반영
- 수정: 목록에서 메모 선택 → 인라인 또는 모달로 편집 → 저장
- 삭제: 확인 후 삭제, 목록에서 즉시 제거
- 검색: 검색창에 입력 시 (디바운스 후) 제목/내용 기준으로 목록 필터링, 지우기 버튼 제공
- 로딩/에러 상태 최소한으로 표시 (예: 저장 실패 시 알림)

## 7. 파일 구조 (예상)
```
고블린1-[DB]-메모장앱/
├── PRD.md
├── server.js
├── index.html
├── package.json
├── vercel.json
├── .gitignore        (node_modules/, .env)
└── .env.example       (DATABASE_URL=postgresql://...)
```

## 8. 검증 / 완료 기준
- `npm start`로 로컬 서버 기동 후 메모 생성 → 서버 재시작 → 메모 유지 확인
- 브라우저 개발자도구 Network 탭에서 GET/POST/PATCH/DELETE `/api/memos` 요청·응답 확인
- 새로고침해도 목록 유지, 삭제한 메모는 재조회 시 나타나지 않음

## 9. DB 연결 결정 사항
- **`week-4/class/todo-02`가 쓰던 Supabase(클라우드 Postgres) 인스턴스를 그대로 재사용**한다.
- 같은 DB 안에 `memos` 테이블만 새로 생성(`CREATE TABLE IF NOT EXISTS`) — 기존 `todos` 테이블과 공존, 서로 영향 없음.
- 이 앱의 `.env`에도 동일한 `DATABASE_URL`을 넣어 사용하며, `.env`는 `.gitignore`로 제외하고 `.env.example`만 커밋한다.
