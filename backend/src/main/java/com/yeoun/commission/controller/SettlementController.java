package com.yeoun.commission.controller;

import com.yeoun.commission.domain.Settlement;
import com.yeoun.commission.dto.CommissionDtos.SettlementResponse;
import com.yeoun.commission.dto.CommissionDtos.SettlementSummary;
import com.yeoun.commission.service.SettlementService;
import com.yeoun.global.security.AuthMember;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    /** 조향사: 내 정산 내역 */
    @GetMapping("/api/settlements/me")
    public SettlementSummary mine(@AuthenticationPrincipal AuthMember me) {
        return settlementService.mine(me.id());
    }

    @GetMapping("/api/admin/settlements")
    public SettlementSummary all(@RequestParam(required = false) Settlement.Status status) {
        return settlementService.all(status);
    }

    @PostMapping("/api/admin/settlements/{id}/pay")
    public SettlementResponse pay(@PathVariable Long id) {
        return settlementService.markPaid(id);
    }
}
