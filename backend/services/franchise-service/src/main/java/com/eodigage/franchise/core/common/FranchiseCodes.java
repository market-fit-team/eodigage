package com.eodigage.franchise.core.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 공정거래위원회 가맹사업 공개 API는 브랜드에 안정적인 코드를 제공하지 않는다.
 * 두 API(창업비용/매출통계)의 같은 브랜드를 연결하고, 다른 서비스가 snapshot으로
 * 참조할 안정적인 식별자를 만들기 위해 (법인명, 브랜드명) 기반 결정적 코드를 생성한다.
 */
public final class FranchiseCodes {

    private static final String SEPARATOR = "::FR::";

    private FranchiseCodes() {
    }

    /** (법인명, 브랜드명) 기반 브랜드 코드. */
    public static String brandCode(String companyName, String brandName) {
        return "FB" + hash(nullToEmpty(companyName) + SEPARATOR + nullToEmpty(brandName));
    }

    private static String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.substring(0, 30);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is not available.", exception);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
