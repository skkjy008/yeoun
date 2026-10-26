package com.yeoun.commission.controller;

import com.yeoun.commission.domain.CommissionStatus;
import com.yeoun.commission.dto.CommissionDtos.AcceptRequest;
import com.yeoun.commission.dto.CommissionDtos.AcceptResponse;
import com.yeoun.commission.dto.CommissionDtos.CancelRequest;
import com.yeoun.commission.dto.CommissionDtos.CommissionDetail;
import com.yeoun.commission.dto.CommissionDtos.CommissionSummary;
import com.yeoun.commission.dto.CommissionDtos.CreateRequest;
import com.yeoun.commission.dto.CommissionDtos.DeliverRequest;
import com.yeoun.commission.dto.CommissionDtos.ProposalRequest;
import com.yeoun.commission.dto.CommissionDtos.ReviewRequest;
import com.yeoun.commission.service.CommissionService;
import com.yeoun.global.common.PageResponse;
import com.yeoun.global.security.AuthMember;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/commissions")
public class CommissionController {

    private final CommissionService commissionService;

    /** 의뢰 게시판 목록 (비회원도 둘러볼 수 있음) */
    @GetMapping
    public PageResponse<CommissionSummary> list(@RequestParam(required = false) CommissionStatus status,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "12") int size) {
        return commissionService.list(status, page, Math.min(size, 50));
    }

    @GetMapping("/me")
    public List<CommissionSummary> mine(@AuthenticationPrincipal AuthMember me) {
        return commissionService.requestedBy(me.id());
    }

    @GetMapping("/proposed")
    public List<CommissionSummary> proposed(@AuthenticationPrincipal AuthMember me) {
        return commissionService.proposedBy(me.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommissionDetail create(@AuthenticationPrincipal AuthMember me, @Valid @RequestBody CreateRequest request) {
        return commissionService.create(me, request);
    }

    @GetMapping("/{id}")
    public CommissionDetail detail(@AuthenticationPrincipal AuthMember me, @PathVariable Long id) {
        return commissionService.detail(me, id);
    }

    @PostMapping("/{id}/proposals")
    @ResponseStatus(HttpStatus.CREATED)
    public CommissionDetail propose(@AuthenticationPrincipal AuthMember me, @PathVariable Long id,
                                    @Valid @RequestBody ProposalRequest request) {
        return commissionService.propose(me, id, request);
    }

    @PostMapping("/{id}/proposals/{proposalId}/accept")
    public AcceptResponse accept(@AuthenticationPrincipal AuthMember me, @PathVariable Long id,
                                 @PathVariable Long proposalId, @Valid @RequestBody AcceptRequest request) {
        return commissionService.accept(me, id, proposalId, request);
    }

    /** 조향사: 제작 시작 (이후 의뢰인 취소 시 50%만 환불) */
    @PostMapping("/{id}/start")
    public CommissionDetail start(@AuthenticationPrincipal AuthMember me, @PathVariable Long id) {
        return commissionService.start(me, id);
    }

    /** 의뢰인: 구매 확정 → 조향사 정산 대기 */
    @PostMapping("/{id}/confirm")
    public CommissionDetail confirm(@AuthenticationPrincipal AuthMember me, @PathVariable Long id) {
        return commissionService.confirm(me, id);
    }

    @PostMapping("/{id}/deliver")
    public CommissionDetail deliver(@AuthenticationPrincipal AuthMember me, @PathVariable Long id,
                                    @Valid @RequestBody DeliverRequest request) {
        return commissionService.deliver(me, id, request.note());
    }

    @PostMapping("/{id}/review")
    public CommissionDetail review(@AuthenticationPrincipal AuthMember me, @PathVariable Long id,
                                   @Valid @RequestBody ReviewRequest request) {
        return commissionService.review(me, id, request);
    }

    @PostMapping("/{id}/cancel")
    public CommissionDetail cancel(@AuthenticationPrincipal AuthMember me, @PathVariable Long id,
                                   @Valid @RequestBody(required = false) CancelRequest request) {
        return commissionService.cancel(me, id, request == null ? null : request.reason());
    }
}
