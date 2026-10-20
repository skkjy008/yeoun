package com.yeoun.member.repository;

import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Member> findAllByRole(Role role);

    Page<Member> findAllByEmailContainingOrNameContaining(String email, String name, Pageable pageable);
}
