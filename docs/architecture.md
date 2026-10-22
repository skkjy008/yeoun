# 여운 — 설계 문서

## 시스템 구성

```mermaid
flowchart LR
  user((사용자)) --> nginx[Nginx<br/>React 정적 파일]
  nginx -- /api --> api[Spring Boot API]
  api --> db[(MySQL / RDS)]
  api -. 선택 .-> claude[Claude API<br/>취향 큐레이션]
  api -. 선택 .-> yt[YouTube Data API<br/>음악 영상]
  gh[GitHub Actions] -- 이미지 --> ghcr[(GHCR)] -- pull --> ec2[EC2<br/>docker compose]
```

## ERD

```mermaid
erDiagram
  member ||--o| perfumer_application : "조향사 인증 신청"
  member ||--o{ notification : "받는 알림"
  member ||--o{ member_preference : "취향 답변"
  member ||--o{ review : "작성"
  preference_question ||--o{ preference_option : "선택지"
  preference_question ||--o{ member_preference : ""
  preference_option ||--o{ member_preference : ""
  product ||--o{ review : ""
  product ||--o{ product_note : ""
  product ||--o{ product_ritual_step : ""
  product ||--o{ product_poem_line : ""
  product ||--o{ product_track : ""
  product ||--o{ product_tag : ""
  member ||--o{ cart_item : "장바구니"
  product ||--o{ cart_item : ""
  member ||--o{ wishlist_item : "찜"
  product ||--o{ wishlist_item : ""
  member ||--o{ coupon : "보유"
  member ||--o{ orders : "주문"
  orders ||--|{ order_item : "주문 상품"
  product ||--o{ order_item : ""
  coupon |o--o| orders : "적용"
  member ||--o{ commission : "의뢰"
  commission ||--o{ commission_proposal : "제안"
  member ||--o{ commission_proposal : "조향사"

  member {
    bigint id PK
    varchar email UK
    varchar password "BCrypt"
    varchar name
    varchar phone
    varchar role "USER / PERFUMER / ADMIN"
    varchar grade "BRONZE ~ DIAMOND"
    boolean marketing_agreed
    int point_balance "적립금"
    varchar zip_code "기본 배송지"
  }
  perfumer_application {
    bigint id PK
    bigint member_id FK
    varchar studio_name
    int career_years
    varchar certification
    varchar portfolio_url
    varchar introduction
    varchar status "PENDING / APPROVED / REJECTED"
  }
  product {
    bigint id PK
    char inc_cd "001 방향제 · 002 인센스 · 003 향수 · 004 캔들"
    varchar name
    varchar subtitle
    int price
    int stock "0 → SOLD OUT"
    int intensity "1~3 무게감"
    int popularity
    boolean is_new
    boolean active
  }
  preference_question {
    bigint id PK
    int question_no UK
    varchar step_label
    varchar title
    varchar layout "GRID / LIST"
  }
  preference_option {
    bigint id PK
    bigint question_id FK
    int option_no
    varchar label
    varchar tags "향 계열 태그"
    varchar category_hint "선호 inc_cd"
    int intensity
  }
  member_preference {
    bigint id PK
    bigint member_id FK
    bigint question_id FK
    bigint option_id FK
  }
  review {
    bigint id PK
    bigint product_id FK
    bigint member_id FK
    int rating "1~5"
    varchar content
    boolean featured
  }
  post {
    bigint id PK
    varchar type "BANNER / NOTICE / EVENT"
    varchar title
    varchar cta_link
    int sort_order
    boolean published
  }
  cart_item {
    bigint id PK
    bigint member_id FK
    bigint product_id FK "member+product UK"
    int quantity "1~10"
  }
  wishlist_item {
    bigint id PK
    bigint member_id FK
    bigint product_id FK "member+product UK"
  }
  coupon {
    bigint id PK
    bigint member_id FK
    varchar code "WELCOME ..."
    int discount_amount
    int min_order_amount
    datetime expires_at
    datetime used_at
  }
  orders {
    bigint id PK
    varchar order_number UK "YN-yyyyMMdd-####"
    bigint member_id FK
    varchar status "PAID → PREPARING → SHIPPING → DELIVERED / CANCELLED"
    varchar recipient_name
    varchar zip_code
    varchar address1
    varchar payment_method "CARD / TRANSFER / EASY_PAY"
    varchar payment_approval_no "모의 승인 번호"
    bigint coupon_id FK
    int items_amount
    int coupon_discount
    int point_used
    int shipping_fee
    int total_amount
    int earned_point
  }
  order_item {
    bigint id PK
    bigint order_id FK
    bigint product_id FK
    varchar product_name "주문 시점 스냅샷"
    int unit_price
    int quantity
  }
  commission {
    bigint id PK
    bigint requester_id FK
    varchar title
    char inc_cd "선택"
    varchar moods
    varchar description
    int budget
    date desired_date
    varchar status "OPEN → IN_PROGRESS → DELIVERED → COMPLETED / CANCELLED"
    bigint perfumer_id FK "선택된 조향사"
    int agreed_price "선결제 금액"
    int scent_rating "향 만족도"
    int perfumer_rating "조향사 평가"
  }
  commission_proposal {
    bigint id PK
    bigint commission_id FK
    bigint perfumer_id FK "commission+perfumer UK"
    int price
    int working_days
    varchar status "PROPOSED / ACCEPTED / DECLINED"
  }
  notification {
    bigint id PK
    bigint recipient_id FK
    varchar type
    varchar message
    boolean is_read
  }
```

## 취향 추천 로직

