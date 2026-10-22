package com.yeoun.commission.service;

import com.yeoun.commission.domain.Commission;
import com.yeoun.commission.domain.CommissionProposal;
import com.yeoun.commission.domain.CommissionStatus;
import com.yeoun.commission.dto.CommissionDtos.AcceptRequest;
import com.yeoun.commission.dto.CommissionDtos.CommissionDetail;
import com.yeoun.commission.dto.CommissionDtos.CommissionSummary;
import com.yeoun.commission.dto.CommissionDtos.CreateRequest;
import com.yeoun.commission.dto.CommissionDtos.PerfumerCard;
import com.yeoun.commission.dto.CommissionDtos.ProposalRequest;
import com.yeoun.commission.dto.CommissionDtos.ProposalResponse;
import com.yeoun.commission.dto.CommissionDtos.ReviewRequest;
import com.yeoun.commission.dto.CommissionDtos.ReviewResponse;
import com.yeoun.commission.dto.CommissionDtos.Viewer;
import com.yeoun.commission.repository.CommissionProposalRepository;
import com.yeoun.commission.repository.CommissionRepository;
import com.yeoun.global.common.PageResponse;
import com.yeoun.global.exception.ApiException;
import com.yeoun.global.security.AuthMember;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import com.yeoun.order.service.MockPaymentGateway;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommissionService {

    private final CommissionRepository commissionRepository;
    private final CommissionProposalRepository proposalRepository;
    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final MockPaymentGateway paymentGateway;

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
                .build());

        String message = "새 커미션 의뢰 '%s' · 예산 %,d원 · %s".formatted(commission.getTitle(),
                commission.getBudget(), commission.getCategoryLabel());
        memberRepository.findAllByRole(Role.PERFUMER).stream()
                .filter(perfumer -> !perfumer.getId().equals(me.id()))
                .forEach(perfumer -> notificationService.notify(perfumer, Type.COMMISSION_REQUEST, message,
                        "/custom/" + commission.getId()));
        return detail(me, commission.getId());
    }

    public PageResponse<CommissionSummary> list(CommissionStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return PageResponse.of(status == null
                        ? commissionRepository.findAllByOrderByCreatedAtDescIdDesc(pageable)
                        : commissionRepository.findAllByStatusOrderByCreatedAtDescIdDesc(status, pageable),
                this::summary);
    }

    /** 내가 의뢰한 커미션 */
    public List<CommissionSummary> requestedBy(Long memberId) {
        return commissionRepository.findAllByRequesterIdOrderByCreatedAtDescIdDesc(memberId).stream()
                .map(this::summary)
                .toList();
    }

    /** 조향사: 내가 제안했거나 맡은 커미션 */
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
        Viewer viewer = new Viewer(isRequester, isPerfumer, assigned,
                isPerfumer && !isRequester && !proposed && c.getStatus() == CommissionStatus.OPEN, proposed);

        return new CommissionDetail(CommissionSummary.of(c, proposals.size()), c.getDescription(),
                c.getPerfumer() == null ? null : perfumerCard(c.getPerfumer()),
                c.getAgreedPrice(),
                showPrivate && c.getPaymentMethod() != null ? c.getPaymentMethod().getLabel() : null,
                c.getPaidAt(), showPrivate ? c.getDeliveryNote() : null, c.getDeliveredAt(), review, visible, viewer);
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
                "/custom/" + c.getId());
        return detail(me, commissionId);
    }

    /** 의뢰자가 제안을 선택하고 선결제합니다. 나머지 제안은 자동으로 마감됩니다. */
    @Transactional
    public CommissionDetail accept(AuthMember me, Long commissionId, Long proposalId, AcceptRequest request) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        List<CommissionProposal> proposals = proposalRepository.findAllByCommissionIdOrderByCreatedAtAscIdAsc(
                commissionId);
        CommissionProposal chosen = proposals.stream().filter(p -> p.getId().equals(proposalId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("제안을 찾을 수 없습니다."));
        c.accept(chosen, request.paymentMethod(), paymentGateway.approve(request.paymentMethod(), chosen.getPrice()));
        proposals.forEach(p -> {
            if (p == chosen) {
                p.accept();
            } else {
                p.decline();
            }
        });
        notificationService.notify(chosen.getPerfumer(), Type.COMMISSION_ACCEPTED,
                "'%s' 의뢰가 선결제되었어요. 제작을 시작해 주세요.".formatted(c.getTitle()), "/custom/" + c.getId());
        return detail(me, commissionId);
    }

    @Transactional
    public CommissionDetail deliver(AuthMember me, Long commissionId, String note) {
        Commission c = get(commissionId);
        if (!c.isAssignedTo(me.id())) {
            throw ApiException.forbidden("이 의뢰를 맡은 조향사만 전달할 수 있어요.");
        }
        c.deliver(note.trim());
        notificationService.notify(c.getRequester(), Type.COMMISSION_DELIVERED,
                "'%s' 향이 완성되어 전달되었어요. 후기를 남겨 주세요.".formatted(c.getTitle()), "/custom/" + c.getId());
        return detail(me, commissionId);
    }

    @Transactional
    public CommissionDetail review(AuthMember me, Long commissionId, ReviewRequest request) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        c.review(request.scentRating(), request.perfumerRating(), request.content().trim());
        notificationService.notify(c.getPerfumer(), Type.COMMISSION_REVIEWED,
                "'%s' 의뢰에 후기가 남겨졌어요. 조향사 평가 %d점".formatted(c.getTitle(), request.perfumerRating()),
                "/custom/" + c.getId());
        return detail(me, commissionId);
    }

    @Transactional
    public CommissionDetail cancel(AuthMember me, Long commissionId) {
        Commission c = get(commissionId);
        requireRequester(c, me);
        c.cancel();
        proposalRepository.findAllByCommissionIdOrderByCreatedAtAscIdAsc(commissionId)
                .forEach(CommissionProposal::decline);
        return detail(me, commissionId);
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
            throw ApiException.forbidden("의뢰자만 할 수 있어요.");
        }
    }

    private Commission get(Long id) {
        return commissionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("의뢰를 찾을 수 없습니다."));
    }
}
