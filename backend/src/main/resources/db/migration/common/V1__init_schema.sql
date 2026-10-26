-- 여운 2단계까지의 스키마 (Hibernate 엔티티와 1:1)
-- H2(MySQL 모드)와 MySQL 8에서 함께 동작하도록 표준 문법만 사용합니다.

create table member (
    id               bigint       not null auto_increment,
    email            varchar(120) not null,
    password         varchar(255) not null,
    name             varchar(40)  not null,
    phone            varchar(20),
    role             varchar(20)  not null,
    grade            varchar(20)  not null,
    marketing_agreed boolean      not null,
    point_balance    integer      default 0 not null,
    recipient_name   varchar(40),
    recipient_phone  varchar(20),
    zip_code         varchar(10),
    address1         varchar(200),
    address2         varchar(200),
    created_at       datetime(6)  not null,
    updated_at       datetime(6)  not null,
    primary key (id),
    constraint uk_member_email unique (email)
);

create table perfumer_application (
    id            bigint       not null auto_increment,
    member_id     bigint       not null,
    studio_name   varchar(80),
    career_years  integer      not null,
    certification varchar(200),
    portfolio_url varchar(300),
    introduction  varchar(1000),
    status        varchar(20)  not null,
    reviewed_at   datetime(6),
    reject_reason varchar(300),
    created_at    datetime(6)  not null,
    updated_at    datetime(6)  not null,
    primary key (id),
    constraint uk_perfumer_application_member unique (member_id),
    constraint fk_perfumer_application_member foreign key (member_id) references member (id)
);

create table notification (
    id           bigint       not null auto_increment,
    recipient_id bigint       not null,
    type         varchar(40)  not null,
    message      varchar(300) not null,
    link         varchar(200),
    is_read      boolean      not null,
    created_at   datetime(6)  not null,
    updated_at   datetime(6)  not null,
    primary key (id),
    constraint fk_notification_recipient foreign key (recipient_id) references member (id)
);
create index idx_notification_recipient on notification (recipient_id, is_read);

create table product (
    id              bigint       not null auto_increment,
    inc_cd          varchar(3)   not null,
    name            varchar(60)  not null,
    subtitle        varchar(120) not null,
    english_line    varchar(80),
    type_label      varchar(20)  not null,
    volume          varchar(20)  not null,
    price           integer      not null,
    stock           integer      not null,
    image_url       varchar(200) not null,
    thumbnail_url   varchar(200),
    artwork_url     varchar(200),
    artwork_caption varchar(80),
    scent_family    varchar(60),
    feeling         varchar(20),
    scene           varchar(30),
    best_place      varchar(100),
    composition     varchar(100),
    story_title     varchar(100),
    story_body      varchar(600),
    safety_notice   varchar(600),
    playlist_title  varchar(60),
    intensity       integer      not null,
    popularity      integer      not null,
    is_new          boolean      not null,
    active          boolean      not null,
    created_at      datetime(6)  not null,
    updated_at      datetime(6)  not null,
    primary key (id)
);
create index idx_product_inc_cd on product (inc_cd);
create index idx_product_active on product (active);

create table product_note (
    product_id       bigint      not null,
    sort_order       integer     not null,
    note_name        varchar(40) not null,
    note_description varchar(200),
    primary key (product_id, sort_order),
    constraint fk_product_note_product foreign key (product_id) references product (id)
);

create table product_ritual_step (
    product_id bigint  not null,
    sort_order integer not null,
    step       varchar(200),
    primary key (product_id, sort_order),
    constraint fk_product_ritual_step_product foreign key (product_id) references product (id)
);

create table product_poem_line (
    product_id bigint  not null,
    sort_order integer not null,
    line       varchar(120),
    primary key (product_id, sort_order),
    constraint fk_product_poem_line_product foreign key (product_id) references product (id)
);

create table product_track (
    product_id       bigint       not null,
    sort_order       integer      not null,
    track_title      varchar(120) not null,
    track_artist     varchar(120),
    youtube_video_id varchar(20),
    primary key (product_id, sort_order),
    constraint fk_product_track_product foreign key (product_id) references product (id)
);

create table product_tag (
    product_id bigint      not null,
    tag        varchar(20) not null,
    primary key (product_id, tag),
    constraint fk_product_tag_product foreign key (product_id) references product (id)
);

create table preference_question (
    id            bigint       not null auto_increment,
    question_no   integer      not null,
    step_label    varchar(20)  not null,
    english_label varchar(40)  not null,
    title         varchar(120) not null,
    guide         varchar(120),
    layout        varchar(10)  not null,
    primary key (id),
    constraint uk_preference_question_no unique (question_no)
);

create table preference_option (
    id            bigint       not null auto_increment,
    question_id   bigint       not null,
    option_no     integer      not null,
    label         varchar(120) not null,
    image_url     varchar(200),
    tags          varchar(120),
    category_hint varchar(20),
    intensity     integer,
    primary key (id),
    constraint uk_option_no unique (question_id, option_no),
    constraint fk_preference_option_question foreign key (question_id) references preference_question (id)
);

create table member_preference (
    id          bigint      not null auto_increment,
    member_id   bigint      not null,
    question_id bigint      not null,
    option_id   bigint      not null,
    created_at  datetime(6) not null,
    updated_at  datetime(6) not null,
    primary key (id),
    constraint uk_member_question unique (member_id, question_id),
    constraint fk_member_preference_member foreign key (member_id) references member (id),
    constraint fk_member_preference_question foreign key (question_id) references preference_question (id),
    constraint fk_member_preference_option foreign key (option_id) references preference_option (id)
);

