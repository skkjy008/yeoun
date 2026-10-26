package com.yeoun.upload;

import com.yeoun.global.config.YeounProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Slf4j
@Configuration
public class StorageConfig implements WebMvcConfigurer {

    private final YeounProperties properties;
    private final StorageService storageService;

    public StorageConfig(YeounProperties properties) {
        this.properties = properties;
        YeounProperties.Storage storage = properties.storage();
        if (storage.s3().enabled()) {
            log.info("[storage] S3 버킷 '{}'에 업로드합니다. endpoint={}", storage.s3().bucket(), storage.s3().endpoint());
            this.storageService = new S3StorageService(storage.s3());
        } else {
            log.info("[storage] S3 설정이 없어 로컬 디스크({})에 저장합니다.", storage.localDir());
            this.storageService = new LocalStorageService(storage.localDir(), storage.localPublicPath());
        }
    }

    @Bean
    public StorageService storageService() {
        return storageService;
    }

    /** 로컬 저장소일 때만 /uploads/** 정적 제공 */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (storageService instanceof LocalStorageService local) {
            registry.addResourceHandler(properties.storage().localPublicPath() + "/**")
                    .addResourceLocations(local.root().toUri().toString());
        }
    }
}
