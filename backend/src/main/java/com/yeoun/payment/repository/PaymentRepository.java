package com.yeoun.payment.repository;

import com.yeoun.payment.domain.Payment;
import com.yeoun.payment.domain.PaymentStatus;
import com.yeoun.payment.domain.PaymentTarget;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderKey(String orderKey);

    Optional<Payment> findFirstByTargetTypeAndTargetIdAndStatusInOrderByIdDesc(PaymentTarget targetType,
                                                                              Long targetId,
                                                                              List<PaymentStatus> statuses);

    List<Payment> findAllByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime before);
}
