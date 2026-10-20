package com.yeoun.preference.dto;

import com.yeoun.preference.domain.PreferenceOption;
import com.yeoun.preference.domain.PreferenceQuestion;
import com.yeoun.product.dto.ProductDtos.ProductSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public final class PreferenceDtos {

    private PreferenceDtos() {
    }

    public record OptionResponse(int optionNo, String label, String imageUrl) {
        public static OptionResponse from(PreferenceOption o) {
            return new OptionResponse(o.getOptionNo(), o.getLabel(), o.getImageUrl());
        }
    }

    public record QuestionResponse(int questionNo, String stepLabel, String englishLabel, String title, String guide,
                                   String layout, List<OptionResponse> options) {
        public static QuestionResponse from(PreferenceQuestion q) {
            return new QuestionResponse(q.getQuestionNo(), q.getStepLabel(), q.getEnglishLabel(), q.getTitle(),
                    q.getGuide(), q.getLayout(), q.getOptions().stream().map(OptionResponse::from).toList());
        }
    }

    public record Answer(@Min(1) int questionNo, @Min(1) int optionNo) {
    }

    public record SubmitRequest(@NotEmpty(message = "답변을 선택해 주세요.") List<@Valid Answer> answers) {
    }

    public record AnswerResponse(int questionNo, String stepLabel, int optionNo, String label) {
    }

    public record RecommendationResponse(String headline, String summary, List<String> keywords,
                                         boolean aiGenerated, List<AnswerResponse> answers,
                                         List<ProductSummary> products) {
    }
}
