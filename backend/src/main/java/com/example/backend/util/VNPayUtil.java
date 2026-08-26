package com.example.backend.util;

import jakarta.servlet.http.HttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public final class VNPayUtil {

    private VNPayUtil() {
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    // =========================================================
    // HMAC SHA512
    // =========================================================

    public static String hmacSHA512(String key, String data) {

        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException(
                    "VNPay HashSecret không được để trống"
            );
        }

        if (data == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu tạo chữ ký VNPay không được null"
            );
        }

        try {

            Mac hmac512 = Mac.getInstance("HmacSHA512");

            SecretKeySpec secretKey =
                    new SecretKeySpec(
                            key.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA512"
                    );

            hmac512.init(secretKey);

            byte[] bytes =
                    hmac512.doFinal(
                            data.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder result =
                    new StringBuilder(bytes.length * 2);

            for (byte b : bytes) {
                result.append(
                        String.format("%02x", b & 0xff)
                );
            }

            return result.toString();

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Không thể tạo chữ ký HMAC-SHA512 cho VNPay",
                    e
            );
        }
    }


    // =========================================================
    // HASH DATA
    // =========================================================

    /**
     * Tạo chuỗi dùng để ký VNPay.
     *
     * Quy tắc VNPay 2.1.0:
     *
     * 1. Sort tên parameter tăng dần.
     * 2. Bỏ parameter null/rỗng.
     * 3. Không chứa vnp_SecureHash.
     * 4. Không chứa vnp_SecureHashType.
     * 5. URL encode VALUE.
     *
     * Ví dụ:
     *
     * vnp_Amount=3302000000
     * &vnp_Command=pay
     * &...
     */
    public static String buildHashData(
            Map<String, String> params
    ) {

        if (params == null || params.isEmpty()) {
            throw new IllegalArgumentException(
                    "VNPay params không được rỗng"
            );
        }

        List<String> fieldNames =
                new ArrayList<>(params.keySet());

        Collections.sort(fieldNames);

        StringBuilder hashData =
                new StringBuilder();

        boolean first = true;

        for (String fieldName : fieldNames) {

            /*
             * SecureHash tuyệt đối không được
             * tham gia quá trình tính checksum.
             */
            if ("vnp_SecureHash".equals(fieldName)
                    || "vnp_SecureHashType".equals(fieldName)) {
                continue;
            }

            String fieldValue =
                    params.get(fieldName);

            if (fieldValue == null
                    || fieldValue.isBlank()) {
                continue;
            }

            if (!first) {
                hashData.append('&');
            }

            /*
             * Theo code mẫu Java của VNPay:
             *
             * fieldName KHÔNG encode ở hashData.
             * fieldValue được encode.
             */
            hashData.append(fieldName);

            hashData.append('=');

            hashData.append(
                    urlEncode(fieldValue)
            );

            first = false;
        }

        return hashData.toString();
    }


    // =========================================================
    // BUILD QUERY URL
    // =========================================================

    public static String buildQueryUrl(
            Map<String, String> params,
            String secureHash
    ) {

        if (params == null || params.isEmpty()) {
            throw new IllegalArgumentException(
                    "VNPay params không được rỗng"
            );
        }

        if (secureHash == null
                || secureHash.isBlank()) {
            throw new IllegalArgumentException(
                    "VNPay secureHash không được rỗng"
            );
        }

        List<String> fieldNames =
                new ArrayList<>(params.keySet());

        Collections.sort(fieldNames);

        StringBuilder query =
                new StringBuilder();

        boolean first = true;

        for (String fieldName : fieldNames) {

            if ("vnp_SecureHash".equals(fieldName)
                    || "vnp_SecureHashType".equals(fieldName)) {
                continue;
            }

            String fieldValue =
                    params.get(fieldName);

            if (fieldValue == null
                    || fieldValue.isBlank()) {
                continue;
            }

            if (!first) {
                query.append('&');
            }

            /*
             * Query URL:
             * encode cả key và value.
             */
            query.append(
                    urlEncode(fieldName)
            );

            query.append('=');

            query.append(
                    urlEncode(fieldValue)
            );

            first = false;
        }

        query.append("&vnp_SecureHash=");
        query.append(secureHash);

        return query.toString();
    }


    // =========================================================
    // URL ENCODE
    // =========================================================

    private static String urlEncode(
            String value
    ) {

        return URLEncoder.encode(
                value,
                StandardCharsets.US_ASCII
        );
    }


    // =========================================================
    // RANDOM NUMBER
    // =========================================================

    public static String getRandomNumber(
            int length
    ) {

        if (length <= 0) {
            throw new IllegalArgumentException(
                    "Độ dài random phải > 0"
            );
        }

        StringBuilder sb =
                new StringBuilder(length);

        for (int i = 0; i < length; i++) {

            sb.append(
                    RANDOM.nextInt(10)
            );
        }

        return sb.toString();
    }


    // =========================================================
    // GET CLIENT IP
    // =========================================================

    public static String getIpAddress(
            HttpServletRequest request
    ) {

        if (request == null) {
            return "127.0.0.1";
        }

        String ip =
                request.getHeader(
                        "X-Forwarded-For"
                );

        /*
         * Khi qua proxy:
         *
         * X-Forwarded-For:
         *
         * 113.161.20.10, 172.17.0.1
         *
         * => lấy IP đầu tiên.
         */
        if (ip != null
                && !ip.isBlank()
                && !"unknown".equalsIgnoreCase(ip)) {

            ip = ip.split(",")[0].trim();

        } else {

            ip = request.getHeader(
                    "X-Real-IP"
            );

            if (ip == null
                    || ip.isBlank()
                    || "unknown".equalsIgnoreCase(ip)) {

                ip = request.getRemoteAddr();
            }
        }

        /*
         * Test localhost.
         */
        if (ip == null
                || ip.isBlank()
                || "::1".equals(ip)
                || "0:0:0:0:0:0:0:1".equals(ip)) {

            ip = "127.0.0.1";
        }

        return ip;
    }
}