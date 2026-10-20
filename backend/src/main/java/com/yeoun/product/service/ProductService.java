package com.yeoun.product.service;

import com.yeoun.global.common.PageResponse;
import com.yeoun.global.exception.ApiException;
import com.yeoun.product.domain.Category;
import com.yeoun.product.domain.Product;
import com.yeoun.product.dto.ProductDtos.FilterOptions;
import com.yeoun.product.dto.ProductDtos.ProductDetail;
import com.yeoun.product.dto.ProductDtos.ProductRequest;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.product.repository.ProductRepository;
import com.yeoun.review.repository.ReviewRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    public record SearchCondition(String category, String keyword, String feeling, String scene, Integer minPrice,
                                  Integer maxPrice, String sort, int page, int size) {
    }

    public PageResponse<ProductSummary> search(SearchCondition c) {
        String incCd = StringUtils.hasText(c.category()) ? Category.fromSlug(c.category()).getCode() : null;
        PageRequest pageable = PageRequest.of(Math.max(0, c.page()), Math.min(Math.max(1, c.size()), 60),
                toSort(c.sort()));
        return PageResponse.of(productRepository.search(incCd, blankToNull(c.keyword()), blankToNull(c.feeling()),
                blankToNull(c.scene()), c.minPrice(), c.maxPrice(), pageable), ProductSummary::from);
    }

    private static Sort toSort(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Order.desc("popularity"), Sort.Order.asc("id"));
        }
        return switch (sort) {
            case "priceAsc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"));
            case "priceDesc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id"));
            case "newest" -> Sort.by(Sort.Order.desc("newArrival"), Sort.Order.desc("id"));
            default -> Sort.by(Sort.Order.desc("popularity"), Sort.Order.asc("id"));
        };
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    public FilterOptions filterOptions(String categorySlug) {
        String incCd = Category.fromSlug(categorySlug).getCode();
        return new FilterOptions(productRepository.findFeelings(incCd), productRepository.findScenes(incCd));
    }

    public ProductDetail findDetail(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        return ProductDetail.from(product, reviewRepository.averageRating(id), reviewRepository.countByProductId(id));
    }

    public List<ProductSummary> popular() {
        return productRepository.findTop4ByActiveTrueOrderByPopularityDesc().stream().map(ProductSummary::from).toList();
    }

    public List<ProductSummary> newArrivals() {
        return productRepository.findTop4ByActiveTrueAndNewArrivalTrueOrderByIdAsc().stream()
                .map(ProductSummary::from).toList();
    }

    // ---------- 관리자 CRUD ----------

    public PageResponse<ProductDetail> adminList(int page, int size) {
        return PageResponse.of(
                productRepository.findAllByActiveTrue(PageRequest.of(page, size, Sort.by("incCd", "id"))),
                p -> ProductDetail.from(p, 0, 0));
    }

    @Transactional
    public ProductDetail create(ProductRequest request) {
        Product product = productRepository.save(new Product(request.toSpec()));
        return ProductDetail.from(product, 0, 0);
    }

    @Transactional
    public ProductDetail update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        product.apply(request.toSpec());
        return ProductDetail.from(product, reviewRepository.averageRating(id), reviewRepository.countByProductId(id));
    }

    @Transactional
    public void changeStock(Long id, int stock) {
        productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."))
                .changeStock(stock);
    }

    /** 주문·리뷰 이력을 보존하기 위해 실제 삭제 대신 비활성화합니다. */
    @Transactional
    public void delete(Long id) {
        productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."))
                .deactivate();
    }
}
