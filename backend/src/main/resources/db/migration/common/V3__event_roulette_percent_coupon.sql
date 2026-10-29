-- 이벤트(테마 특가·룰렛·신규 가입 쿠폰), 룰렛 기록, 정률(%) 쿠폰

alter table coupon add column discount_rate integer;
alter table coupon add column max_discount_amount integer;

create table event (
    id            bigint        not null auto_increment,
    slug          varchar(60)   not null,
    kind          varchar(20)   not null,
    title         varchar(100)  not null,
    summary       varchar(300)  not null,
    body          varchar(2000),
    thumbnail_url varchar(300)  not null,
    starts_on     date,
    ends_on       date,
    theme_slug    varchar(60),
    discount_rate integer,
    sort_order    integer       not null,
    published     boolean       not null,
    created_at    datetime(6)   not null,
    updated_at    datetime(6)   not null,
    primary key (id),
    constraint uk_event_slug unique (slug)
);

create table roulette_spin (
    id         bigint      not null auto_increment,
    member_id  bigint      not null,
    spun_on    date        not null,
    prize      varchar(20) not null,
    coupon_id  bigint,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    primary key (id),
    constraint uk_roulette_member_day unique (member_id, spun_on),
    constraint fk_roulette_spin_member foreign key (member_id) references member (id),
    constraint fk_roulette_spin_coupon foreign key (coupon_id) references coupon (id)
);
