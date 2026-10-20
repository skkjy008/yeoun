package com.yeoun.post.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.post.domain.Post;
import com.yeoun.post.dto.PostDtos.PostRequest;
import com.yeoun.post.dto.PostDtos.PostResponse;
import com.yeoun.post.repository.PostRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;

    public List<PostResponse> published(Post.Type type) {
        return postRepository.findAllByTypeAndPublishedTrueOrderBySortOrderAscIdAsc(type).stream()
                .map(PostResponse::from).toList();
    }

    public List<PostResponse> all() {
        return postRepository.findAllByOrderByTypeAscSortOrderAscIdAsc().stream().map(PostResponse::from).toList();
    }

    @Transactional
    public PostResponse create(PostRequest request) {
        return PostResponse.from(postRepository.save(new Post(request.toSpec())));
    }

    @Transactional
    public PostResponse update(Long id, PostRequest request) {
        Post post = postRepository.findById(id).orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없습니다."));
        post.apply(request.toSpec());
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long id) {
        if (!postRepository.existsById(id)) {
            throw ApiException.notFound("게시글을 찾을 수 없습니다.");
        }
        postRepository.deleteById(id);
    }
}
