package com.yeoun.upload;

import com.yeoun.global.config.YeounProperties;
import com.yeoun.global.exception.ApiException;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UploadService {

    /** 허용하는 이미지 형식과 파일 시그니처(매직 넘버) — 확장자만 바꾼 파일을 막습니다. */
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    private final StorageService storageService;
    private final YeounProperties properties;

    public record UploadResult(String url, String key, long size, String contentType) {
    }

    public UploadResult upload(UploadPurpose purpose, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("업로드할 이미지를 선택해 주세요.");
        }
        if (file.getSize() > properties.storage().maxFileSize()) {
            throw ApiException.badRequest("이미지는 %dMB 이하로 올려 주세요."
                    .formatted(properties.storage().maxFileSize() / 1024 / 1024));
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("파일을 읽지 못했어요.");
        }
        String contentType = detect(bytes);
        if (contentType == null) {
            throw ApiException.badRequest("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
        }
        String key = "%s/%s/%s.%s".formatted(purpose.folder(), LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE),
                UUID.randomUUID(), EXTENSIONS.get(contentType));
        String url = storageService.store(key, bytes, contentType);
        return new UploadResult(url, key, bytes.length, contentType);
    }

    static String detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "image/png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
