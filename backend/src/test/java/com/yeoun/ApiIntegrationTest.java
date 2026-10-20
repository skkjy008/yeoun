package com.yeoun;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class ApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("accessToken").asText();
    }

    @Test
    void 카테고리별_상품목록과_상세를_조회한다() throws Exception {
        mvc.perform(get("/api/products").param("category", "diffuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(9))
                .andExpect(jsonPath("$.content[0].name").value("숲의 잔향"));

        mvc.perform(get("/api/products/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        mvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes.length()").value(3))
                .andExpect(jsonPath("$.tracks.length()").value(3));
    }

    @Test
    void 재고가_0이면_품절로_표시된다() throws Exception {
        String body = mvc.perform(get("/api/products").param("category", "candle").param("size", "20"))
                .andReturn().getResponse().getContentAsString();
        JsonNode content = objectMapper.readTree(body).get("content");
        boolean anySoldOut = false;
        for (JsonNode node : content) {
            anySoldOut |= node.get("soldOut").asBoolean();
        }
        assertThat(anySoldOut).isTrue();
    }

    @Test
    void 조향사로_가입하면_운영자에게_인증요청_알림이_간다() throws Exception {
        mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(json(Map.of(
                        "email", "perfumer-test@yeoun.example",
                        "password", "scent1234!",
                        "name", "테스트조향사",
                        "phone", "010-1111-2222",
                        "termsAgreed", true,
                        "privacyAgreed", true,
                        "marketingAgreed", false,
                        "perfumer", true,
                        "perfumerApplication", Map.of("careerYears", 3, "introduction", "향을 만듭니다.")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.member.perfumerStatus").value("PENDING"))
                .andExpect(jsonPath("$.member.role").value("USER"));

        String adminToken = login("admin@yeoun.example", "admin1234!");
        mvc.perform(get("/api/notifications").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("PERFUMER_APPLICATION"));
    }

    @Test
    void 비회원은_취향_저장과_관리자_API에_접근할_수_없다() throws Exception {
        mvc.perform(post("/api/preferences").contentType(MediaType.APPLICATION_JSON).content("{\"answers\":[]}"))
                .andExpect(status().isUnauthorized());

        String userToken = login("yeon@yeoun.example", "yeoun1234!");
        mvc.perform(get("/api/admin/members").header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void 취향을_저장하면_추천_상품을_돌려준다() throws Exception {
        String token = login("seowoo@yeoun.example", "yeoun1234!");
        List<Map<String, Integer>> answers = List.of(
                Map.of("questionNo", 1, "optionNo", 4),
                Map.of("questionNo", 2, "optionNo", 2),
                Map.of("questionNo", 3, "optionNo", 1),
                Map.of("questionNo", 4, "optionNo", 1),
                Map.of("questionNo", 5, "optionNo", 2),
                Map.of("questionNo", 6, "optionNo", 3));

        mvc.perform(post("/api/preferences").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("answers", answers))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products.length()").value(4))
                .andExpect(jsonPath("$.keywords[0]").value("우디"))
                .andExpect(jsonPath("$.aiGenerated").value(false));

        mvc.perform(get("/api/preferences/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers.length()").value(6));
    }
}
