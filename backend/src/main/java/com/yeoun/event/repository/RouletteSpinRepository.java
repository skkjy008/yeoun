package com.yeoun.event.repository;

import com.yeoun.event.domain.RouletteSpin;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouletteSpinRepository extends JpaRepository<RouletteSpin, Long> {

    @EntityGraph(attributePaths = "coupon")
    Optional<RouletteSpin> findByMemberIdAndSpunOn(Long memberId, LocalDate spunOn);
}
