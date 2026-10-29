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
| Database | MySQL 8 (로컬·운영), H2 (테스트), Flyway |
| Frontend | React 18, TypeScript, Vite, React Router, CSS Modules, lucide-react |
| AI | Claude API (취향 큐레이션 문장 생성, 키가 없으면 규칙 기반으로 대체) |
| 외부 연동 | 토스페이먼츠 결제위젯, YouTube Data API v3, AWS S3(로컬 SeaweedFS), Redis Pub/Sub |
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
- [x] **쿠폰**: 3,000원 웰컴 쿠폰(30,000원 이상, 30일) — 4단계부터 이벤트 페이지에서 회원이 직접 받기(1인 1회)
- [x] **찜한 향**: 상품 카드 하트 ↔ 마이페이지 목록
- [x] **마이페이지**(Figma): 멤버십 요약, 등급 진행도, 주문 상태별 건수, 최근 주문, 주문 상세/취소, 쿠폰·적립금, 나의 의견, 나의 커미션, 회원정보·비밀번호 수정, 배송지 관리
- [x] **커스텀 커미션 게시판**(아트머그 방식)
  - 의뢰 등록 → 인증된 **모든 조향사에게 실시간 알림(SSE)** → 조향사 제안(가격·기간·방향)
  - 의뢰인이 제안 선택 + **선결제** → 나머지 제안 자동 마감 → 조향사 전달 → **향 만족도 · 조향사 평가 후기**
  - 제안 내용은 의뢰인에게만 공개, 조향사 카드에 평균 평점·완료 건수 표시
- [x] **실시간 알림**: `GET /api/notifications/stream` (Server-Sent Events, fetch 스트림으로 JWT 헤더 전달, 자동 재연결)
- [x] 운영자 주문 관리 탭(상태 변경·취소)

## 구현 범위 (3단계)

- [x] **토스페이먼츠 결제위젯 연동** (`TOSS_CLIENT_KEY`·`TOSS_SECRET_KEY`가 없으면 같은 흐름의 모의 결제)
  - 주문서 제출 → 재고·쿠폰·적립금 **예약** + '결제 대기' 주문 → 결제위젯 → `successUrl`에서 서버 승인(`/v1/payments/confirm`)
  - 서버 저장 금액과 대조해 금액 위변조 차단, 같은 승인 요청은 한 번만 처리, 승인 후 처리 실패 시 PG 자동 취소
  - 결제창 취소·실패·30분 만료 시 예약 해제, 주문 취소 시 PG 환불(`/v1/payments/{paymentKey}/cancel`)
- [x] **커미션 정산·환불**
  - 제안 선택 → 선결제 → 조향사 '제작 시작' → 전달 → 구매 확정(후기 작성 또는 전달 7일 후 자동)
  - 환불: 제작 전 100% · 제작 중 50%(PG 부분 취소, 나머지는 조향사 몫) · 전달 이후 불가, 제작 전에는 조향사도 사양 가능
  - 정산: 구매 확정 금액에서 수수료 10%를 뺀 금액을 '정산 대기'로 → 운영자가 송금 후 '지급 완료' 처리
- [x] **테마 큐레이션** `/theme`, `/theme/:slug` — 계절·기념일 테마에 상품과 큐레이터 한 줄 소개를 묶고 기간 안의 테마를 먼저 노출, 운영자 CRUD
- [x] **Flyway** — `db/migration/common`(H2·MySQL 공용) + `db/migration/mysql`(기존 DB 정리), Hibernate는 `validate`만
- [x] **이미지 업로드** — S3(로컬은 SeaweedFS) 또는 서버 디스크, 파일 시그니처로 JPG·PNG·WEBP만 허용, 상품·테마(운영자)·커미션 참고 이미지(회원)
- [x] **Redis Pub/Sub 실시간 알림** — 알림 커밋 후 Redis 채널로 발행, 모든 서버가 구독해 자기에게 연결된 사용자에게 SSE 전송

## 구현 범위 (4단계)

- [x] **이벤트** `/events`, `/events/:slug` — 썸네일·제목·내용·기간 목록(진행 중 먼저), 상세 4종
  - 테마 특가(할로윈·가을): 관련 테마 향 소개 + 할인율 안내 + 테마 바로가기
  - 하루 한 번 룰렛(`react-custom-roulette`): 꽝 55% · 10% 30% · 20% 12% · 50% 3%, **당첨은 서버가 결정**하고 휠은 결과 칸으로 애니메이션만, `(member_id, spun_on)` 유니크로 KST 기준 1일 1회 보장, 당첨 시 정률 쿠폰(최대 할인 한도, 7일) 발급
  - 신규 가입 웰컴 쿠폰 받기: 발급 모달 / 이미 받은 회원은 409 안내
