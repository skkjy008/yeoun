package com.yeoun.admin.controller;

import com.yeoun.admin.dto.AdminDtos.ApplicationRow;
import com.yeoun.admin.dto.AdminDtos.MemberRow;
import com.yeoun.admin.dto.AdminDtos.MemberUpdateRequest;
import com.yeoun.admin.dto.AdminDtos.RejectRequest;
import com.yeoun.admin.service.AdminMemberService;
import com.yeoun.global.common.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    @GetMapping("/members")
    public PageResponse<MemberRow> members(@RequestParam(required = false) String keyword,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return adminMemberService.members(keyword, page, Math.min(size, 100));
    }

    @PatchMapping("/members/{id}")
    public MemberRow updateMember(@PathVariable Long id, @RequestBody MemberUpdateRequest request) {
        return adminMemberService.updateMember(id, request);
    }

    @GetMapping("/perfumer-applications")
    public List<ApplicationRow> applications(@RequestParam(required = false) String status) {
        return adminMemberService.applications(status);
    }

    @PostMapping("/perfumer-applications/{id}/approve")
    public ApplicationRow approve(@PathVariable Long id) {
        return adminMemberService.approve(id);
    }

    @PostMapping("/perfumer-applications/{id}/reject")
    public ApplicationRow reject(@PathVariable Long id, @Valid @RequestBody(required = false) RejectRequest request) {
        return adminMemberService.reject(id, request == null ? null : request.reason());
    }
}
