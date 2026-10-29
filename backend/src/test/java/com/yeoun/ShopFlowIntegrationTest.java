package com.yeoun;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeoun.event.domain.Event;
import com.yeoun.event.domain.EventKind;
import com.yeoun.event.repository.EventRepository;
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
import org.springframework.mock.web.MockMultipartFile;
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

    @Autowired
    EventRepository eventRepository;

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

    /** 모의 결제 승인 (토스 키가 없는 테스트 환경) */
    private JsonNode pay(String token, JsonNode payment) throws Exception {
        assertThat(payment.get("provider").asText()).isEqualTo("MOCK");
        return call(post("/api/payments/confirm"), token, Map.of(
                "paymentKey", "MOCK-" + payment.get("orderKey").asText(),
                "orderId", payment.get("orderKey").asText(),
                "amount", payment.get("amount").asInt()), 200);
    }

    /** 주문서 제출 + 결제 승인까지 마친 주문 상세 */
    private JsonNode orderAndPay(String token, Map<String, Object> body) throws Exception {
        JsonNode checkout = call(post("/api/orders"), token, body, 201);
        assertThat(checkout.get("order").get("status").asText()).isEqualTo("PENDING_PAYMENT");
        pay(token, checkout.get("payment"));
        return call(get("/api/orders/" + checkout.get("order").get("id").asLong()), token, null, 200);
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

        // 신규 가입 이벤트: 가입만으로는 쿠폰이 없고, 이벤트에서 한 번만 받을 수 있다
        assertThat(call(get("/api/coupons/me"), token, null, 200)).isEmpty();
        call(post("/api/events/welcome-coupon"), token, null, 201);
        call(post("/api/events/welcome-coupon"), token, null, 409);
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

        JsonNode checkout = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 3, "quantity", 2)), true, couponId), 201);
        // 결제 전: 재고는 예약(차감)되지만 장바구니는 그대로
        assertThat(stockOf(3)).isEqualTo(before - 2);
        assertThat(call(get("/api/cart/count"), token, null, 200).get("count").asLong()).isEqualTo(1);
        assertThat(checkout.get("payment").get("amount").asInt()).isEqualTo(73_000);
        JsonNode result = pay(token, checkout.get("payment"));
        assertThat(result.get("targetType").asText()).isEqualTo("ORDER");
        JsonNode order = call(get("/api/orders/" + result.get("targetId").asLong()), token, null, 200);
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
        JsonNode order = orderAndPay(token, orderBody(List.of(Map.of("productId", 11, "quantity", 1)), false, null));
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
        // 결제 전까지는 아직 제안 받는 중
        assertThat(accepted.get("commission").get("summary").get("status").asText()).isEqualTo("OPEN");
        assertThat(accepted.get("payment").get("amount").asInt()).isEqualTo(65_000);
        pay(requester, accepted.get("payment"));

        JsonNode paid = call(get("/api/commissions/" + commissionId), requester, null, 200);
        assertThat(paid.get("summary").get("status").asText()).isEqualTo("PAID");
        assertThat(paid.get("agreedPrice").asInt()).isEqualTo(65_000);
        assertThat(paid.get("viewer").get("cancelRefundAmount").asInt()).isEqualTo(65_000);

        call(post("/api/commissions/" + commissionId + "/deliver"), perfumer,
                Map.of("note", "아직 시작 전"), 400);
        call(post("/api/commissions/" + commissionId + "/start"), perfumer, null, 200);
        call(post("/api/commissions/" + commissionId + "/review"), requester,
                Map.of("scentRating", 5, "perfumerRating", 5, "content", "아직"), 400);
        call(post("/api/commissions/" + commissionId + "/deliver"), perfumer,
                Map.of("note", "200g 캔들 한 개를 보냈어요."), 200);
        call(post("/api/commissions/" + commissionId + "/cancel"), requester, Map.of("reason", "전달 후"), 400);
        JsonNode reviewed = call(post("/api/commissions/" + commissionId + "/review"), requester,
                Map.of("scentRating", 5, "perfumerRating", 4, "content", "골목의 공기가 그대로 담겼어요."), 200);
        assertThat(reviewed.get("summary").get("status").asText()).isEqualTo("COMPLETED");
        assertThat(reviewed.get("review").get("perfumerRating").asInt()).isEqualTo(4);

        // 구매 확정 → 수수료 10%를 뺀 금액이 조향사 정산 대기로
        JsonNode settled = call(get("/api/commissions/" + commissionId), perfumer, null, 200);
        assertThat(settled.get("settlement").get("grossAmount").asInt()).isEqualTo(65_000);
        assertThat(settled.get("settlement").get("feeAmount").asInt()).isEqualTo(6_500);
        assertThat(settled.get("settlement").get("netAmount").asInt()).isEqualTo(58_500);
        assertThat(settled.get("settlement").get("status").asText()).isEqualTo("PENDING");

        JsonNode mine = call(get("/api/commissions/me"), requester, null, 200);
        assertThat(mine).hasSize(1);
    }

    private long openCommissionWithProposal(String requester, String perfumer, int price) throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("title", "환불 테스트 의뢰 " + UUID.randomUUID().toString().substring(0, 4));
        request.put("incCd", "");
        request.put("description", "환불과 정산 정책을 확인하기 위한 테스트 의뢰입니다. 스무 자를 넘겨 적어요.");
        request.put("budget", price);
        long id = call(post("/api/commissions"), requester, request, 201).get("summary").get("id").asLong();
        call(post("/api/commissions/" + id + "/proposals"), perfumer,
                Map.of("price", price, "workingDays", 10, "message", "제안합니다."), 201);
        long proposalId = call(get("/api/commissions/" + id), requester, null, 200)
                .get("proposals").get(0).get("id").asLong();
        JsonNode accepted = call(post("/api/commissions/" + id + "/proposals/" + proposalId + "/accept"), requester,
                Map.of("paymentMethod", "CARD"), 200);
        pay(requester, accepted.get("payment"));
        return id;
    }

    @Test
    void 커미션_환불은_단계별로_다르고_제작중_취소분은_조향사에게_정산된다() throws Exception {
        String perfumer = login("atelier@yeoun.example", "yeoun1234!");

        // 결제 완료(제작 전) 취소 → 전액 환불
        String requesterA = signupNewMember();
        long paidOnly = openCommissionWithProposal(requesterA, perfumer, 80_000);
        JsonNode cancelledA = call(post("/api/commissions/" + paidOnly + "/cancel"), requesterA,
                Map.of("reason", "마음이 바뀌었어요"), 200);
        assertThat(cancelledA.get("summary").get("status").asText()).isEqualTo("CANCELLED");
        assertThat(cancelledA.get("refundAmount").asInt()).isEqualTo(80_000);

        // 제작 중 취소 → 50% 환불, 나머지 50%에서 수수료 10%를 뺀 금액이 조향사 정산
        String requesterB = signupNewMember();
        long inProgress = openCommissionWithProposal(requesterB, perfumer, 90_000);
        call(post("/api/commissions/" + inProgress + "/start"), perfumer, null, 200);
        JsonNode before = call(get("/api/commissions/" + inProgress), requesterB, null, 200);
        assertThat(before.get("viewer").get("cancelRefundAmount").asInt()).isEqualTo(45_000);
        JsonNode cancelledB = call(post("/api/commissions/" + inProgress + "/cancel"), requesterB, null, 200);
        assertThat(cancelledB.get("refundAmount").asInt()).isEqualTo(45_000);

        JsonNode settlements = call(get("/api/settlements/me"), perfumer, null, 200);
        JsonNode partial = null;
        for (JsonNode item : settlements.get("items")) {
            if (item.get("commissionId").asLong() == inProgress) {
                partial = item;
            }
        }
        assertThat(partial).isNotNull();
        assertThat(partial.get("reason").asText()).isEqualTo("PARTIAL_CANCEL");
        assertThat(partial.get("grossAmount").asInt()).isEqualTo(45_000);
        assertThat(partial.get("netAmount").asInt()).isEqualTo(40_500);

        // 운영자 지급 처리
        String admin = login("admin@yeoun.example", "admin1234!");
        JsonNode paidOut = call(post("/api/admin/settlements/" + partial.get("id").asLong() + "/pay"), admin, null, 200);
        assertThat(paidOut.get("status").asText()).isEqualTo("PAID");
        call(post("/api/admin/settlements/" + partial.get("id").asLong() + "/pay"), admin, null, 409);
    }

    @Test
    void 결제_금액을_바꾸거나_결제창에서_취소하면_예약한_재고가_돌아온다() throws Exception {
        String token = signupNewMember();
        JsonNode config = call(get("/api/payments/config"), token, null, 200);
        assertThat(config.get("provider").asText()).isEqualTo("MOCK");
        assertThat(config.get("customerKey").asText()).startsWith("YN_");
        int before = stockOf(4);

        JsonNode checkout = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 4, "quantity", 1)), false, null), 201);
        assertThat(stockOf(4)).isEqualTo(before - 1);
        JsonNode payment = checkout.get("payment");
        call(post("/api/payments/confirm"), token, Map.of("paymentKey", "MOCK-x-" + payment.get("orderKey").asText(),
                "orderId", payment.get("orderKey").asText(), "amount", 100), 400);
        assertThat(stockOf(4)).isEqualTo(before);
        JsonNode failed = call(get("/api/orders/" + checkout.get("order").get("id").asLong()), token, null, 200);
        assertThat(failed.get("status").asText()).isEqualTo("PAYMENT_FAILED");
        // 실패한 결제는 다시 승인할 수 없다
        call(post("/api/payments/confirm"), token, Map.of("paymentKey", "MOCK-" + payment.get("orderKey").asText(),
                "orderId", payment.get("orderKey").asText(), "amount", payment.get("amount").asInt()), 409);

        JsonNode second = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 4, "quantity", 1)), false, null), 201);
        mvc.perform(post("/api/payments/fail").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("orderId",
                                second.get("payment").get("orderKey").asText(), "code", "PAY_PROCESS_CANCELED",
                                "message", "사용자가 결제를 취소했습니다."))))
                .andExpect(status().isNoContent());
        assertThat(stockOf(4)).isEqualTo(before);
        // 결제 대기·실패 주문은 마이페이지 목록에 보이지 않는다
        assertThat(call(get("/api/orders"), token, null, 200).get("totalElements").asLong()).isZero();
    }

    @Test
    void 테마_큐레이션을_조회하고_운영자가_만든다() throws Exception {
        JsonNode themes = call(get("/api/themes"), null, null, 200);
        assertThat(themes.size()).isGreaterThanOrEqualTo(4);
        JsonNode gift = call(get("/api/themes/anniversary-gift"), null, null, 200);
        assertThat(gift.get("summary").get("active").asBoolean()).isTrue();
        assertThat(gift.get("items")).hasSize(4);
        assertThat(gift.get("items").get(0).get("note").asText()).isNotBlank();

        String admin = login("admin@yeoun.example", "admin1234!");
        Map<String, Object> body = new HashMap<>();
        body.put("slug", "rainy-season");
        body.put("title", "장마철, 눅눅함을 걷어 내는 향");
        body.put("heroImageUrl", "/images/hero/hero-1.jpg");
        body.put("sortOrder", 9);
        body.put("published", false);
        body.put("items", List.of(Map.of("productId", 2, "note", "비 온 뒤의 풀 향"),
                Map.of("productId", 2, "note", "중복은 한 번만")));
        JsonNode created = call(post("/api/admin/themes"), admin, body, 201);
        assertThat(created.get("items")).hasSize(1);
        call(get("/api/themes/rainy-season"), null, null, 404); // 비공개
        call(post("/api/admin/themes"), admin, body, 409);      // 주소 중복
        String user = signupNewMember();
        call(post("/api/admin/themes"), user, body, 403);
    }

    @Test
    void 이미지를_올리면_URL을_돌려주고_권한과_형식을_검사한다() throws Exception {
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        String admin = login("admin@yeoun.example", "admin1234!");
        String user = signupNewMember();

        String body = mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("file", "a.png", "image/png", png))
                        .param("purpose", "PRODUCT").header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(body).get("url").asText()).startsWith("/uploads/products/").endsWith(".png");

        mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("file", "a.png", "image/png", png))
                        .param("purpose", "PRODUCT").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api/uploads")
                        .file(new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes()))
                        .param("purpose", "COMMISSION").header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 테마_특가_상품은_목록_장바구니_주문에_할인가로_계산된다() throws Exception {
        // 날짜에 상관없이 돌도록 기간 없는 특가 이벤트 + 전용 테마(허브의 정원 34,000원)를 만든다
        String admin = login("admin@yeoun.example", "admin1234!");
        Map<String, Object> theme = new HashMap<>();
        theme.put("slug", "test-herb-sale");
        theme.put("title", "허브 특가 테스트");
        theme.put("heroImageUrl", "/images/hero/hero-1.jpg");
        theme.put("sortOrder", 99);
        theme.put("published", true);
        theme.put("items", List.of(Map.of("productId", 36, "note", "특가 대상")));
        call(post("/api/admin/themes"), admin, theme, 201);
        eventRepository.save(new Event("test-herb-sale", EventKind.THEME_SALE, "허브 특가", "요약", "본문",
                "/images/hero/hero-1.jpg", null, null, "test-herb-sale", 30, 99));

        JsonNode detail = call(get("/api/products/36"), null, null, 200);
        assertThat(detail.get("price").asInt()).isEqualTo(34_000);
        assertThat(detail.get("saleRate").asInt()).isEqualTo(30);
        assertThat(detail.get("salePrice").asInt()).isEqualTo(23_800);
        // 특가가 아닌 상품은 판매가 = 정가
        JsonNode plain = call(get("/api/products/35"), null, null, 200);
        assertThat(plain.get("salePrice").asInt()).isEqualTo(plain.get("price").asInt());
        assertThat(plain.get("saleRate").asInt()).isZero();

        String token = signupNewMember();
        JsonNode cart = call(post("/api/cart/items"), token, Map.of("productId", 36, "quantity", 2), 200);
        JsonNode line = cart.get("items").get(0);
        assertThat(line.get("listPrice").asInt()).isEqualTo(34_000);
        assertThat(line.get("unitPrice").asInt()).isEqualTo(23_800);
        assertThat(cart.get("itemsAmount").asInt()).isEqualTo(47_600);
        assertThat(cart.get("shippingFee").asInt()).isEqualTo(3_000);

        JsonNode checkout = call(post("/api/orders"), token,
                orderBody(List.of(Map.of("productId", 36, "quantity", 2)), true, null), 201);
        assertThat(checkout.get("payment").get("amount").asInt()).isEqualTo(50_600);
        JsonNode order = call(get("/api/orders/" + checkout.get("order").get("id").asLong()), token, null, 200);
        assertThat(order.get("itemsAmount").asInt()).isEqualTo(47_600);
        assertThat(order.get("items").get(0).get("unitPrice").asInt()).isEqualTo(23_800);
    }

    @Test
    void 이벤트_목록과_상세를_조회한다() throws Exception {
        JsonNode events = call(get("/api/events"), null, null, 200);
        assertThat(events.size()).isGreaterThanOrEqualTo(4);
        JsonNode halloween = call(get("/api/events/halloween-sale"), null, null, 200);
        assertThat(halloween.get("themeSlug").asText()).isEqualTo("halloween-night");
        assertThat(halloween.get("summary").get("kind").asText()).isEqualTo("THEME_SALE");
        call(get("/api/events/no-such-event"), null, null, 404);
    }

    @Test
    void 룰렛은_하루에_한_번만_돌릴_수_있다() throws Exception {
        String token = signupNewMember();
        call(post("/api/events/roulette/spin"), null, null, 401);
        JsonNode status = call(get("/api/events/roulette/status"), token, null, 200);
        assertThat(status.get("spunToday").asBoolean()).isFalse();
        assertThat(status.get("prizes")).hasSize(4);

        if (!status.get("eventActive").asBoolean()) {
            // 테스트가 이벤트 기간 밖에서 돌 때
            call(post("/api/events/roulette/spin"), token, null, 400);
            return;
        }
        JsonNode result = call(post("/api/events/roulette/spin"), token, null, 200);
        assertThat(result.get("prize").asText()).isIn("MISS", "OFF_10", "OFF_20", "OFF_50");
        if (!"MISS".equals(result.get("prize").asText())) {
            assertThat(result.get("coupon").get("discountRate").asInt()).isEqualTo(result.get("rate").asInt());
            assertThat(call(get("/api/coupons/me"), token, null, 200)).hasSize(1);
        }
        call(post("/api/events/roulette/spin"), token, null, 409);
        assertThat(call(get("/api/events/roulette/status"), token, null, 200).get("spunToday").asBoolean()).isTrue();
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
