package com.yeoun.member.domain;

import com.yeoun.global.common.BaseTimeEntity;
import com.yeoun.global.exception.ApiException;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "member")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 40)
    private String name;

    @Column(length = 20)
    private String phone;

    /** 권한 속성: USER / PERFUMER / ADMIN */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** 등급 속성: BRONZE ~ DIAMOND */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Grade grade;

    @Column(name = "marketing_agreed", nullable = false)
    private boolean marketingAgreed;

    /** 보유 적립금 */
    @Column(name = "point_balance", nullable = false)
    private int point;

    /** 기본 배송지 */
    @Embedded
    private Address address;

    @Builder
    private Member(String email, String password, String name, String phone, Role role, Grade grade,
                   boolean marketingAgreed) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.role = role == null ? Role.USER : role;
        this.grade = grade == null ? Grade.BRONZE : grade;
        this.marketingAgreed = marketingAgreed;
    }

    public void promoteToPerfumer() {
        if (role == Role.USER) {
            this.role = Role.PERFUMER;
        }
    }

    public void changeGrade(Grade grade) {
        this.grade = grade;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public void updateProfile(String name, String phone, boolean marketingAgreed) {
        this.name = name;
        this.phone = phone;
        this.marketingAgreed = marketingAgreed;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void changeAddress(Address address) {
        this.address = address;
    }

    public void addPoint(int amount) {
        this.point += Math.max(0, amount);
    }

    public void usePoint(int amount) {
        if (amount < 0 || amount > point) {
            throw ApiException.badRequest("사용할 수 있는 적립금을 초과했습니다.");
        }
        this.point -= amount;
    }

    /** 누적 구매 금액에 따라 등급을 올립니다. 운영자가 지정한 등급보다 낮아지지는 않습니다. */
    public void upgradeGradeBySpending(long totalSpent) {
        Grade earned = Grade.fromSpending(totalSpent);
        if (earned.ordinal() > grade.ordinal()) {
            this.grade = earned;
        }
    }
}
