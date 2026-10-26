package com.yeoun.upload;

/** 업로드 파일 저장소. S3(또는 S3 호환 저장소)와 로컬 디스크 구현이 있습니다. */
public interface StorageService {

    /** 저장 후 브라우저에서 바로 쓸 수 있는 URL을 돌려줍니다. */
    String store(String key, byte[] bytes, String contentType);

    String name();
}
