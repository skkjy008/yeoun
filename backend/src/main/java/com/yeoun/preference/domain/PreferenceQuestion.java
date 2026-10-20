package com.yeoun.preference.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 나만의 향 찾기 질문 (6단계) */
@Getter
@Entity
@Table(name = "preference_question")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PreferenceQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_no", nullable = false, unique = true)
    private int questionNo;

    /** 진행 바에 표시되는 짧은 이름. 예) 시간과 장소 */
    @Column(name = "step_label", nullable = false, length = 20)
    private String stepLabel;

    /** 예) TIME & PLACE */
    @Column(name = "english_label", nullable = false, length = 40)
    private String englishLabel;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 120)
    private String guide;

    /** GRID(2x2 카드) 또는 LIST(가로로 긴 카드) */
    @Column(nullable = false, length = 10)
    private String layout;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("optionNo asc")
    private List<PreferenceOption> options = new ArrayList<>();

    public PreferenceQuestion(int questionNo, String stepLabel, String englishLabel, String title, String guide,
                              String layout) {
        this.questionNo = questionNo;
        this.stepLabel = stepLabel;
        this.englishLabel = englishLabel;
        this.title = title;
        this.guide = guide;
        this.layout = layout;
    }

    public void addOption(PreferenceOption option) {
        options.add(option);
        option.assignTo(this);
    }
}
