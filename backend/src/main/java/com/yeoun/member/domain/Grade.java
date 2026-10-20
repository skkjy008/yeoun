package com.yeoun.member.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 회원 등급. 브론즈부터 다이아까지. */
@Getter
@RequiredArgsConstructor
public enum Grade {
    BRONZE("브론즈"),
    SILVER("실버"),
    GOLD("골드"),
    PLATINUM("플래티넘"),
    DIAMOND("다이아");

    private final String label;
}
