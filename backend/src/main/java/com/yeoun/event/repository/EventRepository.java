package com.yeoun.event.repository;

import com.yeoun.event.domain.Event;
import com.yeoun.event.domain.EventKind;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findAllByPublishedTrueOrderBySortOrderAscIdAsc();

    List<Event> findAllByKindAndPublishedTrue(EventKind kind);

    Optional<Event> findBySlugAndPublishedTrue(String slug);

    Optional<Event> findFirstByKindAndPublishedTrueOrderByIdDesc(EventKind kind);
}
