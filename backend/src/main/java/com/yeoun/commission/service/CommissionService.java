package com.yeoun.commission.service;

import com.yeoun.commission.domain.Commission;
import com.yeoun.commission.domain.CommissionProposal;
import com.yeoun.commission.domain.CommissionStatus;
import com.yeoun.commission.domain.Settlement;
import com.yeoun.commission.dto.CommissionDtos.AcceptRequest;
import com.yeoun.commission.dto.CommissionDtos.AcceptResponse;
import com.yeoun.commission.dto.CommissionDtos.CommissionDetail;
import com.yeoun.commission.dto.CommissionDtos.CommissionSummary;
import com.yeoun.commission.dto.CommissionDtos.CreateRequest;
import com.yeoun.commission.dto.CommissionDtos.PerfumerCard;
import com.yeoun.commission.dto.CommissionDtos.ProposalRequest;
import com.yeoun.commission.dto.CommissionDtos.ProposalResponse;
import com.yeoun.commission.dto.CommissionDtos.ReviewRequest;
import com.yeoun.commission.dto.CommissionDtos.ReviewResponse;
import com.yeoun.commission.dto.CommissionDtos.SettlementResponse;
import com.yeoun.commission.dto.CommissionDtos.Viewer;
import com.yeoun.commission.repository.CommissionProposalRepository;
import com.yeoun.commission.repository.CommissionRepository;
import com.yeoun.commission.repository.SettlementRepository;
import com.yeoun.global.common.PageResponse;
import com.yeoun.global.config.YeounProperties;
import com.yeoun.global.exception.ApiException;
import com.yeoun.global.security.AuthMember;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import com.yeoun.payment.domain.Payment;
import com.yeoun.payment.domain.PaymentTarget;
import com.yeoun.payment.dto.PaymentDtos.PaymentRequest;
import com.yeoun.payment.service.PaymentEvents;
import com.yeoun.payment.service.PaymentService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommissionService {

    private final CommissionRepository commissionRepository;
    private final CommissionProposalRepository proposalRepository;
    private final SettlementRepository settlementRepository;
    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final PaymentService paymentService;
    private final YeounProperties properties;

    /** 의뢰 등록 → 인증된 모든 조향사에게 알림(접속 중이면 SSE로 즉시) */
    @Transactional
    public CommissionDetail create(AuthMember me, CreateRequest request) {
        Member requester = memberRepository.getReferenceById(me.id());
        Commission commission = commissionRepository.save(Commission.builder()
                .requester(requester)
                .title(request.title().trim())
                .incCd(request.incCd())
                .moods(request.moods())
                .description(request.description().trim())
                .budget(request.budget())
                .desiredDate(request.desiredDate())
                .referenceImages(request.referenceImages())
                .build());

        String message = "새 커미션 의뢰 '%s' · 예산 %,d원 · %s".formatted(commission.getTitle(),
                commission.getBudget(), commission.getCategoryLabel());
        memberRepository.findAllByRole(Role.PERFUMER).stream()
                .filter(perfumer -> !perfumer.getId().equals(me.id()))
                .forEach(perfumer -> notificationService.notify(perfumer, Type.COMMISSION_REQUEST, message,
                        link(commission)));
        return detail(me, commission.getId());
    }

    public PageResponse<CommissionSummary> list(CommissionStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return PageResponse.of(status == null
                        ? commissionRepository.findAllByOrderByCreatedAtDescIdDesc(pageable)
                        : commissionRepository.findAllByStatusOrderByCreatedAtDescIdDesc(status, pageable),
                this::summary);
    }

    public List<CommissionSummary> requestedBy(Long memberId) {
        return commissionRepository.findAllByRequesterIdOrderByCreatedAtDescIdDesc(memberId).stream()
                .map(this::summary)
                .toList();
    }

    public List<CommissionSummary> proposedBy(Long perfumerId) {
        return proposalRepository.findAllByPerfumerIdOrderByCreatedAtDescIdDesc(perfumerId).stream()
                .map(CommissionProposal::getCommission)
                .map(this::summary)
                .toList();
    }

    public CommissionDetail detail(AuthMember me, Long commissionId) {
        Commission c = get(commissionId);
        boolean isRequester = me != null && c.isRequestedBy(me.id());
        boolean isPerfumer = me != null && me.role() == Role.PERFUMER;
        boolean isAdmin = me != null && me.role() == Role.ADMIN;
        boolean assigned = me != null && c.isAssignedTo(me.id());

        List<CommissionProposal> proposals = proposalRepository.findAllByCommissionIdOrderByCreatedAtAscIdAsc(c.getId());
        boolean proposed = me != null && proposals.stream().anyMatch(p -> p.getPerfumer().getId().equals(me.id()));
        List<ProposalResponse> visible = proposals.stream()
                .filter(p -> isRequester || isAdmin || (me != null && p.getPerfumer().getId().equals(me.id())))
                .map(p -> ProposalResponse.of(p, perfumerCard(p.getPerfumer())))
                .toList();

        ReviewResponse review = c.getReviewedAt() == null ? null
                : new ReviewResponse(c.getScentRating(), c.getPerfumerRating(), c.getReviewContent(),
                c.getReviewedAt());
        boolean showPrivate = isRequester || assigned || isAdmin;
        Payment payment = showPrivate ? paymentService.findPaid(PaymentTarget.COMMISSION, c.getId()).orElse(null)
                : null;
        SettlementResponse settlement = (assigned || isAdmin)
                ? settlementRepository.findByCommissionId(c.getId()).map(SettlementResponse::from).orElse(null)
                : null;

        CommissionStatus status = c.getStatus();
        boolean canCancel = (isRequester && c.isCancellable()) || (assigned && status == CommissionStatus.PAID);
        Integer refundPreview = canCancel && status != CommissionStatus.OPEN
                ? c.refundAmountFor(properties.commission().inProgressRefundRate()) : null;
        Viewer viewer = new Viewer(isRequester, isPerfumer, assigned,
                isPerfumer && !isRequester && !proposed && status == CommissionStatus.OPEN, proposed,
                assigned && status == CommissionStatus.PAID,
                assigned && status == CommissionStatus.IN_PROGRESS,
                isRequester && status == CommissionStatus.DELIVERED,
                isRequester && c.canReview(),
                canCancel, refundPreview);

        return new CommissionDetail(CommissionSummary.of(c, proposals.size()), c.getDescription(),
                c.getReferenceImageList(),
                c.getPerfumer() == null ? null : perfumerCard(c.getPerfumer()),
                c.getAgreedPrice(),
                payment != null ? payment.getMethodLabel()
                        : showPrivate && c.getPaymentMethod() != null ? c.getPaymentMethod().getLabel() : null,
                payment == null ? null : payment.getReceiptUrl(),
                c.getPaidAt(), c.getStartedAt(), showPrivate ? c.getDeliveryNote() : null, c.getDeliveredAt(),
                status == CommissionStatus.DELIVERED ? c.autoConfirmAt(properties.commission().autoConfirmDays()) : null,
                c.getConfirmedAt(), c.getCancelledAt(), showPrivate ? c.getCancelReason() : null,
                showPrivate ? c.getRefundAmount() : null, review, settlement, visible, viewer);
    }

    @Transactional
    public CommissionDetail propose(AuthMember me, Long commissionId, ProposalRequest request) {
        Commission c = get(commissionId);
        if (me.role() != Role.PERFUMER) {
            throw ApiException.forbidden("인증된 조향사만 제안할 수 있어요.");
        }
        if (c.isRequestedBy(me.id())) {
            throw ApiException.badRequest("본인의 의뢰에는 제안할 수 없어요.");
        }
        if (c.getStatus() != CommissionStatus.OPEN) {
            throw ApiException.badRequest("이미 조향사가 정해진 의뢰입니다.");
        }
        if (proposalRepository.existsByCommissionIdAndPerfumerId(commissionId, me.id())) {
            throw ApiException.conflict("이미 제안을 보낸 의뢰입니다.");
        }
        Member perfumer = memberRepository.getReferenceById(me.id());
        proposalRepository.save(new CommissionProposal(c, perfumer, request.price(), request.workingDays(),
                request.message().trim()));
        notificationService.notify(c.getRequester(), Type.COMMISSION_PROPOSAL,
                "'%s' 의뢰에 새 제안이 도착했어요. (%,d원 · %d일)".formatted(c.getTitle(), request.price(),
                        request.workingDays()),
                link(c));
        return detail(me, commissionId);
    }

    /**
     * 제안 선택 → 선결제 준비. 실제로 조향사가 정해지는 것은 결제가 승인된 뒤(onPaymentApproved)입니다.
     */
    @Transactional
    public AcceptResponse accept(AuthMember me, Long commissionId, Long proposalId, AcceptRequest request) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        if (c.getStatus() != CommissionStatus.OPEN) {
            throw ApiException.badRequest("제안을 받는 중인 의뢰만 조향사를 선택할 수 있어요.");
        }
        CommissionProposal chosen = proposalRepository.findById(proposalId)
                .filter(p -> p.getCommission().getId().equals(commissionId))
                .filter(p -> p.getStatus() == CommissionProposal.Status.PROPOSED)
                .orElseThrow(() -> ApiException.notFound("선택할 수 있는 제안을 찾을 수 없습니다."));
        String orderKey = "CM-%d-%s".formatted(c.getId(), UUID.randomUUID().toString().substring(0, 8));
        PaymentRequest payment = paymentService.prepare(c.getRequester(), PaymentTarget.COMMISSION, c.getId(),
                chosen.getId(), orderKey, "커미션 · " + c.getTitle(), chosen.getPrice());
        return new AcceptResponse(detail(me, commissionId), payment);
    }

    @EventListener
    @Transactional
    public void onPaymentApproved(PaymentEvents.Approved event) {
        Payment payment = event.payment();
        if (payment.getTargetType() != PaymentTarget.COMMISSION) {
            return;
        }
        Commission c = get(payment.getTargetId());
        List<CommissionProposal> proposals = proposalRepository.findAllByCommissionIdOrderByCreatedAtAscIdAsc(c.getId());
        CommissionProposal chosen = proposals.stream().filter(p -> p.getId().equals(payment.getTargetRef()))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("선택한 제안을 찾을 수 없습니다."));
        if (chosen.getPrice() != payment.getAmount()) {
            throw ApiException.badRequest("제안 금액과 결제 금액이 다릅니다.");
        }
        c.accept(chosen, null, payment.getPaymentKey());
        proposals.forEach(p -> {
            if (p == chosen) {
                p.accept();
            } else {
                p.decline();
            }
        });
        notificationService.notify(chosen.getPerfumer(), Type.COMMISSION_ACCEPTED,
                "'%s' 의뢰가 선결제되었어요. 준비가 되면 '제작 시작'을 눌러 주세요.".formatted(c.getTitle()), link(c));
    }

    @Transactional
    public CommissionDetail start(AuthMember me, Long commissionId) {
        Commission c = get(commissionId);
        requireAssigned(c, me);
        c.start();
        notificationService.notify(c.getRequester(), Type.COMMISSION_ACCEPTED,
                "'%s' 제작이 시작되었어요. 이제 취소하면 결제 금액의 %d%%만 환불돼요.".formatted(c.getTitle(),
                        Math.round(properties.commission().inProgressRefundRate() * 100)), link(c));
        return detail(me, commissionId);
    }

    @Transactional
    public CommissionDetail deliver(AuthMember me, Long commissionId, String note) {
        Commission c = get(commissionId);
        requireAssigned(c, me);
        c.deliver(note.trim());
        notificationService.notify(c.getRequester(), Type.COMMISSION_DELIVERED,
                "'%s' 향이 완성되어 전달되었어요. %d일 안에 구매 확정 또는 후기를 남겨 주세요.".formatted(c.getTitle(),
                        properties.commission().autoConfirmDays()), link(c));
        return detail(me, commissionId);
    }

    @Transactional
    public CommissionDetail confirm(AuthMember me, Long commissionId) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        confirmAndSettle(c, "의뢰인이 구매를 확정했어요");
        return detail(me, commissionId);
    }

    /** 후기 작성. 전달 완료 상태라면 후기와 함께 구매가 확정됩니다. */
    @Transactional
    public CommissionDetail review(AuthMember me, Long commissionId, ReviewRequest request) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        c.review(request.scentRating(), request.perfumerRating(), request.content().trim());
        if (c.getStatus() == CommissionStatus.DELIVERED) {
            confirmAndSettle(c, "후기와 함께 구매가 확정되었어요");
        }
        notificationService.notify(c.getPerfumer(), Type.COMMISSION_REVIEWED,
                "'%s' 의뢰에 후기가 남겨졌어요. 조향사 평가 %d점".formatted(c.getTitle(), request.perfumerRating()),
                link(c));
        return detail(me, commissionId);
    }

    /**
     * 취소·환불: 결제 전 무료 · 결제 완료(제작 전) 100% 환불 · 제작 중 50% 환불(나머지는 조향사 정산) · 전달 후 불가.
     * 결제 완료 단계에서는 맡은 조향사도 의뢰를 사양(전액 환불)할 수 있습니다.
     */
    @Transactional
    public CommissionDetail cancel(AuthMember me, Long commissionId, String reason) {
        Commission c = get(commissionId);
        CommissionStatus before = c.getStatus();
        boolean byPerfumer = c.isAssignedTo(me.id()) && before == CommissionStatus.PAID;
        if (!c.isRequestedBy(me.id()) && !byPerfumer) {
            throw ApiException.forbidden("의뢰인만 취소할 수 있어요.");
        }
        int refund = c.refundAmountFor(properties.commission().inProgressRefundRate());
        if (before != CommissionStatus.OPEN && refund > 0) {
            paymentService.refund(PaymentTarget.COMMISSION, c.getId(), refund,
                    byPerfumer ? "조향사 사양에 따른 환불" : "의뢰인 취소에 따른 환불");
        }
        String cancelReason = reason == null || reason.isBlank()
                ? (byPerfumer ? "조향사가 의뢰를 사양했어요." : "의뢰인이 취소했어요.") : reason.trim();
        Member perfumer = c.getPerfumer();
        c.cancel(cancelReason, refund);
        proposalRepository.findAllByCommissionIdOrderByCreatedAtAscIdAsc(commissionId).stream()
                .filter(p -> p.getStatus() == CommissionProposal.Status.PROPOSED)
                .forEach(CommissionProposal::decline);

        if (before == CommissionStatus.IN_PROGRESS) {
            // 제작 중 취소: 환불하고 남은 금액은 조향사 몫으로 정산
            settlementRepository.save(new Settlement(c, perfumer, Settlement.Reason.PARTIAL_CANCEL,
                    c.getAgreedPrice() - refund, properties.commission().feeRate()));
        }
        if (perfumer != null) {
            Member notifyTarget = byPerfumer ? c.getRequester() : perfumer;
            notificationService.notify(notifyTarget, Type.SYSTEM,
                    "'%s' 의뢰가 취소되었어요.%s".formatted(c.getTitle(),
                            refund > 0 ? " 환불 금액 %,d원".formatted(refund) : ""), link(c));
        }
        return detail(me, commissionId);
    }

    /** 전달 후 일정 기간이 지나면 자동으로 구매 확정합니다. */
    @Transactional
    public int autoConfirm() {
        LocalDateTime before = LocalDateTime.now().minusDays(properties.commission().autoConfirmDays());
        List<Commission> targets = commissionRepository.findAllByStatusAndDeliveredAtBefore(CommissionStatus.DELIVERED,
                before);
        targets.forEach(c -> confirmAndSettle(c, "전달 후 %d일이 지나 자동으로 구매 확정되었어요"
                .formatted(properties.commission().autoConfirmDays())));
        return targets.size();
    }

    private void confirmAndSettle(Commission c, String reason) {
        c.confirm();
        Settlement settlement = settlementRepository.save(new Settlement(c, c.getPerfumer(),
                Settlement.Reason.CONFIRMED, c.getAgreedPrice(), properties.commission().feeRate()));
        notificationService.notify(c.getPerfumer(), Type.SYSTEM,
                "%s. '%s' 정산 예정 금액 %,d원 (수수료 %,d원 제외)".formatted(reason, c.getTitle(),
                        settlement.getNetAmount(), settlement.getFeeAmount()), link(c));
    }

    private CommissionSummary summary(Commission c) {
        return CommissionSummary.of(c, proposalRepository.countByCommissionId(c.getId()));
    }

    private PerfumerCard perfumerCard(Member perfumer) {
        PerfumerApplication application = applicationRepository.findByMemberId(perfumer.getId()).orElse(null);
        return new PerfumerCard(perfumer.getId(), perfumer.getName(),
                application == null ? perfumer.getName() : application.getStudioName(),
                application == null ? 0 : application.getCareerYears(),
                Math.round(commissionRepository.averagePerfumerRating(perfumer.getId()) * 10) / 10.0,
                commissionRepository.countByPerfumerIdAndStatus(perfumer.getId(), CommissionStatus.COMPLETED));
    }

    private void requireRequester(Commission c, AuthMember me) {
        if (!c.isRequestedBy(me.id())) {
            throw ApiException.forbidden("의뢰인만 할 수 있어요.");
        }
    }

    private void requireAssigned(Commission c, AuthMember me) {
        if (!c.isAssignedTo(me.id())) {
            throw ApiException.forbidden("이 의뢰를 맡은 조향사만 할 수 있어요.");
        }
    }

    private static String link(Commission c) {
        return "/custom/" + c.getId();
    }

    private Commission get(Long id) {
        return commissionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("의뢰를 찾을 수 없습니다."));
    }
}
