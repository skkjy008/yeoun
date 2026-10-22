package com.yeoun.commission.dto;

import com.yeoun.commission.domain.Commission;
import com.yeoun.commission.domain.CommissionProposal;
import com.yeoun.order.domain.PaymentMethod;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class CommissionDtos {

    private CommissionDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "의뢰 제목을 입력해 주세요.") @Size(max = 60) String title,
            @Pattern(regexp = "^(00[1-4])?$", message = "향 종류 코드가 올바르지 않습니다.") String incCd,
            @Size(max = 200) String moods,
            @NotBlank(message = "원하는 향을 설명해 주세요.") @Size(min = 20, max = 2000,
                    message = "원하는 향을 20자 이상 2,000자 이하로 들려주세요.") String description,
            @Min(value = 30_000, message = "예산은 30,000원 이상으로 정해 주세요.")
            @Max(value = 2_000_000, message = "예산은 2,000,000원 이하로 정해 주세요.") int budget,
            @FutureOrPresent(message = "희망 완료일은 오늘 이후로 선택해 주세요.") LocalDate desiredDate) {
    }

    public record ProposalRequest(
            @Min(value = 10_000, message = "제안 금액을 확인해 주세요.") @Max(2_000_000) int price,
            @Min(value = 1, message = "작업 기간은 1일 이상입니다.") @Max(90) int workingDays,
            @NotBlank(message = "어떤 향으로 풀어낼지 들려주세요.") @Size(max = 1000) String message) {
    }

    public record AcceptRequest(@NotNull(message = "결제수단을 선택해 주세요.") PaymentMethod paymentMethod) {
    }

    public record DeliverRequest(@NotBlank(message = "전달 메모를 남겨 주세요.") @Size(max = 1000) String note) {
    }

    public record ReviewRequest(@Min(1) @Max(5) int scentRating, @Min(1) @Max(5) int perfumerRating,
                                @NotBlank(message = "후기를 남겨 주세요.") @Size(max = 1000) String content) {
    }

    public record PerfumerCard(Long memberId, String name, String studioName, int careerYears, double ratingAverage,
                               long completedCount) {
    }

    public record CommissionSummary(Long id, String title, String incCd, String categoryLabel, List<String> moods,
                                    int budget, LocalDate desiredDate, String status, String statusLabel,
                                    String requesterName, long proposalCount, String perfumerName,
                                    LocalDateTime createdAt) {

        public static CommissionSummary of(Commission c, long proposalCount) {
            return new CommissionSummary(c.getId(), c.getTitle(), c.getIncCd(), c.getCategoryLabel(),
                    c.getMoodList(), c.getBudget(), c.getDesiredDate(), c.getStatus().name(),
                    c.getStatus().getLabel(), mask(c.getRequester().getName()), proposalCount,
                    c.getPerfumer() == null ? null : c.getPerfumer().getName(), c.getCreatedAt());
        }
    }

    public record ProposalResponse(Long id, PerfumerCard perfumer, int price, int workingDays, String message,
                                   String status, LocalDateTime createdAt) {

        public static ProposalResponse of(CommissionProposal p, PerfumerCard perfumer) {
            return new ProposalResponse(p.getId(), perfumer, p.getPrice(), p.getWorkingDays(), p.getMessage(),
                    p.getStatus().name(), p.getCreatedAt());
        }
    }

    public record ReviewResponse(int scentRating, int perfumerRating, String content, LocalDateTime reviewedAt) {
    }

    /**
     * 의뢰 상세. 제안 목록은 의뢰자에게는 전부, 조향사에게는 본인 제안만 보입니다.
     * viewer 플래그로 화면에서 어떤 행동(제안·선택·전달·후기)을 보여 줄지 결정합니다.
     */
    public record CommissionDetail(CommissionSummary summary, String description, PerfumerCard perfumer,
                                   Integer agreedPrice, String paymentMethodLabel, LocalDateTime paidAt,
                                   String deliveryNote, LocalDateTime deliveredAt, ReviewResponse review,
                                   List<ProposalResponse> proposals, Viewer viewer) {
    }

    public record Viewer(boolean requester, boolean perfumer, boolean assignedPerfumer, boolean canPropose,
                         boolean proposed) {
    }

    static String mask(String name) {
        if (name == null || name.length() < 2) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }
}
