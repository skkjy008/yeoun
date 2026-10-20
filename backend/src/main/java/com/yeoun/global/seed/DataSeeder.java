package com.yeoun.global.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeoun.global.config.YeounProperties;
import com.yeoun.member.domain.Grade;
import com.yeoun.member.domain.Member;
import com.yeoun.member.domain.PerfumerApplication;
import com.yeoun.member.domain.Role;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.member.repository.PerfumerApplicationRepository;
import com.yeoun.notification.domain.Notification;
import com.yeoun.notification.repository.NotificationRepository;
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
import java.io.IOException;
import java.io.InputStream;
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
