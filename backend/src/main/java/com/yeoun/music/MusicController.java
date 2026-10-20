package com.yeoun.music;

import com.yeoun.global.exception.ApiException;
import com.yeoun.music.YoutubeService.VideoResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MusicController {

    private final YoutubeService youtubeService;

    @GetMapping("/api/music/youtube")
    public VideoResult youtube(@RequestParam String q) {
        if (q.isBlank() || q.length() > 200) {
            throw ApiException.badRequest("검색어를 확인해 주세요.");
        }
        return youtubeService.find(q);
    }
}
