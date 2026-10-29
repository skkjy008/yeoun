package com.yeoun.event.domain;

import com.yeoun.coupon.domain.Coupon;
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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 룰렛 기록. 회원 + 날짜에 유니크 제약을 걸어 동시에 눌러도 하루 한 번만 저장됩니다. */
@Getter
@Entity
@Table(name = "roulette_spin", uniqueConstraints = @UniqueConstraint(name = "uk_roulette_member_day",
        columnNames = {"member_id", "spun_on"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RouletteSpin extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "spun_on", nullable = false)
    private LocalDate spunOn;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private RoulettePrize prize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    public RouletteSpin(Member member, LocalDate spunOn, RoulettePrize prize, Coupon coupon) {
        this.member = member;
        this.spunOn = spunOn;
        this.prize = prize;
        this.coupon = coupon;
    }
}
