package com.yeoun.order.repository;

import com.yeoun.order.domain.Order;
import com.yeoun.order.domain.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByOrderNumber(String orderNumber);

    Page<Order> findAllByMemberIdOrderByCreatedAtDescIdDesc(Long memberId, Pageable pageable);

    Page<Order> findAllByMemberIdAndStatusOrderByCreatedAtDescIdDesc(Long memberId, OrderStatus status,
                                                                     Pageable pageable);

    Optional<Order> findFirstByMemberIdAndStatusNotOrderByCreatedAtDescIdDesc(Long memberId, OrderStatus status);

    @EntityGraph(attributePaths = "member")
    Page<Order> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    @EntityGraph(attributePaths = "member")
    Page<Order> findAllByStatusOrderByCreatedAtDescIdDesc(OrderStatus status, Pageable pageable);

    @Query("select o.status as status, count(o) as cnt from Orders o where o.member.id = :memberId group by o.status")
    List<StatusCount> countByStatus(@Param("memberId") Long memberId);

    @Query("select coalesce(sum(o.totalAmount), 0) from Orders o where o.member.id = :memberId and o.status = :status")
    Number sumTotalAmount(@Param("memberId") Long memberId, @Param("status") OrderStatus status);

    interface StatusCount {
        OrderStatus getStatus();

        Long getCnt();
    }
}
