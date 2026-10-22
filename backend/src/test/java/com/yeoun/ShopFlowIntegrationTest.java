package com.yeoun;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** 2단계: 장바구니 → 주문/모의 결제 → 취소, 쿠폰, 마이페이지, 커미션 흐름 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class ShopFlowIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    private JsonNode call(MockHttpServletRequestBuilder request, String token, Object body, int expectedStatus)
            throws Exception {
        if (token != null) {
            request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        }
        String response = mvc.perform(request)
                .andExpect(status().is(expectedStatus))
                .andReturn().getResponse().getContentAsString();
        return response.isBlank() ? null : objectMapper.readTree(response);
    }

    private String login(String email, String password) throws Exception {
        return call(post("/api/auth/login"), null, Map.of("email", email, "password", password), 200)
                .get("accessToken").asText();
    }

    private String signupNewMember() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("email", "shop-" + UUID.randomUUID().toString().substring(0, 8) + "@yeoun.example");
        body.put("password", "scent1234!");
        body.put("name", "향기로운");
        body.put("phone", "010-2222-3333");
        body.put("termsAgreed", true);
        body.put("privacyAgreed", true);
        body.put("marketingAgreed", false);
        body.put("perfumer", false);
        return call(post("/api/auth/signup"), null, body, 201).get("accessToken").asText();
    }

    private int stockOf(long productId) throws Exception {
        return call(get("/api/products/" + productId), null, null, 200).get("stock").asInt();
    }

    private Map<String, Object> orderBody(List<Map<String, Object>> items, boolean fromCart, Long couponId) {
        Map<String, Object> body = new HashMap<>();
        body.put("items", items);
        body.put("fromCart", fromCart);
        body.put("orderer", Map.of("name", "향기로운", "phone", "010-2222-3333", "email", "buyer@yeoun.example"));
        body.put("shipping", Map.of("recipientName", "향기로운", "recipientPhone", "010-2222-3333",
                "zipCode", "04524", "address1", "서울특별시 중구 세종대로 110", "address2", "302호",
                "memo", "문 앞에 놓아 주세요."));
        body.put("saveAsDefaultAddress", true);
        body.put("paymentMethod", "CARD");
        body.put("paymentProvider", "여운카드");
        body.put("couponId", couponId);
        body.put("usePoint", 0);
        body.put("agreed", true);
        return body;
    }

    @Test
    void 가입하면_환영_쿠폰이_발급되고_장바구니에서_주문하면_재고가_줄고_취소하면_돌아온다() throws Exception {
        String token = signupNewMember();

        JsonNode coupons = call(get("/api/coupons/me"), token, null, 200);
        assertThat(coupons).hasSize(1);
        assertThat(coupons.get(0).get("discountAmount").asInt()).isEqualTo(3000);
        long couponId = coupons.get(0).get("id").asLong();

        int before = stockOf(3);
        call(post("/api/cart/items"), token, Map.of("productId", 3, "quantity", 1), 200);
        JsonNode cart = call(post("/api/cart/items"), token, Map.of("productId", 3, "quantity", 1), 200);
        assertThat(cart.get("items")).hasSize(1);
        assertThat(cart.get("items").get(0).get("quantity").asInt()).isEqualTo(2);
        assertThat(cart.get("itemsAmount").asInt()).isEqualTo(76_000);
        assertThat(cart.get("shippingFee").asInt()).isZero();

        JsonNode order = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 3, "quantity", 2)), true, couponId), 201);
        assertThat(order.get("orderNumber").asText()).matches("YN-\\d{8}-\\d{4}");
        assertThat(order.get("status").asText()).isEqualTo("PAID");
        assertThat(order.get("couponDiscount").asInt()).isEqualTo(3000);
        assertThat(order.get("totalAmount").asInt()).isEqualTo(73_000);
        assertThat(order.get("paymentApprovalNo").asText()).startsWith("MOCK-");
        assertThat(stockOf(3)).isEqualTo(before - 2);
        assertThat(call(get("/api/cart/count"), token, null, 200).get("count").asLong()).isZero();

        JsonNode summary = call(get("/api/members/me/summary"), token, null, 200);
        assertThat(summary.get("orderStatusCounts").get("PAID").asLong()).isEqualTo(1);
        assertThat(summary.get("usableCoupons").asLong()).isZero();
        assertThat(summary.get("address").get("zipCode").asText()).isEqualTo("04524");

        long orderId = order.get("id").asLong();
        JsonNode cancelled = call(post("/api/orders/" + orderId + "/cancel"), token, null, 200);
        assertThat(cancelled.get("status").asText()).isEqualTo("CANCELLED");
        assertThat(stockOf(3)).isEqualTo(before);
        assertThat(call(get("/api/coupons/me"), token, null, 200).get(0).get("usable").asBoolean()).isTrue();
    }

    @Test
    void 품절_상품은_주문할_수_없다() throws Exception {
        String token = signupNewMember();
        call(post("/api/orders"), token, orderBody(List.of(Map.of("productId", 27, "quantity", 1)), false, null), 409);
        call(post("/api/cart/items"), token, Map.of("productId", 27, "quantity", 1), 400);
    }

    @Test
    void 운영자가_배송완료로_바꾸면_적립금이_쌓이고_단계를_건너뛸_수_없다() throws Exception {
        String token = signupNewMember();
        String admin = login("admin@yeoun.example", "admin1234!");
        JsonNode order = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 11, "quantity", 1)), false, null), 201);
        assertThat(order.get("shippingFee").asInt()).isEqualTo(3000);
        long orderId = order.get("id").asLong();

        call(patch("/api/admin/orders/" + orderId + "/status"), admin, Map.of("status", "SHIPPING"), 400);
        call(patch("/api/admin/orders/" + orderId + "/status"), admin, Map.of("status", "PREPARING"), 200);
        call(post("/api/orders/" + orderId + "/cancel"), token, null, 400);
        call(patch("/api/admin/orders/" + orderId + "/status"), admin, Map.of("status", "SHIPPING"), 200);
        JsonNode delivered = call(patch("/api/admin/orders/" + orderId + "/status"), admin,
                Map.of("status", "DELIVERED"), 200);
        assertThat(delivered.get("earnedPoint").asInt()).isEqualTo(220);

        JsonNode summary = call(get("/api/members/me/summary"), token, null, 200);
        assertThat(summary.get("point").asInt()).isEqualTo(220);
        assertThat(summary.get("grade").get("totalSpent").asLong()).isEqualTo(25_000);
        assertThat(summary.get("grade").get("nextGrade").asText()).isEqualTo("SILVER");

        JsonNode notifications = call(get("/api/notifications"), token, null, 200);
        assertThat(notifications.get(0).get("type").asText()).isEqualTo("ORDER_STATUS");
        call(get("/api/admin/orders"), token, null, 403);
    }

    @Test
    void 커미션을_등록하면_조향사에게_알림이_가고_선결제부터_후기까지_진행된다() throws Exception {
        String requester = signupNewMember();
        String perfumer = login("atelier@yeoun.example", "yeoun1234!");

        Map<String, Object> request = new HashMap<>();
        request.put("title", "첫눈 오는 날의 골목");
        request.put("incCd", "004");
        request.put("moods", "첫눈, 군고구마, 털장갑");
        request.put("description", "첫눈이 내리던 저녁 골목에서 맡았던 차갑고도 달큰한 공기를 캔들로 만들고 싶어요.");
        request.put("budget", 70_000);
        JsonNode created = call(post("/api/commissions"), requester, request, 201);
        long commissionId = created.get("summary").get("id").asLong();
        assertThat(created.get("summary").get("status").asText()).isEqualTo("OPEN");
        assertThat(created.get("viewer").get("requester").asBoolean()).isTrue();

        JsonNode perfumerNotifications = call(get("/api/notifications"), perfumer, null, 200);
        assertThat(perfumerNotifications.get(0).get("type").asText()).isEqualTo("COMMISSION_REQUEST");
        assertThat(perfumerNotifications.get(0).get("link").asText()).isEqualTo("/custom/" + commissionId);

        // 일반 회원은 제안할 수 없고, 비회원도 게시판 목록은 볼 수 있다.
        call(post("/api/commissions/" + commissionId + "/proposals"), requester,
                Map.of("price", 65_000, "workingDays", 7, "message", "제안"), 403);
        mvc.perform(get("/api/commissions")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("첫눈 오는 날의 골목"));

        JsonNode proposed = call(post("/api/commissions/" + commissionId + "/proposals"), perfumer,
                Map.of("price", 65_000, "workingDays", 7, "message", "통카빈과 스노우 머스크로 풀어 볼게요."), 201);
        assertThat(proposed.get("viewer").get("proposed").asBoolean()).isTrue();
        call(post("/api/commissions/" + commissionId + "/proposals"), perfumer,
                Map.of("price", 60_000, "workingDays", 7, "message", "다시"), 409);

        JsonNode detail = call(get("/api/commissions/" + commissionId), requester, null, 200);
        long proposalId = detail.get("proposals").get(0).get("id").asLong();
        assertThat(detail.get("proposals").get(0).get("perfumer").get("studioName").asText()).isEqualTo("아틀리에 소향");

        JsonNode accepted = call(post("/api/commissions/" + commissionId + "/proposals/" + proposalId + "/accept"),
                requester, Map.of("paymentMethod", "EASY_PAY"), 200);
        assertThat(accepted.get("summary").get("status").asText()).isEqualTo("IN_PROGRESS");
        assertThat(accepted.get("agreedPrice").asInt()).isEqualTo(65_000);

        call(post("/api/commissions/" + commissionId + "/review"), requester,
                Map.of("scentRating", 5, "perfumerRating", 5, "content", "아직"), 400);
        call(post("/api/commissions/" + commissionId + "/deliver"), perfumer,
                Map.of("note", "200g 캔들 한 개를 보냈어요."), 200);
        JsonNode reviewed = call(post("/api/commissions/" + commissionId + "/review"), requester,
                Map.of("scentRating", 5, "perfumerRating", 4, "content", "골목의 공기가 그대로 담겼어요."), 200);
        assertThat(reviewed.get("summary").get("status").asText()).isEqualTo("COMPLETED");
        assertThat(reviewed.get("review").get("perfumerRating").asInt()).isEqualTo(4);

        JsonNode mine = call(get("/api/commissions/me"), requester, null, 200);
        assertThat(mine).hasSize(1);
    }

    @Test
    void 찜과_회원정보_수정() throws Exception {
        String token = signupNewMember();
        call(put("/api/wishlist/1"), token, null, 204);
        call(put("/api/wishlist/1"), token, null, 204);
        assertThat(call(get("/api/wishlist/ids"), token, null, 200)).hasSize(1);

        JsonNode updated = call(put("/api/members/me"), token,
                Map.of("name", "새이름", "phone", "010-9999-0000", "marketingAgreed", true), 200);
        assertThat(updated.get("name").asText()).isEqualTo("새이름");
        call(patch("/api/members/me/password"), token,
                Map.of("currentPassword", "wrong-pass", "newPassword", "newscent1234!"), 400);
        call(patch("/api/members/me/password"), token,
                Map.of("currentPassword", "scent1234!", "newPassword", "newscent1234!"), 204);
    }
}
