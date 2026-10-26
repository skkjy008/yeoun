package com.yeoun.upload;

import com.yeoun.member.domain.Role;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 업로드 용도별 저장 폴더와 업로드할 수 있는 권한 */
@Getter
@RequiredArgsConstructor
public enum UploadPurpose {
    PRODUCT("products", true),
    THEME("themes", true),
    COMMISSION("commissions", false);

    private final String folder;
    private final boolean adminOnly;

    public String folder() {
        return folder;
    }

    public boolean allows(Role role) {
        return !adminOnly || role == Role.ADMIN;
    }
}
