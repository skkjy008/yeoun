package com.yeoun.upload;

import com.yeoun.global.config.YeounProperties;
import java.net.URI;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * AWS S3 업로드. endpoint를 지정하면 MinIO 같은 S3 호환 저장소에도 그대로 동작합니다.
 * 운영(EC2)에서는 access-key를 비워 두고 인스턴스 IAM 역할의 자격 증명을 사용하는 것을 권장합니다.
 */
public class S3StorageService implements StorageService {

    private final S3Client client;
    private final String bucket;
    private final String publicBaseUrl;

    public S3StorageService(YeounProperties.Storage.S3 config) {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(config.region()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(config.pathStyle()).build());
        if (config.endpoint() != null && !config.endpoint().isBlank()) {
            // MinIO 등 S3 호환 저장소: 필요한 경우에만 체크섬을 계산해 호환성을 높입니다.
            builder.endpointOverride(URI.create(config.endpoint()))
                    .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                    .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED);
        }
        if (config.accessKey() != null && !config.accessKey().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(config.accessKey(), config.secretKey())));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        this.client = builder.build();
        this.bucket = config.bucket();
        String base = config.publicBaseUrl();
        if (base == null || base.isBlank()) {
            base = "https://%s.s3.%s.amazonaws.com".formatted(config.bucket(), config.region());
        }
        this.publicBaseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    @Override
    public String store(String key, byte[] bytes, String contentType) {
        client.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .cacheControl("public, max-age=31536000, immutable")
                        .build(),
                RequestBody.fromBytes(bytes));
        return publicBaseUrl + "/" + key;
    }

    @Override
    public String name() {
        return "s3";
    }
}
