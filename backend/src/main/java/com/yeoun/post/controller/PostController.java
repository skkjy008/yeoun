package com.yeoun.post.controller;

import com.yeoun.post.domain.Post;
import com.yeoun.post.dto.PostDtos.PostRequest;
import com.yeoun.post.dto.PostDtos.PostResponse;
import com.yeoun.post.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /** 공개 게시글 (메인 배너, 공지, 이벤트) */
    @GetMapping("/api/posts")
    public List<PostResponse> published(@RequestParam(defaultValue = "BANNER") Post.Type type) {
        return postService.published(type);
    }

    @GetMapping("/api/admin/posts")
    public List<PostResponse> all() {
        return postService.all();
    }

    @PostMapping("/api/admin/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@Valid @RequestBody PostRequest request) {
        return postService.create(request);
    }

    @PutMapping("/api/admin/posts/{id}")
    public PostResponse update(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        return postService.update(id, request);
    }

    @DeleteMapping("/api/admin/posts/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
