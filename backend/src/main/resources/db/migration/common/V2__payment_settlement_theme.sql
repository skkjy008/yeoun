-- 3단계: 토스페이먼츠 결제, 커미션 정산·환불, 테마 큐레이션

alter table member add column customer_key varchar(64);
alter table member add constraint uk_member_customer_key unique (customer_key);

alter table orders add column from_cart boolean default false not null;

alter table commission add column started_at datetime(6);
alter table commission add column confirmed_at datetime(6);
alter table commission add column cancelled_at datetime(6);
alter table commission add column cancel_reason varchar(300);
alter table commission add column refund_amount integer;
alter table commission add column reference_images varchar(1000);

create table payment (
    id              bigint       not null auto_increment,
    member_id       bigint       not null,
    target_type     varchar(20)  not null,
    target_id       bigint       not null,
    target_ref      bigint,
    order_key       varchar(64)  not null,
    order_name      varchar(100) not null,
    provider        varchar(20)  not null,
    amount          integer      not null,
    status          varchar(20)  not null,
    payment_key     varchar(200),
    method_label    varchar(40),
    receipt_url     varchar(500),
    approved_at     datetime(6),
    canceled_amount integer      default 0 not null,
    canceled_at     datetime(6),
    failure_code    varchar(60),
    failure_message varchar(300),
    created_at      datetime(6)  not null,
    updated_at      datetime(6)  not null,
    primary key (id),
    constraint uk_payment_order_key unique (order_key),
    constraint uk_payment_payment_key unique (payment_key),
    constraint fk_payment_member foreign key (member_id) references member (id)
);
create index idx_payment_target on payment (target_type, target_id);

create table settlement (
    id            bigint      not null auto_increment,
    commission_id bigint      not null,
    perfumer_id   bigint      not null,
    reason        varchar(20) not null,
    gross_amount  integer     not null,
    fee_amount    integer     not null,
    net_amount    integer     not null,
    status        varchar(20) not null,
    paid_at       datetime(6),
    created_at    datetime(6) not null,
    updated_at    datetime(6) not null,
    primary key (id),
    constraint uk_settlement_commission unique (commission_id),
    constraint fk_settlement_commission foreign key (commission_id) references commission (id),
    constraint fk_settlement_perfumer foreign key (perfumer_id) references member (id)
);
create index idx_settlement_perfumer on settlement (perfumer_id, status);

create table theme (
    id             bigint        not null auto_increment,
    slug           varchar(60)   not null,
    eyebrow        varchar(60),
    title          varchar(120)  not null,
    subtitle       varchar(200),
    story          varchar(2000),
    hero_image_url varchar(300)  not null,
    starts_on      date,
    ends_on        date,
    sort_order     integer       not null,
    published      boolean       not null,
    created_at     datetime(6)   not null,
    updated_at     datetime(6)   not null,
    primary key (id),
    constraint uk_theme_slug unique (slug)
);

create table theme_product (
    id         bigint       not null auto_increment,
    theme_id   bigint       not null,
    product_id bigint       not null,
    sort_order integer      not null,
    note       varchar(200),
    primary key (id),
    constraint fk_theme_product_theme foreign key (theme_id) references theme (id),
    constraint fk_theme_product_product foreign key (product_id) references product (id)
);
