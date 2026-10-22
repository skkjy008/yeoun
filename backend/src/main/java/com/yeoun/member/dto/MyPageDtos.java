package com.yeoun.member.dto;

import com.yeoun.member.domain.Address;
import com.yeoun.member.domain.Grade;
import com.yeoun.member.dto.AuthDtos.MemberResponse;
import com.yeoun.order.dto.OrderDtos.OrderSummary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public final class MyPageDtos {

    private MyPageDtos() {
    }

    public record ProfileUpdateRequest(
            @NotBlank(message = "이름을 입력해 주세요.") @Size(max = 40) String name,
            @Pattern(regexp = "^$|^[0-9-]{9,13}$", message = "휴대전화 번호 형식을 확인해 주세요.") String phone,
            boolean marketingAgreed) {
    }

    public record PasswordChangeRequest(
            @NotBlank(message = "현재 비밀번호를 입력해 주세요.") String currentPassword,
            @NotBlank @Size(min = 8, max = 64, message = "새 비밀번호는 8자 이상이어야 합니다.") String newPassword) {
    }

    public record AddressRequest(
            @NotBlank(message = "받는 분을 입력해 주세요.") @Size(max = 40) String recipientName,
            @NotBlank(message = "연락처를 입력해 주세요.")
            @Pattern(regexp = "^[0-9-]{9,13}$", message = "연락처 형식을 확인해 주세요.") String recipientPhone,
            @NotBlank(message = "우편번호를 입력해 주세요.") @Size(max = 10) String zipCode,
            @NotBlank(message = "기본 주소를 입력해 주세요.") @Size(max = 200) String address1,
            @Size(max = 200) String address2) {

        public Address toAddress() {
            return new Address(recipientName, recipientPhone, zipCode, address1, address2);
        }
    }

    public record AddressResponse(String recipientName, String recipientPhone, String zipCode, String address1,
                                  String address2) {

        public static AddressResponse from(Address a) {
            if (a == null || a.getZipCode() == null) {
                return null;
            }
            return new AddressResponse(a.getRecipientName(), a.getRecipientPhone(), a.getZipCode(), a.getAddress1(),
                    a.getAddress2());
        }
    }

    public record Tier(String code, String label, long threshold) {
    }

    public record GradeProgress(String grade, String gradeLabel, String nextGrade, String nextGradeLabel,
                                long totalSpent, long currentThreshold, Long nextThreshold, long remaining,
                                List<Tier> tiers) {

        public static GradeProgress of(Grade grade, long totalSpent) {
            Grade next = grade.next();
            List<Tier> tiers = Arrays.stream(Grade.values())
                    .map(g -> new Tier(g.name(), g.getLabel(), g.getThreshold()))
                    .toList();
            return new GradeProgress(grade.name(), grade.getLabel(), next == null ? null : next.name(),
                    next == null ? null : next.getLabel(), totalSpent, grade.getThreshold(),
                    next == null ? null : next.getThreshold(),
                    next == null ? 0 : Math.max(0, next.getThreshold() - totalSpent), tiers);
        }
    }

    public record MyPageSummary(MemberResponse member, boolean marketingAgreed, int point, long usableCoupons,
                                int wishlistCount, int commissionCount, GradeProgress grade,
                                Map<String, Long> orderStatusCounts, OrderSummary recentOrder,
                                AddressResponse address) {
    }
}
