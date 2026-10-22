package com.yeoun.notification.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 사용자 알림. 조향사 인증 요청(운영자 대상), 커미션 의뢰(조향사 대상) 등에 사용합니다. */
@Getter
@Entity
@Table(name = "notification", indexes = @Index(name = "idx_notification_recipient", columnList = "recipient_id, is_read"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

    public enum Type {
        PERFUMER_APPLICATION, PERFUMER_APPROVED, PERFUMER_REJECTED, ORDER_STATUS,
        COMMISSION_REQUEST, COMMISSION_PROPOSAL, COMMISSION_ACCEPTED, COMMISSION_DELIVERED, COMMISSION_REVIEWED, SYSTEM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Member recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private Type type;

    @Column(nullable = false, length = 300)
    private String message;

    @Column(length = 200)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    public Notification(Member recipient, Type type, String message, String link) {
        this.recipient = recipient;
        this.type = type;
        this.message = message;
        this.link = link;
    }

    public void markRead() {
        this.read = true;
    }
}
