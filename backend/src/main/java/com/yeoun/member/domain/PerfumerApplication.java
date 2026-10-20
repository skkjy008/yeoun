package com.yeoun.member.domain;

import com.yeoun.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 조향사 인증 신청서. 회원가입 시 '조향사입니다'를 선택하면 생성되고, 운영자 승인 후 권한이 부여됩니다. */
@Getter
@Entity
@Table(name = "perfumer_application")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PerfumerApplication extends BaseTimeEntity {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    @Column(name = "studio_name", length = 80)
    private String studioName;

    @Column(name = "career_years", nullable = false)
    private int careerYears;

    @Column(length = 200)
    private String certification;

    @Column(name = "portfolio_url", length = 300)
    private String portfolioUrl;

    @Column(length = 1000)
    private String introduction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reject_reason", length = 300)
    private String rejectReason;

    @Builder
    private PerfumerApplication(Member member, String studioName, int careerYears, String certification,
                                String portfolioUrl, String introduction) {
        this.member = member;
        this.studioName = studioName;
        this.careerYears = careerYears;
        this.certification = certification;
        this.portfolioUrl = portfolioUrl;
        this.introduction = introduction;
        this.status = Status.PENDING;
    }

    public void approve() {
        this.status = Status.APPROVED;
        this.reviewedAt = LocalDateTime.now();
        this.rejectReason = null;
        member.promoteToPerfumer();
    }

    public void reject(String reason) {
        this.status = Status.REJECTED;
        this.reviewedAt = LocalDateTime.now();
        this.rejectReason = reason;
    }
}
