package com.yeoun.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 상세 페이지 음악 추천 트랙. youtubeVideoId가 없으면 YouTube 검색으로 연결합니다. */
@Getter
@Embeddable
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Track {

    @Column(name = "track_title", nullable = false, length = 120)
    private String title;

    @Column(name = "track_artist", length = 120)
    private String artist;

    @Column(name = "youtube_video_id", length = 20)
    private String youtubeVideoId;
}
