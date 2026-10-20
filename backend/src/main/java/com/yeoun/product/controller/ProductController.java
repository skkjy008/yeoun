package com.yeoun.product.controller;

import com.yeoun.global.common.PageResponse;
import com.yeoun.product.domain.Category;
import com.yeoun.product.dto.ProductDtos.CategoryResponse;
import com.yeoun.product.dto.ProductDtos.FilterOptions;
import com.yeoun.product.dto.ProductDtos.ProductDetail;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.product.service.ProductService;
import com.yeoun.product.service.ProductService.SearchCondition;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/api/categories")
    public List<CategoryResponse> categories() {
        return Arrays.stream(Category.values()).map(CategoryResponse::from).toList();
    }

    @GetMapping("/api/categories/{slug}/filters")
    public FilterOptions filters(@PathVariable String slug) {
        return productService.filterOptions(slug);
    }

    @GetMapping("/api/products")
    public PageResponse<ProductSummary> search(@RequestParam(required = false) String category,
                                               @RequestParam(required = false) String keyword,
                                               @RequestParam(required = false) String feeling,
                                               @RequestParam(required = false) String scene,
                                               @RequestParam(required = false) Integer minPrice,
                                               @RequestParam(required = false) Integer maxPrice,
                                               @RequestParam(required = false) String sort,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "9") int size) {
        return productService.search(
                new SearchCondition(category, keyword, feeling, scene, minPrice, maxPrice, sort, page, size));
    }

    @GetMapping("/api/products/popular")
    public List<ProductSummary> popular() {
        return productService.popular();
    }

    @GetMapping("/api/products/new")
    public List<ProductSummary> newArrivals() {
        return productService.newArrivals();
    }

    @GetMapping("/api/products/{id:\\d+}")
    public ProductDetail detail(@PathVariable Long id) {
        return productService.findDetail(id);
    }
}
