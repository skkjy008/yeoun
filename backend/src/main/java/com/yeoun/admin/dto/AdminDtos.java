package com.yeoun.admin.dto;

import com.yeoun.member.domain.Grade;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record MemberRow(Long id, String email, String name, String phone, String role, String grade,
                            String gradeLabel, boolean marketingAgreed, LocalDateTime createdAt) {
        public static MemberRow from(Member m) {
            return new MemberRow(m.getId(), m.getEmail(), m.getName(), m.getPhone(), m.getRole().name(),
                    m.getGrade().name(), m.getGrade().getLabel(), m.isMarketingAgreed(), m.getCreatedAt());
        }
    }

    public record MemberUpdateRequest(Role role, Grade grade) {
    }

    public record ApplicationRow(Long id, Long memberId, String memberName, String memberEmail, String studioName,
                                 int careerYears, String certification, String portfolioUrl, String introduction,
                                 String status, String rejectReason, LocalDateTime createdAt,
                                 LocalDateTime reviewedAt) {
        public static ApplicationRow from(PerfumerApplication a) {
            Member m = a.getMember();
            return new ApplicationRow(a.getId(), m.getId(), m.getName(), m.getEmail(), a.getStudioName(),
                    a.getCareerYears(), a.getCertification(), a.getPortfolioUrl(), a.getIntroduction(),
                    a.getStatus().name(), a.getRejectReason(), a.getCreatedAt(), a.getReviewedAt());
        }
    }

    public record RejectRequest(@Size(max = 300) String reason) {
    }
}
