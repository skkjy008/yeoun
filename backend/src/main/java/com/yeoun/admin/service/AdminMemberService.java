package com.yeoun.admin.service;

import com.yeoun.admin.dto.AdminDtos.ApplicationRow;
import com.yeoun.admin.dto.AdminDtos.MemberRow;
import com.yeoun.admin.dto.AdminDtos.MemberUpdateRequest;
import com.yeoun.global.common.PageResponse;
import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.PerfumerApplication.Status;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification.Type;
import com.yeoun.notification.service.NotificationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final NotificationService notificationService;

    public PageResponse<MemberRow> members(String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        var result = StringUtils.hasText(keyword)
                ? memberRepository.findAllByEmailContainingOrNameContaining(keyword, keyword, pageable)
                : memberRepository.findAll(pageable);
        return PageResponse.of(result, MemberRow::from);
    }

    @Transactional
    public MemberRow updateMember(Long id, MemberUpdateRequest request) {
        Member member = memberRepository.findById(id).orElseThrow(() -> ApiException.notFound("회원을 찾을 수 없습니다."));
        if (request.role() != null) {
            member.changeRole(request.role());
        }
        if (request.grade() != null) {
            member.changeGrade(request.grade());
        }
        return MemberRow.from(member);
    }

    public List<ApplicationRow> applications(String status) {
        List<PerfumerApplication> list = StringUtils.hasText(status)
                ? applicationRepository.findAllByStatusOrderByCreatedAtDesc(Status.valueOf(status.toUpperCase()))
                : applicationRepository.findAllByOrderByCreatedAtDesc();
        return list.stream().map(ApplicationRow::from).toList();
    }

    @Transactional
    public ApplicationRow approve(Long applicationId) {
        PerfumerApplication application = findPending(applicationId);
        application.approve();
        notificationService.notify(application.getMember(), Type.PERFUMER_APPROVED,
                "조향사 인증이 승인되었습니다. 이제 커미션 의뢰를 받을 수 있어요.", "/mypage");
        return ApplicationRow.from(application);
    }

    @Transactional
    public ApplicationRow reject(Long applicationId, String reason) {
        PerfumerApplication application = findPending(applicationId);
        application.reject(reason);
        notificationService.notify(application.getMember(), Type.PERFUMER_REJECTED,
                "조향사 인증이 반려되었습니다." + (StringUtils.hasText(reason) ? " 사유: " + reason : ""), "/mypage");
        return ApplicationRow.from(application);
    }

    private PerfumerApplication findPending(Long id) {
        PerfumerApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("인증 신청서를 찾을 수 없습니다."));
        if (application.getStatus() != Status.PENDING) {
            throw ApiException.conflict("이미 처리된 신청서입니다.");
        }
        return application;
    }
}
