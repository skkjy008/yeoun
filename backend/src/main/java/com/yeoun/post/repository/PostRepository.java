package com.yeoun.post.repository;

import com.yeoun.post.domain.Post;
import com.yeoun.post.domain.Post.Type;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByTypeAndPublishedTrueOrderBySortOrderAscIdAsc(Type type);

    List<Post> findAllByOrderByTypeAscSortOrderAscIdAsc();
}
