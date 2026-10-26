package com.yeoun.commission.service;

import com.yeoun.commission.domain.Settlement;
import com.yeoun.commission.dto.CommissionDtos.SettlementResponse;
import com.yeoun.commission.dto.CommissionDtos.SettlementSummary;
import com.yeoun.commission.repository.SettlementRepository;
import com.yeoun.global.config.YeounProperties;
import com.yeoun.global.exception.ApiException;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final NotificationService notificationService;
    private final YeounProperties properties;

    public SettlementSummary mine(Long perfumerId) {
        return summarize(settlementRepository.findAllByPerfumerIdOrderByIdDesc(perfumerId));
    }

    public SettlementSummary all(Settlement.Status status) {
        return summarize(status == null ? settlementRepository.findAllByOrderByIdDesc()
                : settlementRepository.findAllByStatusOrderByIdDesc(status));
    }

    /** 운영자가 조향사에게 실제로 송금한 뒤 '지급 완료'로 표시합니다. */
    @Transactional
    public SettlementResponse markPaid(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> ApiException.notFound("정산 내역을 찾을 수 없습니다."));
        settlement.markPaid();
        notificationService.notify(settlement.getPerfumer(), Type.SYSTEM,
                "'%s' 정산금 %,d원이 지급되었어요.".formatted(settlement.getCommission().getTitle(),
                        settlement.getNetAmount()), "/mypage/settlements");
        return SettlementResponse.from(settlement);
    }

    private SettlementSummary summarize(List<Settlement> list) {
        long pending = list.stream().filter(s -> s.getStatus() == Settlement.Status.PENDING)
                .mapToLong(Settlement::getNetAmount).sum();
        long paid = list.stream().filter(s -> s.getStatus() == Settlement.Status.PAID)
                .mapToLong(Settlement::getNetAmount).sum();
        return new SettlementSummary(pending, paid, properties.commission().feeRate(),
                list.stream().map(SettlementResponse::from).toList());
    }
}
