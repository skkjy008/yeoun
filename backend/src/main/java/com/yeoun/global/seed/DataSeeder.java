package com.yeoun.global.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeoun.commission.domain.Commission;
import com.yeoun.commission.domain.CommissionProposal;
import com.yeoun.commission.repository.CommissionProposalRepository;
import com.yeoun.commission.domain.Settlement;
import com.yeoun.commission.repository.CommissionRepository;
import com.yeoun.commission.repository.SettlementRepository;
import com.yeoun.coupon.domain.Coupon;
import com.yeoun.coupon.repository.CouponRepository;
import com.yeoun.global.config.YeounProperties;
import com.yeoun.member.domain.Address;
import com.yeoun.member.domain.Grade;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification;
import com.yeoun.notification.repository.NotificationRepository;
import com.yeoun.order.domain.Order;
import com.yeoun.order.domain.OrderItem;
import com.yeoun.order.domain.OrderStatus;
import com.yeoun.order.domain.PaymentMethod;
import com.yeoun.order.domain.ShippingPolicy;
import com.yeoun.order.repository.OrderRepository;
import com.yeoun.post.domain.Post;
import com.yeoun.post.repository.PostRepository;
import com.yeoun.preference.domain.PreferenceOption;
import com.yeoun.preference.domain.PreferenceQuestion;
import com.yeoun.preference.repository.PreferenceQuestionRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.domain.ScentNote;
import com.yeoun.product.domain.Track;
import com.yeoun.product.repository.ProductRepository;
import com.yeoun.review.domain.Review;
import com.yeoun.review.repository.ReviewRepository;
import com.yeoun.theme.domain.Theme;
import com.yeoun.theme.repository.ThemeRepository;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 예시 데이터 생성기. 테이블이 비어 있을 때만 실행되어 재시작해도 중복 생성되지 않습니다.
 * 데이터 원본은 resources/seed/*.json 입니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final YeounProperties properties;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final MemberRepository memberRepository;
    private final PerfumerApplicationRepository applicationRepository;
    private final NotificationRepository notificationRepository;
    private final ProductRepository productRepository;
    private final PreferenceQuestionRepository questionRepository;
    private final PostRepository postRepository;
    private final ReviewRepository reviewRepository;
    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final CommissionRepository commissionRepository;
    private final CommissionProposalRepository proposalRepository;
    private final SettlementRepository settlementRepository;
    private final ThemeRepository themeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (!properties.seed().enabled()) {
            return;
        }
        if (memberRepository.count() == 0) {
            seedMembers();
        }
        if (productRepository.count() == 0) {
            seedProducts();
        }
        if (questionRepository.count() == 0) {
            seedQuestions();
        }
        if (postRepository.count() == 0) {
            seedPosts();
        }
        if (reviewRepository.count() == 0) {
            seedReviews();
        }
        if (couponRepository.count() == 0) {
            seedCoupons();
        }
        if (orderRepository.count() == 0) {
            seedOrders();
        }
        if (commissionRepository.count() == 0) {
            seedCommissions();
        }
        if (themeRepository.count() == 0) {
            seedThemes();
        }
    }

    private JsonNode read(String path) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return objectMapper.readTree(in);
        }
    }

    private void seedMembers() {
        String demoPassword = passwordEncoder.encode("yeoun1234!");
        memberRepository.save(Member.builder()
                .email(properties.seed().adminEmail())
                .password(passwordEncoder.encode(properties.seed().adminPassword()))
                .name("여운 운영자").phone("010-0000-0000").role(Role.ADMIN).grade(Grade.DIAMOND).build());

        memberRepository.saveAll(List.of(
                member("yeon@yeoun.example", demoPassword, "김여연", Grade.GOLD),
                member("seowoo@yeoun.example", demoPassword, "박서우", Grade.SILVER),
                member("haseo@yeoun.example", demoPassword, "이하서", Grade.PLATINUM),
                member("walk@yeoun.example", demoPassword, "산책하는이", Grade.BRONZE)));

        Member approved = memberRepository.save(member("atelier@yeoun.example", demoPassword, "정소향", Grade.GOLD));
        PerfumerApplication approvedApp = applicationRepository.save(PerfumerApplication.builder()
                .member(approved).studioName("아틀리에 소향").careerYears(7)
                .certification("조향사 자격증 (예시)").portfolioUrl("https://example.com/sohyang")
                .introduction("비 오는 날의 숲과 오래된 서재의 향을 즐겨 만듭니다.").build());
        approvedApp.approve();

        Member pending = memberRepository.save(member("newnose@yeoun.example", demoPassword, "한지향", Grade.BRONZE));
        applicationRepository.save(PerfumerApplication.builder()
                .member(pending).studioName("지향 랩").careerYears(2)
                .certification("향료 아카데미 수료 (예시)").portfolioUrl("https://example.com/jihyang")
                .introduction("판타지 세계관 속 장소를 향으로 옮기는 작업을 하고 있어요.").build());

        memberRepository.findAllByRole(Role.ADMIN).forEach(admin -> notificationRepository.save(new Notification(
                admin, Notification.Type.PERFUMER_APPLICATION, "한지향 님이 조향사 인증을 요청했습니다.",
                "/admin/perfumers")));
        log.info("[seed] 회원 데이터를 생성했습니다. 관리자: {}", properties.seed().adminEmail());
    }

    private static Member member(String email, String password, String name, Grade grade) {
        return Member.builder().email(email).password(password).name(name).phone("010-1234-5678")
                .role(Role.USER).grade(grade).marketingAgreed(true).build();
    }

    private void seedProducts() throws IOException {
        JsonNode categories = read("seed/categories.json");
        List<Product> products = new ArrayList<>();
        for (JsonNode p : read("seed/products.json")) {
            String incCd = p.get("incCd").asText();
            JsonNode defaults = categories.get(incCd);

            List<ScentNote> notes = new ArrayList<>();
            p.path("notes").forEach(n -> notes.add(new ScentNote(n.get(0).asText(), n.get(1).asText())));

            List<Track> tracks = new ArrayList<>();
            if (p.has("tracks")) {
                p.get("tracks").forEach(t -> tracks.add(new Track(t.get(0).asText(), t.get(1).asText(), null)));
            } else {
                defaults.get("tracks").forEach(t ->
                        tracks.add(new Track(t.get("title").asText(), t.get("artist").asText(), null)));
            }

            Set<String> tags = new LinkedHashSet<>();
            p.path("tags").forEach(t -> tags.add(t.asText()));

            products.add(new Product(new Product.Spec(
                    incCd,
                    p.get("name").asText(),
                    p.get("subtitle").asText(),
                    text(p, "englishLine"),
                    defaults.get("typeLabel").asText(),
                    defaults.get("volume").asText(),
                    p.get("price").asInt(),
                    p.get("stock").asInt(),
                    p.get("image").asText(),
                    text(p, "thumbnail"),
                    text(p, "artwork"),
                    text(p, "artworkCaption"),
                    text(p, "scentFamily"),
                    text(p, "feeling"),
                    text(p, "scene"),
                    text(p, "bestPlace"),
                    defaults.get("composition").asText(),
                    text(p, "storyTitle"),
                    text(p, "storyBody"),
                    defaults.get("safetyNotice").asText(),
                    p.has("playlistTitle") ? p.get("playlistTitle").asText() : defaults.get("playlistTitle").asText(),
                    p.path("intensity").asInt(2),
                    p.path("popularity").asInt(0),
                    p.path("newArrival").asBoolean(false),
                    notes,
                    strings(defaults.get("ritualSteps")),
                    p.has("poem") ? strings(p.get("poem")) : strings(defaults.get("poem")),
                    tracks,
                    tags)));
        }
        productRepository.saveAll(products);
        log.info("[seed] 상품 {}개를 생성했습니다.", products.size());
    }

    private void seedQuestions() throws IOException {
        for (JsonNode q : read("seed/questions.json")) {
            PreferenceQuestion question = new PreferenceQuestion(q.get("no").asInt(), q.get("step").asText(),
                    q.get("english").asText(), q.get("title").asText(), q.get("guide").asText(),
                    q.get("layout").asText());
            int optionNo = 1;
            for (JsonNode o : q.get("options")) {
                question.addOption(new PreferenceOption(optionNo++, o.get("label").asText(), text(o, "image"),
                        text(o, "tags"), text(o, "category"),
                        o.has("intensity") ? o.get("intensity").asInt() : null));
            }
            questionRepository.save(question);
        }
        log.info("[seed] 나만의 향 찾기 질문을 생성했습니다.");
    }

    private void seedPosts() throws IOException {
        int order = 1;
        for (JsonNode p : read("seed/posts.json")) {
            postRepository.save(new Post(new Post.Spec(Post.Type.BANNER, text(p, "eyebrow"), p.get("title").asText(),
                    text(p, "body"), text(p, "ctaLabel"), text(p, "ctaLink"), text(p, "image"), text(p, "caption"),
                    text(p, "footnote"), order++, true)));
        }
    }

    private void seedReviews() {
        List<Product> products = productRepository.findAll();
        Product forest = findByName(products, "숲의 잔향");
        Product night = findByName(products, "고요한 밤");
        Product skin = findByName(products, "살결의 온도");
        if (forest == null || night == null || skin == null) {
            return;
        }
        Member yeon = memberRepository.findByEmail("yeon@yeoun.example").orElse(null);
        Member seowoo = memberRepository.findByEmail("seowoo@yeoun.example").orElse(null);
        Member haseo = memberRepository.findByEmail("haseo@yeoun.example").orElse(null);
        Member walker = memberRepository.findByEmail("walk@yeoun.example").orElse(null);
        if (yeon == null || seowoo == null || haseo == null || walker == null) {
            return;
        }
        // 생성 순서의 역순으로 메인 페이지에 노출되므로 마지막에 보일 후기부터 저장합니다.
        reviewRepository.save(new Review(skin, haseo, 5, "향이 아니라,\n제 분위기가 된 것 같아요.",
                "포근하고 깨끗한 잔향이 오래 남아요. 매일 손이 가는 저만의 향이 되었어요.", true));
        reviewRepository.save(new Review(night, seowoo, 5, "하루를 마무리하는\n가장 조용한 방법.",
                "잠들기 전 한 개비를 태우는 시간이 생겼어요. 나에게 집중하는 작은 습관이에요.", true));
        reviewRepository.save(new Review(forest, yeon, 5, "집에 돌아오는 순간이\n조금 더 기다려져요.",
                "현관에 두었는데 문을 열 때마다 숲을 만난 기분이에요. 과하지 않아 더 좋아요.", true));
        reviewRepository.save(new Review(forest, walker, 4, null,
                "젖은 이끼 아트워크를 보니 비 오는 날 창문을 조금 열어 둔 서재가 떠올라요.", false));
    }

    private void seedCoupons() {
        memberRepository.findAll().stream()
                .filter(m -> m.getRole() != Role.ADMIN)
                .forEach(m -> couponRepository.save(Coupon.welcome(m)));
    }

    /** 데모 회원(김여연)의 주문 내역: 배송 완료 1건, 배송 중 1건 */
    private void seedOrders() {
        Member yeon = memberRepository.findByEmail("yeon@yeoun.example").orElse(null);
        List<Product> products = productRepository.findAll();
        Product forest = findByName(products, "숲의 잔향");
        Product night = findByName(products, "고요한 밤");
        Product skin = findByName(products, "살결의 온도");
        Product afternoon = findByName(products, "느린 오후");
        if (yeon == null || forest == null || night == null || skin == null || afternoon == null) {
            return;
        }
        Address address = new Address("김여연", "010-1234-5678", "04524", "서울특별시 중구 세종대로 110", "여운빌 302호");
        yeon.changeAddress(address);

        Order delivered = demoOrder(yeon, address, "YN-20261012-0417", List.of(forest, night), List.of(1, 2));
        delivered.advanceTo(OrderStatus.PREPARING);
        delivered.advanceTo(OrderStatus.SHIPPING);
        delivered.advanceTo(OrderStatus.DELIVERED);
        yeon.addPoint(delivered.earnPoint());
        orderRepository.save(delivered);

        Order shipping = demoOrder(yeon, address, "YN-20261018-2731", List.of(skin, afternoon), List.of(1, 1));
        shipping.advanceTo(OrderStatus.PREPARING);
        shipping.advanceTo(OrderStatus.SHIPPING);
        orderRepository.save(shipping);
    }

    private static Order demoOrder(Member member, Address address, String number, List<Product> products,
                                   List<Integer> quantities) {
        Order order = Order.builder().orderNumber(number).member(member).ordererName(member.getName())
                .ordererPhone(member.getPhone()).ordererEmail(member.getEmail()).shippingAddress(address)
                .deliveryMemo("문 앞에 놓아 주세요.").paymentMethod(PaymentMethod.CARD).paymentProvider("여운카드(예시)")
                .fromCart(false).build();
        for (int i = 0; i < products.size(); i++) {
            order.addItem(new OrderItem(products.get(i), quantities.get(i)));
        }
        order.applyDiscounts(null, 0, 0, ShippingPolicy.feeFor(order.getItemsAmount()));
        order.markPaid("MOCK-SEED-" + number.substring(number.length() - 4), "여운카드(예시)");
        return order;
    }

    /** 커미션 게시판 예시: 제안 받는 중 2건, 후기까지 끝난 1건 */
    private void seedCommissions() {
        Member seowoo = memberRepository.findByEmail("seowoo@yeoun.example").orElse(null);
        Member haseo = memberRepository.findByEmail("haseo@yeoun.example").orElse(null);
        Member walker = memberRepository.findByEmail("walk@yeoun.example").orElse(null);
        Member atelier = memberRepository.findByEmail("atelier@yeoun.example").orElse(null);
        if (seowoo == null || haseo == null || walker == null || atelier == null) {
            return;
        }
        Commission done = commissionRepository.save(Commission.builder().requester(haseo)
                .title("할머니 댁 마당의 무화과나무").incCd("003").moods("여름 오후, 무화과 잎, 햇볕에 데워진 돌담")
                .description("어릴 때 여름방학마다 가던 할머니 댁 마당에 큰 무화과나무가 있었어요. 잎을 문지르면 나던 "
                        + "풋풋하고 달큰한 냄새, 햇볕에 데워진 돌담 냄새를 향수로 간직하고 싶어요.")
                .budget(180_000).desiredDate(LocalDate.now().plusDays(10)).build());
        CommissionProposal doneProposal = proposalRepository.save(new CommissionProposal(done, atelier, 170_000, 14,
                "무화과 잎과 우유 같은 무화과 과육을 중심에 두고, 따뜻한 미네랄 노트로 돌담을 표현해 볼게요."));
        done.accept(doneProposal, PaymentMethod.CARD, "MOCK-SEED-C001");
        doneProposal.accept();
        done.start();
        done.deliver("50ml 향수 1병과 시향지 3장을 보내 드렸어요. 첫 향은 잎, 30분 뒤에는 돌담의 온기가 남아요.");
        done.review(5, 5, "정말 그 마당에 서 있는 기분이었어요. 상담할 때 기억을 하나하나 물어봐 주셔서 감동했어요.");
        done.confirm();
        Settlement settlement = settlementRepository.save(new Settlement(done, atelier, Settlement.Reason.CONFIRMED,
                done.getAgreedPrice(), properties.commission().feeRate()));
        settlement.markPaid();

        Commission open = commissionRepository.save(Commission.builder().requester(seowoo)
                .title("비 오는 날의 오래된 서재").incCd("001").moods("비, 오래된 책, 나무 책장")
                .description("비가 오는 날 창문을 조금 열어 둔 서재의 공기를 방에 두고 싶어요. 종이와 나무 냄새, "
                        + "젖은 흙냄새가 은은하게 섞였으면 좋겠어요. 너무 달지 않게요.")
                .budget(90_000).desiredDate(LocalDate.now().plusDays(21)).build());
        proposalRepository.save(new CommissionProposal(open, atelier, 85_000, 10,
                "시더우드와 파피루스로 책장을, 페트리코 어코드로 비 냄새를 표현한 디퓨저를 제안드려요."));

        commissionRepository.save(Commission.builder().requester(walker)
                .title("새벽 등산로의 첫 공기").moods("새벽, 솔잎, 차가운 공기")
                .description("해 뜨기 전 산에 오를 때 처음 들이마시는 차갑고 맑은 공기를 향으로 만들고 싶어요. "
                        + "향 종류는 조향사님 제안에 맡길게요.")
                .budget(60_000).desiredDate(LocalDate.now().plusDays(30)).build());
    }

    /** 테마 큐레이션 예시 (기간은 올해 날짜로 맞추고, 해를 넘기는 기간은 다음 해까지) */
    private void seedThemes() throws IOException {
        List<Product> products = productRepository.findAll();
        int year = LocalDate.now().getYear();
        for (JsonNode t : read("seed/themes.json")) {
            LocalDate start = monthDay(text(t, "start"), year);
            LocalDate end = monthDay(text(t, "end"), year);
            if (start != null && end != null && end.isBefore(start)) {
                end = end.plusYears(1);
            }
            Theme theme = new Theme(new Theme.Spec(t.get("slug").asText(), text(t, "eyebrow"), t.get("title").asText(),
                    text(t, "subtitle"), text(t, "story"), t.get("heroImage").asText(), start, end,
                    t.get("sortOrder").asInt(), true));
            List<Product> items = new ArrayList<>();
            List<String> notes = new ArrayList<>();
            for (JsonNode item : t.get("products")) {
                Product product = findByName(products, item.get(0).asText());
                if (product != null) {
                    items.add(product);
                    notes.add(item.get(1).asText());
                }
            }
            theme.replaceProducts(items, notes);
            themeRepository.save(theme);
        }
    }

    private static LocalDate monthDay(String value, int year) {
        return value == null ? null : LocalDate.parse(year + "-" + value);
    }

    private static Product findByName(List<Product> products, String name) {
        return products.stream().filter(p -> p.getName().equals(name)).findFirst().orElse(null);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static List<String> strings(JsonNode array) {
        List<String> result = new ArrayList<>();
        if (array != null) {
            array.forEach(n -> result.add(n.asText()));
        }
        return result;
    }
}