- [x] **테마 특가 실결제 적용** — 진행 중인 THEME_SALE 이벤트의 테마 상품은 서버(`SalePricing`)가 판매가를 계산해 상품 목록·상세·찜·추천·장바구니에 `salePrice`/`saleRate`로 내려주고, 주문 시 다시 계산한 할인가를 주문 단가로 저장 (여러 특가가 겹치면 가장 큰 할인율, 10원 단위 절사, 이후 쿠폰·적립금은 할인가 기준)
- [x] **정률 쿠폰** — `discount_rate`, `max_discount_amount` (Flyway V3), 10원 단위 절사
- [x] 헤더: 로그인 시 'OOO님 환영합니다!', 돋보기 → 상단 중앙 검색 레이어(추천 검색어), 카테고리 가격 필터를 범위 슬라이더(`price=min-max`)로 변경
- [x] 커스텀 의뢰 작성: 입력 검증 실패 시 토스트 + 해당 입력으로 스크롤·포커스 + 버튼 아래 안내

### 다음 단계

- [ ] AWS 배포: EC2 + RDS(MySQL) + S3 + ElastiCache(Redis), GitHub Secrets 등록 후 자동 배포
- [ ] 토스페이먼츠 웹훅으로 가상계좌·결제 상태 동기화

## 빠르게 실행하기

### 1) Docker로 전체 실행

```bash
cp .env.example .env
docker compose up --build
# http://localhost            웹
# http://localhost:8333       SeaweedFS S3 (업로드 이미지)
```

MySQL·Redis·SeaweedFS(S3 호환)가 함께 뜨고, 백엔드가 시작하면서 Flyway로 스키마를 만듭니다.

#### 토스페이먼츠 테스트 결제 해 보기

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에서 **API 키 → 결제위젯 연동 키**의 테스트 클라이언트 키(`test_gck_…`)와 시크릿 키(`test_gsk_…`)를 확인합니다.
2. `.env`의 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`에 넣고 `docker compose up -d --build backend`.
3. 주문서·커미션 선결제 화면에 결제위젯이 나타나고, 테스트 결제는 실제로 출금되지 않습니다. 시크릿 키는 저장소에 올리지 마세요.

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

> **2단계까지 쓰던 로컬 DB가 있다면**: 3단계부터 스키마는 Flyway가 관리합니다. 기존 DB는 자동으로 V1 기준선으로 등록된 뒤 V2(결제·정산·테마)와 MySQL 정리 스크립트가 적용됩니다. 깨끗하게 시작하려면 `docker compose down -v` 후 `docker compose up --build` 하세요.

## 환경 변수

| 이름 | 설명 |
| --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL / RDS 접속 정보 |
| `JWT_SECRET` | 32바이트 이상 서명 키 (운영 필수) |
| `CORS_ALLOWED_ORIGINS` | 프론트엔드 도메인 |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | (선택) Claude 큐레이션 |
| `YOUTUBE_API_KEY` | (선택) 음악 추천 영상 검색 |
| `SEED_ENABLED`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | 예시 데이터·관리자 계정 |
| `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | (선택) 토스페이먼츠 **결제위젯 연동 키**. 없으면 모의 결제 |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_BASE_URL`, `S3_PATH_STYLE` | 이미지 저장소. 버킷이 없으면 서버 디스크(`UPLOAD_DIR`) |
| `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT` | 실시간 알림 Pub/Sub (끄면 단일 서버 모드) |
| `COMMISSION_FEE_RATE` | 커미션 정산 수수료율 (기본 0.10) |

## 폴더 구조

```
backend/   Spring Boot API (도메인별 패키지: member, product, preference, review, post, notification, admin, music,
           cart, wishlist, coupon, order, commission, payment, theme, upload)
           resources/db/migration  Flyway 스크립트
frontend/  React + Vite SPA (pages / components / api / auth), public/images = Figma 에셋
docs/      ERD·API 문서
.github/   CI / CD 워크플로
```

자세한 테이블 구조와 API는 [docs/architecture.md](docs/architecture.md)를 참고하세요.
