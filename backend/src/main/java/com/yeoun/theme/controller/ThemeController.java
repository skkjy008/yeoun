package com.yeoun.theme.controller;

import com.yeoun.theme.dto.ThemeDtos.ThemeDetail;
import com.yeoun.theme.dto.ThemeDtos.ThemeRequest;
import com.yeoun.theme.dto.ThemeDtos.ThemeSummary;
import com.yeoun.theme.service.ThemeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ThemeController {

    private final ThemeService themeService;

    @GetMapping("/api/themes")
    public List<ThemeSummary> list() {
        return themeService.published();
    }

    @GetMapping("/api/themes/{slug}")
    public ThemeDetail detail(@PathVariable String slug) {
        return themeService.detail(slug, false);
    }

    @GetMapping("/api/admin/themes")
    public List<ThemeSummary> all() {
        return themeService.all();
    }

    @GetMapping("/api/admin/themes/{slug}")
    public ThemeDetail adminDetail(@PathVariable String slug) {
        return themeService.detail(slug, true);
    }

    @PostMapping("/api/admin/themes")
    @ResponseStatus(HttpStatus.CREATED)
    public ThemeDetail create(@Valid @RequestBody ThemeRequest request) {
        return themeService.create(request);
    }

    @PutMapping("/api/admin/themes/{id}")
    public ThemeDetail update(@PathVariable Long id, @Valid @RequestBody ThemeRequest request) {
        return themeService.update(id, request);
    }

    @DeleteMapping("/api/admin/themes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        themeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
