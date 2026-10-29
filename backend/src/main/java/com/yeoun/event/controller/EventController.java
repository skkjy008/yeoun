package com.yeoun.event.controller;

import com.yeoun.coupon.dto.CouponResponse;
import com.yeoun.event.dto.EventDtos.EventDetail;
import com.yeoun.event.dto.EventDtos.EventSummary;
import com.yeoun.event.dto.EventDtos.RouletteStatus;
import com.yeoun.event.dto.EventDtos.SpinResult;
import com.yeoun.event.service.EventService;
import com.yeoun.global.security.AuthMember;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    @GetMapping
    public List<EventSummary> list() {
        return eventService.list();
    }

    @GetMapping("/{slug}")
    public EventDetail detail(@PathVariable String slug) {
        return eventService.detail(slug);
    }

    /** 비회원도 볼 수 있음 (spunToday는 항상 false) */
    @GetMapping("/roulette/status")
    public RouletteStatus rouletteStatus(@AuthenticationPrincipal AuthMember me) {
        return eventService.rouletteStatus(me == null ? null : me.id());
    }

    @PostMapping("/roulette/spin")
    public SpinResult spin(@AuthenticationPrincipal AuthMember me) {
        return eventService.spin(me.id());
    }

    /** 신규 가입 쿠폰 받기: 처음이면 201, 이미 받았으면 409 */
    @PostMapping("/welcome-coupon")
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse claimWelcome(@AuthenticationPrincipal AuthMember me) {
        return eventService.claimWelcome(me.id());
    }
}
