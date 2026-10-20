package com.yeoun.global.security;

import com.yeoun.member.domain.Role;

/** JWT에서 복원한 인증 사용자 정보. 컨트롤러에서 {@code @AuthenticationPrincipal}로 주입받습니다. */
public record AuthMember(Long id, String email, Role role) {
}
