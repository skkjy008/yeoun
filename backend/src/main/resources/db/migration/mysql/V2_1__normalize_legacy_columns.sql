-- MySQL 전용: 2단계까지 Hibernate(ddl-auto=update)가 만든 기존 DB 정리
--  · enum 컬럼 → varchar (새 상태 값 추가 시 오류 방지)
--  · 결제 승인 번호 길이 확장 (토스페이먼츠 paymentKey 저장)
-- 새로 만든 DB(V1)에서는 이미 같은 정의라 아무 변화가 없습니다.

alter table member modify role varchar(20) not null;
alter table member modify grade varchar(20) not null;
alter table perfumer_application modify status varchar(20) not null;
alter table post modify type varchar(20) not null;
alter table notification modify type varchar(40) not null;
alter table orders modify status varchar(20) not null;
alter table orders modify payment_method varchar(20) not null;
alter table orders modify payment_approval_no varchar(200);
alter table commission modify status varchar(20) not null;
alter table commission modify payment_method varchar(20);
alter table commission modify payment_approval_no varchar(200);
alter table commission_proposal modify status varchar(20) not null;
