package com.yeoun.product.repository;

import com.yeoun.product.domain.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            select p from Product p
            where p.active = true
              and (:incCd is null or p.incCd = :incCd)
              and (:keyword is null or p.name like concat('%', :keyword, '%')
                   or p.subtitle like concat('%', :keyword, '%')
                   or p.scentFamily like concat('%', :keyword, '%'))
              and (:feeling is null or p.feeling = :feeling)
              and (:scene is null or p.scene = :scene)
              and (:minPrice is null or p.price >= :minPrice)
              and (:maxPrice is null or p.price <= :maxPrice)
            """)
    Page<Product> search(@Param("incCd") String incCd,
                         @Param("keyword") String keyword,
                         @Param("feeling") String feeling,
                         @Param("scene") String scene,
                         @Param("minPrice") Integer minPrice,
                         @Param("maxPrice") Integer maxPrice,
                         Pageable pageable);

    @Query("select distinct p.feeling from Product p where p.active = true and p.incCd = :incCd and p.feeling is not null")
    List<String> findFeelings(@Param("incCd") String incCd);

    @Query("select distinct p.scene from Product p where p.active = true and p.incCd = :incCd and p.scene is not null")
    List<String> findScenes(@Param("incCd") String incCd);

    List<Product> findTop4ByActiveTrueOrderByPopularityDesc();

    List<Product> findTop4ByActiveTrueAndNewArrivalTrueOrderByIdAsc();

    @EntityGraph(attributePaths = "tags")
    List<Product> findAllByActiveTrue();

    Page<Product> findAllByActiveTrue(Pageable pageable);
}
