package com.yeoun.member.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.global.security.JwtTokenProvider;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import com.yeoun.member.dto.AuthDtos.LoginRequest;
import com.yeoun.member.dto.AuthDtos.MemberResponse;
import com.yeoun.member.dto.AuthDtos.PerfumerApplicationRequest;
import com.yeoun.member.dto.AuthDtos.SignupRequest;
import com.yeoun.member.dto.AuthDtos.TokenResponse;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (memberRepository.existsByEmail(email)) {
            throw ApiException.conflict("이미 가입된 이메일입니다.");
        }
        if (request.perfumer() && request.perfumerApplication() == null) {
            throw ApiException.badRequest("조향사 인증 정보를 입력해 주세요.");
        }

        Member member = memberRepository.save(Member.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .name(request.name().trim())
                .phone(request.phone())
                .role(Role.USER)
                .marketingAgreed(request.marketingAgreed())
                .build());

        PerfumerApplication application = null;
        if (request.perfumer()) {
            application = submitApplication(member, request.perfumerApplication());
        }
        return new TokenResponse(tokenProvider.createAccessToken(member), tokenProvider.getValiditySeconds(),
                MemberResponse.of(member, application));
    }

    private PerfumerApplication submitApplication(Member member, PerfumerApplicationRequest request) {
        PerfumerApplication application = applicationRepository.save(PerfumerApplication.builder()
                .member(member)
                .studioName(request.studioName())
                .careerYears(request.careerYears())
                .certification(request.certification())
                .portfolioUrl(request.portfolioUrl())
                .introduction(request.introduction())
                .build());
        // 조향사는 가입 시 운영자에게 인증 요청 알림을 발송합니다.
        notificationService.notifyRole(Role.ADMIN, Type.PERFUMER_APPLICATION,
                "%s 님이 조향사 인증을 요청했습니다.".formatted(member.getName()),
                "/admin/perfumers");
        return application;
    }

    public TokenResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("invalid"));
        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new BadCredentialsException("invalid");
        }
        PerfumerApplication application = applicationRepository.findByMemberId(member.getId()).orElse(null);
        return new TokenResponse(tokenProvider.createAccessToken(member), tokenProvider.getValiditySeconds(),
                MemberResponse.of(member, application));
    }

    public MemberResponse me(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
        return MemberResponse.of(member, applicationRepository.findByMemberId(memberId).orElse(null));
    }
}
