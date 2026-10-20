package com.yeoun.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScentNote {

    @Column(name = "note_name", nullable = false, length = 40)
    private String name;

    @Column(name = "note_description", length = 200)
    private String description;
}
