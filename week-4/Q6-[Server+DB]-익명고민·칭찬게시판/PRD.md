# PRD — 익명 고민/칭찬 게시판

## 1. 개요
로그인 없이 누구나 **익명으로** 고민, 칭찬, 응원 글을 남길 수 있는 게시판. 다른 사람의 글에는 **공감(❤️) 버튼**으로 반응할 수 있고, 글 목록은 **최신순 / 공감순**으로 정렬해서 볼 수 있다. 모든 게시글과 공감 수는 DB(Supabase)에 저장되어 새로고침해도 유지된다.

같은 저장소의 `week-4/quests-wk4/Q1-[모의투자1]-나만의모의투자앱-Upbit공개API+가상지갑100만원`(Express + pg + Supabase 연동)과 동일한 패턴을 따른다.

## 2. 범위
- 포함: 익명 글 작성(카테고리 선택 + 내용), 글 목록 조회, 공감 버튼(공감 수 +1), 최신순/공감순 정렬, 단일 페이지 프론트엔드
- 제외: 로그인/회원 구분, 글 수정/삭제, 댓글, 신고/차단, 공감 중복 방지(같은 사용자가 여러 번 눌러도 매번 +1 — 익명이라 사용자 식별 자체가 범위 밖)

## 3. 기술 스택 (수업 컨벤션 준수)
- 백엔드: Node.js + Express, 단일 `server.js`
- DB 드라이버: `pg` (node-postgres), `.env`의 `DATABASE_URL`로 Supabase Postgres에 연결
- 프론트엔드: 단일 `index.html` (React + Tailwind CDN, 빌드 도구 없이 fetch로 API 호출)
- 배포 설정: `vercel.json`
- 환경변수: `.env`(gitignore 처리), `.env.example` 제공

## 4. DB 스키마

### posts
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PRIMARY KEY | 자동 증가 ID |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | 작성 시각 |
| category | TEXT NOT NULL | `고민` / `칭찬` / `응원` 중 하나 |
| content | TEXT NOT NULL | 본문 (1~500자) |
| likes | INTEGER NOT NULL DEFAULT 0 | 공감 수 |

서버 기동 시 `CREATE TABLE IF NOT EXISTS`로 lazy init.

## 5. API 명세

| Method | Endpoint | 설명 | Body/Query | 응답 |
|---|---|---|---|---|
| GET | /api/posts | 게시글 목록 조회 | `?sort=latest\|likes` (기본 latest) | `{ success, data: Post[] }` |
| POST | /api/posts | 익명 글 작성 | `{ category, content }` | `{ success, data: Post }` (201) |
| POST | /api/posts/:id/like | 공감 수 +1 | - | `{ success, data: Post }` |

- `category`는 `고민` / `칭찬` / `응원` 중 하나만 허용, 그 외 값은 400.
- `content`는 공백 제거 후 1자 이상 500자 이하만 허용, 그 외 400.
- `sort=latest`는 `created_at DESC`, `sort=likes`는 `likes DESC, created_at DESC` (동점 시 최신 우선).
- `/api/posts/:id/like`는 `UPDATE posts SET likes = likes + 1 WHERE id = $1`로 원자적 증가(레이스 컨디션 방지), 존재하지 않는 id면 404.

## 6. 프론트엔드 요구사항
- 글 작성 폼: 카테고리 선택(고민/칭찬/응원 버튼 또는 셀렉트), 내용 textarea, 등록 버튼 → 성공 시 폼 초기화 + 목록 갱신
- 정렬 탭: **최신순 / 공감순** 토글, 선택한 정렬로 목록 재조회
- 게시글 카드: 카테고리 배지(색상 구분), 본문, 작성 시각(상대시간 또는 포맷), 공감 버튼 + 공감 수
- 공감 버튼 클릭 시 서버에 반영 후 화면의 공감 수 즉시 갱신
- 로딩/에러 상태 최소한으로 표시(예: "불러오는 중...", "작성에 실패했습니다")

## 7. 파일 구조
```
Q6-[Server+DB]-익명고민·칭찬게시판/
├── PRD.md
├── server.js
├── index.html
├── package.json
├── package-lock.json
├── .env
├── .env.example
└── .gitignore
```

## 8. 구현 순서 (다음 단계)
1. `package.json` + 의존성(express, pg, dotenv) 설치
2. `server.js`: DB 연결, `posts` 테이블 lazy init, 3개 API 엔드포인트 구현
3. `index.html`: 작성 폼, 정렬 탭, 게시글 목록 UI 구현 (React + Tailwind CDN)
4. `.env`/`.env.example`/`.gitignore` 정리, 로컬에서 Supabase `DATABASE_URL` 연결해 동작 확인
5. 제출물 준비: GitHub 링크, 동작 스크린샷, 에이전트 대화 스크린샷
