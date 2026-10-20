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

  member {
    bigint id PK
    varchar email UK
    varchar password "BCrypt"
    varchar name
    varchar phone
    varchar role "USER / PERFUMER / ADMIN"
    varchar grade "BRONZE ~ DIAMOND"
    boolean marketing_agreed
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
| * | /api/admin/products… | 관리자 | 상품 CRUD · 재고 |
| * | /api/admin/members… | 관리자 | 고객 목록 · 권한/등급 변경 |
| * | /api/admin/perfumer-applications… | 관리자 | 조향사 인증 승인/반려 |
| * | /api/admin/posts… | 관리자 | 배너·공지 게시글 CRUD |

전체 스펙은 백엔드 실행 후 `/api/docs`(Swagger UI)에서 확인할 수 있습니다.
