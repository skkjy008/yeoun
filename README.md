# 여운 YEOUN

> 향이 지나간 자리, 오래 남는 여운.

방향제·인센스·향수·캔들을 파는 쇼핑몰이지만, 단순히 상품만 나열하지 않습니다.
**나만의 향 찾기**에서 고른 장면을 바탕으로 취향에 맞는 향을 추천하고, 상세 페이지에서는 향의 장면·사용법·짧은 글·음악까지 함께 보여 줍니다.
인증된 조향사에게 원하는 향을 의뢰하는 커미션 기능도 순서대로 붙여 나갑니다.

포트폴리오용 풀스택 프로젝트이며, 브랜드·상품·후기는 모두 가상 콘텐츠입니다.

- 기획 / 설계: Notion `여운 프로젝트`
- 화면 디자인: Figma `여운 · AI 향 추천 · 조향사 커미션`

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Backend | Java 21, Spring Boot 3.4, Spring Data JPA, Spring Security + JWT, Validation, springdoc-openapi |
| Database | MySQL 8 (로컬·운영), H2 (테스트) |
| Frontend | React 18, TypeScript, Vite, React Router, CSS Modules, lucide-react |
| AI | Claude API (취향 큐레이션 문장 생성, 키가 없으면 규칙 기반으로 대체) |
| 외부 연동 | YouTube Data API v3 (상세 페이지 음악 추천 영상 임베드) |
| DevOps | Docker, Docker Compose, Nginx, GitHub Actions (CI / CD → GHCR → AWS EC2), AWS RDS |

## 구현 범위 (1단계)

- [x] 회원가입 / 로그인 (JWT), 권한(USER · PERFUMER · ADMIN)과 등급(브론즈~다이아)
- [x] 회원가입 시 **조향사 여부 선택 → 인증 아코디언 폼**, 가입 즉시 운영자에게 인증 요청 알림
- [x] 운영자: 조향사 인증 승인/반려(결과 알림), 상품 CRUD·재고 수정, 고객 권한·등급 관리
- [x] 상품: 향 종류 코드 `inc_cd` 001~004(방향제·인센스·향수·캔들), 재고 0이면 **SOLD OUT**
- [x] 카테고리 목록: 검색·필터(향의 느낌/공간/가격)·정렬·페이지네이션
- [x] 상품 상세: 향의 장면·노트·사용법·세 줄 이야기·**YouTube 음악 연동**·구매 옵션·리뷰(별점)
- [x] **나만의 향 찾기** 6단계(비회원은 회원가입으로 연결) → 취향 테이블 저장 → 추천 + Claude 큐레이션
- [x] 메인: 테마 배너(게시글 테이블로 관리), 취향 기반 맞춤 추천(참여 회원은 상단 노출), 인기·신상품, 후기
- [x] 예시 데이터 자동 생성(상품 36종, 질문 6개, 배너 4개, 회원/리뷰)
- [x] Docker Compose, Nginx, GitHub Actions CI, GHCR + EC2 배포 워크플로

## 구현 범위 (2단계)

- [x] **장바구니**: 담기(같은 상품은 수량 합산)·수량 변경·선택 삭제, 품절/재고 부족 표시, 헤더 개수 배지
- [x] **주문서 · 모의 결제**: 주문자/배송지(주소 검색, 기본 배송지 저장), 쿠폰·적립금 적용, 결제수단 3종
  - 비관적 잠금(`SELECT … FOR UPDATE`)으로 재고 차감 → 초과 판매 방지, 주문 번호 `YN-yyyyMMdd-####`
  - 카드 정보는 받지 않는 모의 승인(`MockPaymentGateway`) — 실제 PG로 교체할 지점을 한 곳에 모음
  - 결제 완료 → 상품 준비 중 → 배송 중 → 배송 완료 (단계 건너뛰기 불가), 결제 완료 단계에서 회원 직접 취소 시 재고·쿠폰·적립금 복구
  - 배송 완료 시 상품 금액 1% 적립, 누적 구매 금액으로 등급 자동 상향
