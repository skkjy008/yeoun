package com.yeoun.cart.dto;

import com.yeoun.cart.domain.CartItem;
import com.yeoun.event.service.SalePricing;
import com.yeoun.product.domain.Product;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class CartDtos {

    private CartDtos() {
    }

    public record AddRequest(@NotNull Long productId, @Min(1) @Max(10) int quantity) {
    }

    public record QuantityRequest(@Min(1) @Max(10) int quantity) {
    }

    public record CartItemResponse(Long id, Long productId, String name, String category, String typeLabel,
                                   String volume, String imageUrl, int unitPrice, int quantity, int lineAmount,
                                   int stock, boolean soldOut, boolean available, int listPrice, int saleRate) {

        /** unitPrice는 테마 특가가 반영된 실제 판매가, listPrice는 정가 */
        public static CartItemResponse from(CartItem item, int saleRate) {
            Product p = item.getProduct();
            boolean available = p.isActive() && !p.isSoldOut() && p.getStock() >= item.getQuantity();
            int unitPrice = SalePricing.salePrice(p.getPrice(), saleRate);
            return new CartItemResponse(item.getId(), p.getId(), p.getName(), p.getCategory().getLabel(),
                    p.getTypeLabel(), p.getVolume(), p.getImageUrl(), unitPrice, item.getQuantity(),
                    unitPrice * item.getQuantity(), p.getStock(), p.isSoldOut(), available, p.getPrice(), saleRate);
        }
    }

    public record CartResponse(List<CartItemResponse> items, int itemsAmount, int shippingFee,
                               int freeShippingThreshold) {
    }
}
