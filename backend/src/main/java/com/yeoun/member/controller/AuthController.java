package com.yeoun.member.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.member.dto.AuthDtos.LoginRequest;
import com.yeoun.member.dto.AuthDtos.MemberResponse;
import com.yeoun.member.dto.AuthDtos.SignupRequest;
import com.yeoun.member.dto.AuthDtos.TokenResponse;
import com.yeoun.member.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/api/auth/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/api/auth/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/api/members/me")
    public MemberResponse me(@AuthenticationPrincipal AuthMember me) {
        return authService.me(me.id());
    }
}
