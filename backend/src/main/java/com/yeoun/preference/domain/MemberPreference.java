package com.yeoun.preference.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.member.domain.Member;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 취향 테이블: 회원별로 각 질문에 고른 선택지를 저장합니다. 다시 참여하면 덮어씁니다. */
@Getter
@Entity
@Table(name = "member_preference",
        uniqueConstraints = @UniqueConstraint(name = "uk_member_question", columnNames = {"member_id", "question_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberPreference extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private PreferenceQuestion question;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "option_id", nullable = false)
    private PreferenceOption option;

    public MemberPreference(Member member, PreferenceQuestion question, PreferenceOption option) {
        this.member = member;
        this.question = question;
        this.option = option;
    }

    public void change(PreferenceOption option) {
        this.option = option;
    }
}