- [x] **쿠폰**: 가입 즉시 3,000원 웰컴 쿠폰(30,000원 이상, 30일)
- [x] **찜한 향**: 상품 카드 하트 ↔ 마이페이지 목록
- [x] **마이페이지**(Figma): 멤버십 요약, 등급 진행도, 주문 상태별 건수, 최근 주문, 주문 상세/취소, 쿠폰·적립금, 나의 의견, 나의 커미션, 회원정보·비밀번호 수정, 배송지 관리
- [x] **커스텀 커미션 게시판**(아트머그 방식)
  - 의뢰 등록 → 인증된 **모든 조향사에게 실시간 알림(SSE)** → 조향사 제안(가격·기간·방향)
  - 의뢰인이 제안 선택 + **선결제** → 나머지 제안 자동 마감 → 조향사 전달 → **향 만족도 · 조향사 평가 후기**
  - 제안 내용은 의뢰인에게만 공개, 조향사 카드에 평균 평점·완료 건수 표시
- [x] **실시간 알림**: `GET /api/notifications/stream` (Server-Sent Events, fetch 스트림으로 JWT 헤더 전달, 자동 재연결)
- [x] 운영자 주문 관리 탭(상태 변경·취소)

### 다음 단계

- [ ] 테마(계절·기념일) 큐레이션 페이지
- [ ] 실제 PG(토스페이먼츠 등) 연동, 커미션 정산/환불
- [ ] Flyway 마이그레이션, 이미지 S3 업로드, 다중 인스턴스용 알림 브로커(Redis Pub/Sub)

## 빠르게 실행하기

### 1) Docker로 전체 실행

```bash
cp .env.example .env
docker compose up --build
# http://localhost  (API 문서: http://localhost/api/docs 는 backend 컨테이너 8080에서 제공)
```

### 2) 개별 실행

```bash
# DB
docker compose up -d mysql

# Backend (http://localhost:8080, Swagger: /api/docs)
cd backend
./gradlew bootRun                       # 기본 local 프로필 = MySQL
./gradlew bootRun --args='--spring.profiles.active=h2'   # DB 없이 H2로 실행

# Frontend (http://localhost:5173, /api → 8080 프록시)
cd frontend
npm install
npm run dev
```

백엔드 없이 화면만 확인하려면 `npm run dev:mock` 을 실행하세요. 같은 시드 데이터를 쓰는 Mock API가 함께 뜹니다.

### 데모 계정

| 구분 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 관리자 | admin@yeoun.example | admin1234! |
| 회원 | yeon@yeoun.example | yeoun1234! |
| 조향사(승인) | atelier@yeoun.example | yeoun1234! |
| 조향사(승인 대기) | newnose@yeoun.example | yeoun1234! |

`yeon@` 계정에는 배송 완료·배송 중 주문, `seowoo@`·`haseo@` 계정에는 커미션 의뢰 예시가 들어 있습니다.

> **기존 로컬 DB를 쓰던 경우**: 2단계에서 새 테이블·컬럼이 추가됩니다(`ddl-auto: update`가 생성). 1단계에서 `notification.type`이 MySQL `enum` 컬럼으로 만들어졌다면 새 알림 종류 저장 시 오류가 나므로 `ALTER TABLE notification MODIFY type VARCHAR(40) NOT NULL;` 을 한 번 실행하거나 `docker compose down -v`로 DB를 초기화하세요.

## 환경 변수

| 이름 | 설명 |
| --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL / RDS 접속 정보 |
| `JWT_SECRET` | 32바이트 이상 서명 키 (운영 필수) |
| `CORS_ALLOWED_ORIGINS` | 프론트엔드 도메인 |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | (선택) Claude 큐레이션 |
| `YOUTUBE_API_KEY` | (선택) 음악 추천 영상 검색 |
| `SEED_ENABLED`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | 예시 데이터·관리자 계정 |

## 폴더 구조

```
backend/   Spring Boot API (도메인별 패키지: member, product, preference, review, post, notification, admin, music,
           cart, wishlist, coupon, order, commission)
frontend/  React + Vite SPA (pages / components / api / auth), public/images = Figma 에셋
docs/      ERD·API 문서
.github/   CI / CD 워크플로
```

자세한 테이블 구조와 API는 [docs/architecture.md](docs/architecture.md)를 참고하세요.
