package com.yeoun.member.dto;

import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record SignupRequest(
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식이 올바르지 않습니다.") String email,
            @NotBlank(message = "비밀번호를 입력해 주세요.")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$",
                    message = "비밀번호는 영문·숫자·특수문자를 조합해 8자 이상이어야 합니다.") String password,
            @NotBlank(message = "이름을 입력해 주세요.") @Size(max = 40) String name,
            @NotBlank(message = "휴대전화 번호를 입력해 주세요.")
            @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대전화 번호 형식이 올바르지 않습니다.") String phone,
            @AssertTrue(message = "이용약관에 동의해 주세요.") boolean termsAgreed,
            @AssertTrue(message = "개인정보 수집 및 이용에 동의해 주세요.") boolean privacyAgreed,
            boolean marketingAgreed,
            boolean perfumer,
            @Valid PerfumerApplicationRequest perfumerApplication) {
    }

    public record PerfumerApplicationRequest(
            @Size(max = 80) String studioName,
            @Min(value = 0, message = "경력은 0년 이상이어야 합니다.") @Max(60) int careerYears,
            @Size(max = 200) String certification,
            @Size(max = 300) String portfolioUrl,
            @NotBlank(message = "조향사 소개를 입력해 주세요.") @Size(max = 1000) String introduction) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record TokenResponse(String accessToken, long expiresIn, MemberResponse member) {
    }

    public record MemberResponse(Long id, String email, String name, String phone, String role, String grade,
                                 String gradeLabel, String perfumerStatus) {

        public static MemberResponse of(Member m, PerfumerApplication application) {
            return new MemberResponse(m.getId(), m.getEmail(), m.getName(), m.getPhone(), m.getRole().name(),
                    m.getGrade().name(), m.getGrade().getLabel(),
                    application == null ? null : application.getStatus().name());
        }
    }
}
