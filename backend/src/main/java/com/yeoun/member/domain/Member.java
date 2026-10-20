package com.yeoun.member.domain;

import com.yeoun.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
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
}
