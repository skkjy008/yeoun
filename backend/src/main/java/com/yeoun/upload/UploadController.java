package com.yeoun.upload;

import com.yeoun.global.exception.ApiException;
import com.yeoun.global.security.AuthMember;
import com.yeoun.upload.UploadService.UploadResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    /** 이미지 업로드: 상품·테마 이미지는 운영자만, 커미션 참고 이미지는 회원 누구나 */
    @PostMapping(value = "/api/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResult upload(@AuthenticationPrincipal AuthMember me,
                               @RequestParam(defaultValue = "COMMISSION") UploadPurpose purpose,
                               @RequestPart("file") MultipartFile file) {
        if (!purpose.allows(me.role())) {
            throw ApiException.forbidden("이 이미지는 운영자만 올릴 수 있어요.");
        }
        return uploadService.upload(purpose, file);
    }
}
