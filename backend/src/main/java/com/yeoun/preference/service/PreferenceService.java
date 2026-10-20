package com.yeoun.preference.service;

import com.yeoun.global.exception.ApiException;
import com.yeoun.member.domain.Member;
import com.yeoun.member.repository.MemberRepository;
import com.yeoun.preference.domain.MemberPreference;
import com.yeoun.preference.domain.PreferenceOption;
import com.yeoun.preference.domain.PreferenceQuestion;
import com.yeoun.preference.dto.PreferenceDtos.Answer;
import com.yeoun.preference.dto.PreferenceDtos.AnswerResponse;
import com.yeoun.preference.dto.PreferenceDtos.QuestionResponse;
import com.yeoun.preference.dto.PreferenceDtos.RecommendationResponse;
import com.yeoun.preference.dto.PreferenceDtos.SubmitRequest;
import com.yeoun.preference.repository.MemberPreferenceRepository;
import com.yeoun.preference.repository.PreferenceQuestionRepository;
import com.yeoun.product.domain.Product;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import com.yeoun.product.repository.ProductRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PreferenceService {

    private static final int RESULT_SIZE = 4;

    private final PreferenceQuestionRepository questionRepository;
    private final MemberPreferenceRepository memberPreferenceRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;
    private final AiCurationClient aiCurationClient;

    public List<QuestionResponse> questions() {
        return questionRepository.findAllByOrderByQuestionNoAsc().stream().map(QuestionResponse::from).toList();
    }

    /** 선택지 별 데이터를 저장(기존 답변은 덮어쓰기)하고 추천 결과를 돌려줍니다. */
    @Transactional
    public RecommendationResponse submit(Long memberId, SubmitRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> ApiException.unauthorized("회원 정보를 찾을 수 없습니다."));
        Map<Integer, PreferenceQuestion> questions = questionRepository.findAllByOrderByQuestionNoAsc().stream()
                .collect(Collectors.toMap(PreferenceQuestion::getQuestionNo, Function.identity()));
        Map<Long, MemberPreference> existing = memberPreferenceRepository.findAllByMemberId(memberId).stream()
                .collect(Collectors.toMap(p -> p.getQuestion().getId(), Function.identity()));

        for (Answer answer : request.answers()) {
            PreferenceQuestion question = Optional.ofNullable(questions.get(answer.questionNo()))
                    .orElseThrow(() -> ApiException.badRequest("존재하지 않는 질문입니다: " + answer.questionNo()));
            PreferenceOption option = question.getOptions().stream()
                    .filter(o -> o.getOptionNo() == answer.optionNo())
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("존재하지 않는 선택지입니다."));
            MemberPreference saved = existing.get(question.getId());
            if (saved == null) {
                memberPreferenceRepository.save(new MemberPreference(member, question, option));
            } else {
                saved.change(option);
            }
        }
        memberPreferenceRepository.flush();
        return buildRecommendation(memberPreferenceRepository.findAllByMemberId(memberId), true)
                .orElseThrow(() -> ApiException.badRequest("추천을 만들 수 있는 답변이 없습니다."));
    }

    /** 내 취향 결과. 아직 참여하지 않았다면 빈 값. */
    public Optional<RecommendationResponse> myRecommendation(Long memberId, boolean withAi) {
        return buildRecommendation(memberPreferenceRepository.findAllByMemberId(memberId), withAi);
    }

    private Optional<RecommendationResponse> buildRecommendation(List<MemberPreference> preferences, boolean withAi) {
        if (preferences.isEmpty()) {
            return Optional.empty();
        }
        List<MemberPreference> sorted = preferences.stream()
                .sorted(Comparator.comparingInt(p -> p.getQuestion().getQuestionNo()))
                .toList();
        ScentProfile profile = ScentProfile.of(sorted.stream().map(MemberPreference::getOption).toList());

        List<Product> ranked = productRepository.findAllByActiveTrue().stream()
                .sorted(Comparator.comparingInt(profile::score).reversed()
                        .thenComparing(Comparator.comparingInt(Product::getPopularity).reversed())
                        .thenComparing(Product::getId))
                .limit(RESULT_SIZE)
                .toList();

        List<String> keywords = profile.topKeywords(3);
        List<AnswerResponse> answers = sorted.stream()
                .map(p -> new AnswerResponse(p.getQuestion().getQuestionNo(), p.getQuestion().getStepLabel(),
                        p.getOption().getOptionNo(), p.getOption().getLabel()))
                .toList();

        String headline = keywords.isEmpty()
                ? "당신에게 어울리는 여운"
                : "%s의 결을 닮은, %s 여운".formatted(String.join(" · ", keywords), profile.intensityLabel());

        Optional<String> aiSummary = withAi
                ? aiCurationClient.curate(
                        answers.stream().map(a -> a.stepLabel() + ": " + a.label()).toList(),
                        keywords,
                        ranked.stream().map(p -> "%s (%s) - %s".formatted(p.getName(), p.getTypeLabel(), p.getSubtitle()))
                                .toList())
                : Optional.empty();

        String summary = aiSummary.orElseGet(() -> ruleBasedSummary(answers, keywords, profile, ranked));
        return Optional.of(new RecommendationResponse(headline, summary, keywords, aiSummary.isPresent(), answers,
                ranked.stream().map(ProductSummary::from).toList()));
    }

    private static String ruleBasedSummary(List<AnswerResponse> answers, List<String> keywords, ScentProfile profile,
                                           List<Product> ranked) {
        String scene = answers.isEmpty() ? "당신이 고른 장면" : "'" + answers.get(0).label() + "'";
        String first = ranked.isEmpty() ? "여운의 향" : "「" + ranked.get(0).getName() + "」";
        String keywordText = keywords.isEmpty() ? "편안한" : String.join(", ", keywords);
        return "%s처럼, 당신은 %s 결이 느껴지는 향에 오래 머무는 사람이에요. %s 잔향을 좋아하는 당신에게 %s부터 천천히 만나보길 권해요."
                .formatted(scene, keywordText, profile.intensityLabel(), first);
    }
}
