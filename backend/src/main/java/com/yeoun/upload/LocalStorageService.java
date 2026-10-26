package com.yeoun.upload;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** S3 설정이 없을 때: 서버 디스크(yeoun.storage.local-dir)에 저장하고 /uploads/** 로 제공합니다. */
public class LocalStorageService implements StorageService {

    private final Path root;
    private final String publicPath;

    public LocalStorageService(String localDir, String publicPath) {
        this.root = Path.of(localDir).toAbsolutePath().normalize();
        this.publicPath = publicPath.endsWith("/") ? publicPath.substring(0, publicPath.length() - 1) : publicPath;
    }

    public Path root() {
        return root;
    }

    @Override
    public String store(String key, byte[] bytes, String contentType) {
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("잘못된 파일 경로입니다.");
        }
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return publicPath + "/" + key;
    }

    @Override
    public String name() {
        return "local";
    }
}
