package com.yeoun.member.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.member.dto.AuthDtos.MemberResponse;
import com.yeoun.member.dto.MyPageDtos.AddressRequest;
import com.yeoun.member.dto.MyPageDtos.AddressResponse;
import com.yeoun.member.dto.MyPageDtos.MyPageSummary;
import com.yeoun.member.dto.MyPageDtos.PasswordChangeRequest;
import com.yeoun.member.dto.MyPageDtos.ProfileUpdateRequest;
import com.yeoun.member.service.MyPageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members/me")
public class MemberController {

    private final MyPageService myPageService;

    @GetMapping("/summary")
    public MyPageSummary summary(@AuthenticationPrincipal AuthMember me) {
        return myPageService.summary(me.id());
    }

    @PutMapping
    public MemberResponse updateProfile(@AuthenticationPrincipal AuthMember me,
                                        @Valid @RequestBody ProfileUpdateRequest request) {
        return myPageService.updateProfile(me.id(), request);
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthMember me,
                                               @Valid @RequestBody PasswordChangeRequest request) {
        myPageService.changePassword(me.id(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/address")
    public AddressResponse changeAddress(@AuthenticationPrincipal AuthMember me,
                                         @Valid @RequestBody AddressRequest request) {
        return myPageService.changeAddress(me.id(), request);
    }
}