create table review (
    id         bigint       not null auto_increment,
    product_id bigint       not null,
    member_id  bigint       not null,
    rating     integer      not null,
    headline   varchar(80),
    content    varchar(500) not null,
    featured   boolean      not null,
    created_at datetime(6)  not null,
    updated_at datetime(6)  not null,
    primary key (id),
    constraint fk_review_product foreign key (product_id) references product (id),
    constraint fk_review_member foreign key (member_id) references member (id)
);
create index idx_review_product on review (product_id);

create table post (
    id         bigint        not null auto_increment,
    type       varchar(20)   not null,
    eyebrow    varchar(60),
    title      varchar(120)  not null,
    body       varchar(1000),
    cta_label  varchar(40),
    cta_link   varchar(200),
    image_url  varchar(200),
    caption    varchar(80),
    footnote   varchar(120),
    sort_order integer       not null,
    published  boolean       not null,
    created_at datetime(6)   not null,
    updated_at datetime(6)   not null,
    primary key (id)
);

create table cart_item (
    id         bigint      not null auto_increment,
    member_id  bigint      not null,
    product_id bigint      not null,
    quantity   integer     not null,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    primary key (id),
    constraint uk_cart_member_product unique (member_id, product_id),
    constraint fk_cart_item_member foreign key (member_id) references member (id),
    constraint fk_cart_item_product foreign key (product_id) references product (id)
);

create table wishlist_item (
    id         bigint      not null auto_increment,
    member_id  bigint      not null,
    product_id bigint      not null,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    primary key (id),
    constraint uk_wishlist_member_product unique (member_id, product_id),
    constraint fk_wishlist_item_member foreign key (member_id) references member (id),
    constraint fk_wishlist_item_product foreign key (product_id) references product (id)
);

create table coupon (
    id               bigint      not null auto_increment,
    member_id        bigint      not null,
    code             varchar(30) not null,
    name             varchar(60) not null,
    discount_amount  integer     not null,
    min_order_amount integer     not null,
    expires_at       datetime(6) not null,
    used_at          datetime(6),
    created_at       datetime(6) not null,
    updated_at       datetime(6) not null,
    primary key (id),
    constraint fk_coupon_member foreign key (member_id) references member (id)
);
create index idx_coupon_member on coupon (member_id);

create table orders (
    id                  bigint       not null auto_increment,
    order_number        varchar(20)  not null,
    member_id           bigint       not null,
    status              varchar(20)  not null,
    orderer_name        varchar(40)  not null,
    orderer_phone       varchar(20)  not null,
    orderer_email       varchar(120) not null,
    recipient_name      varchar(40),
    recipient_phone     varchar(20),
    zip_code            varchar(10),
    address1            varchar(200),
    address2            varchar(200),
    delivery_memo       varchar(100),
    payment_method      varchar(20)  not null,
    payment_provider    varchar(30),
    payment_approval_no varchar(200),
    coupon_id           bigint,
    items_amount        integer      not null,
    coupon_discount     integer      not null,
    point_used          integer      not null,
    shipping_fee        integer      not null,
    total_amount        integer      not null,
    earned_point        integer      not null,
    paid_at             datetime(6),
    cancelled_at        datetime(6),
    created_at          datetime(6)  not null,
    updated_at          datetime(6)  not null,
    primary key (id),
    constraint uk_orders_order_number unique (order_number),
    constraint fk_orders_member foreign key (member_id) references member (id),
    constraint fk_orders_coupon foreign key (coupon_id) references coupon (id)
);
create index idx_orders_member on orders (member_id, created_at);

create table order_item (
    id           bigint       not null auto_increment,
    order_id     bigint       not null,
    product_id   bigint       not null,
    product_name varchar(60)  not null,
    type_label   varchar(20)  not null,
    volume       varchar(20)  not null,
    image_url    varchar(200) not null,
    unit_price   integer      not null,
    quantity     integer      not null,
    line_amount  integer      not null,
    primary key (id),
    constraint fk_order_item_order foreign key (order_id) references orders (id),
    constraint fk_order_item_product foreign key (product_id) references product (id)
);

create table commission (
    id                  bigint        not null auto_increment,
    requester_id        bigint        not null,
    title               varchar(60)   not null,
    inc_cd              varchar(3),
    moods               varchar(200),
    description         varchar(2000) not null,
    budget              integer       not null,
    desired_date        date,
    status              varchar(20)   not null,
    perfumer_id         bigint,
    agreed_price        integer,
    payment_method      varchar(20),
    payment_approval_no varchar(200),
    paid_at             datetime(6),
    delivery_note       varchar(1000),
    delivered_at        datetime(6),
    scent_rating        integer,
    perfumer_rating     integer,
    review_content      varchar(1000),
    reviewed_at         datetime(6),
    created_at          datetime(6)   not null,
    updated_at          datetime(6)   not null,
    primary key (id),
    constraint fk_commission_requester foreign key (requester_id) references member (id),
    constraint fk_commission_perfumer foreign key (perfumer_id) references member (id)
);
create index idx_commission_status on commission (status, created_at);
create index idx_commission_requester on commission (requester_id);

create table commission_proposal (
    id            bigint        not null auto_increment,
    commission_id bigint        not null,
    perfumer_id   bigint        not null,
    price         integer       not null,
    working_days  integer       not null,
    message       varchar(1000) not null,
    status        varchar(20)   not null,
    created_at    datetime(6)   not null,
    updated_at    datetime(6)   not null,
    primary key (id),
    constraint uk_proposal_commission_perfumer unique (commission_id, perfumer_id),
    constraint fk_commission_proposal_commission foreign key (commission_id) references commission (id),
    constraint fk_commission_proposal_perfumer foreign key (perfumer_id) references member (id)
);
