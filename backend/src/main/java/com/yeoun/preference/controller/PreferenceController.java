package com.yeoun.preference.controller;

import com.yeoun.global.security.AuthMember;
import com.yeoun.preference.dto.PreferenceDtos.QuestionResponse;
import com.yeoun.preference.dto.PreferenceDtos.RecommendationResponse;
import com.yeoun.preference.dto.PreferenceDtos.SubmitRequest;
import com.yeoun.preference.service.PreferenceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @GetMapping("/api/preferences/questions")
    public List<QuestionResponse> questions() {
        return preferenceService.questions();
    }

    @PostMapping("/api/preferences")
    public RecommendationResponse submit(@AuthenticationPrincipal AuthMember me,
                                         @Valid @RequestBody SubmitRequest request) {
        return preferenceService.submit(me.id(), request);
    }

    /** 메인 페이지 상단 맞춤 추천. ai=false면 Claude 호출 없이 빠르게 응답합니다. */
    @GetMapping("/api/preferences/me")
    public ResponseEntity<RecommendationResponse> mine(@AuthenticationPrincipal AuthMember me,
                                                       @RequestParam(defaultValue = "false") boolean ai) {
        return preferenceService.myRecommendation(me.id(), ai)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