1. 6개 질문의 선택지마다 **향 계열 태그**(WOODY, GREEN, CITRUS …), **선호 향 종류**(사용 장면 질문), **무게감**(잔향 질문)을 저장해 둡니다.
2. 회원의 답변을 모아 `ScentProfile`(태그 가중치 · 선호 카테고리 · 무게감)을 만듭니다.
3. 상품 점수 = Σ(상품 태그 × 가중치 × 3) + 선호 카테고리 일치 6점 + 무게감 근접도(최대 4점), 동점은 인기도 순.
4. 상위 4개를 추천하고, `ANTHROPIC_API_KEY`가 있으면 Claude가 답변·키워드·추천 상품을 바탕으로 큐레이션 문장을 씁니다. 실패하거나 키가 없으면 규칙 기반 문장으로 대체합니다.
5. 메인 페이지는 `/api/preferences/me`(AI 호출 없음)로 맞춤 추천을 받아 히어로 바로 아래에 보여 줍니다.

## 주문 · 결제 흐름

1. 주문서 제출 → 상품을 `SELECT … FOR UPDATE`(비관적 잠금)로 읽어 재고 확인·차감 (동시 주문 시 초과 판매 방지)
2. 쿠폰 사용(본인·기간·최소 금액 검증) → 적립금 차감 → 배송비(5만원 이상 무료) 계산
3. `MockPaymentGateway`가 승인 번호 발급 → 주문 저장, 장바구니 정리, 알림 발송 — 모두 한 트랜잭션
4. 취소 시 재고·쿠폰·적립금을 되돌리고, 배송 완료 시 1% 적립 + 누적 금액으로 등급 상향

## 커미션 · 실시간 알림

```mermaid
sequenceDiagram
  actor U as 의뢰인
  participant API as Spring Boot
  actor P as 인증 조향사들
  U->>API: POST /api/commissions
  API-->>P: COMMISSION_REQUEST 알림 (DB 저장 + 커밋 후 SSE 전송)
  P->>API: POST /{id}/proposals (가격·기간·방향)
  API-->>U: COMMISSION_PROPOSAL 알림
  U->>API: POST /{id}/proposals/{pid}/accept (선결제)
  API-->>P: 선택된 조향사에게 COMMISSION_ACCEPTED, 나머지 제안은 DECLINED
  P->>API: POST /{id}/deliver
  U->>API: POST /{id}/review (향 만족도 + 조향사 평가)
```

알림은 `NotificationService`가 저장과 동시에 이벤트를 발행하고, `@TransactionalEventListener`가 **커밋 이후에만** `SseEmitter`로 전송합니다. 브라우저는 `EventSource` 대신 fetch 스트림을 사용해 `Authorization` 헤더를 실어 보내며, Nginx는 해당 경로의 버퍼링을 끕니다.

## 주요 API

| Method | Path | 권한 | 설명 |
| --- | --- | --- | --- |
| POST | /api/auth/signup | - | 회원가입 (조향사 신청 포함) |
| POST | /api/auth/login | - | 로그인 → JWT |
| GET | /api/members/me | 회원 | 내 정보 |
| GET | /api/products | - | 목록 (category, keyword, feeling, scene, minPrice, maxPrice, sort, page, size) |
| GET | /api/products/{id} | - | 상세 |
| GET | /api/products/popular · /new | - | 메인 인기 · 신상품 |
| GET | /api/categories/{slug}/filters | - | 카테고리 필터 값 |
| GET/POST | /api/products/{id}/reviews | -/회원 | 리뷰 목록 / 작성 |
| GET | /api/reviews/featured | - | 메인 후기 |
| GET | /api/posts?type=BANNER | - | 메인 배너 |
| GET | /api/preferences/questions | - | 향 찾기 질문 |
| POST | /api/preferences | 회원 | 답변 저장 + 추천 |
| GET | /api/preferences/me | 회원 | 내 추천 (없으면 204) |
| GET | /api/music/youtube?q= | - | 트랙 → YouTube 영상 |
| GET/PATCH | /api/notifications… | 회원 | 알림 목록·읽음 처리 |
| GET | /api/notifications/stream | 회원 | 실시간 알림 (SSE) |
| GET/POST/PATCH/DELETE | /api/cart, /api/cart/items… | 회원 | 장바구니 |
| GET/PUT/DELETE | /api/wishlist… | 회원 | 찜한 향 |
| GET | /api/coupons/me | 회원 | 내 쿠폰 |
| POST/GET | /api/orders | 회원 | 주문(모의 결제) / 내 주문 목록 |
| GET/POST | /api/orders/{id}, /cancel | 회원 | 주문 상세 / 취소 |
| GET | /api/members/me/summary | 회원 | 마이페이지 요약 |
| PUT/PATCH | /api/members/me, /password, /address | 회원 | 회원정보·비밀번호·기본 배송지 |
| GET | /api/reviews/me | 회원 | 나의 의견 |
| GET | /api/commissions | - | 의뢰 게시판 |
| POST/GET | /api/commissions, /{id}, /me, /proposed | 회원 | 의뢰 등록·상세·내 의뢰·내 제안 |
| POST | /api/commissions/{id}/proposals, …/accept, /deliver, /review, /cancel | 조향사/의뢰인 | 제안 → 선결제 → 전달 → 후기 |
| GET/PATCH | /api/admin/orders… | 관리자 | 주문 목록·상태 변경 |
| * | /api/admin/products… | 관리자 | 상품 CRUD · 재고 |
| * | /api/admin/members… | 관리자 | 고객 목록 · 권한/등급 변경 |
| * | /api/admin/perfumer-applications… | 관리자 | 조향사 인증 승인/반려 |
| * | /api/admin/posts… | 관리자 | 배너·공지 게시글 CRUD |

전체 스펙은 백엔드 실행 후 `/api/docs`(Swagger UI)에서 확인할 수 있습니다.
