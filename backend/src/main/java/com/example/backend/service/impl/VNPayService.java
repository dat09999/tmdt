package com.example.backend.service.impl;

import com.example.backend.config.VNPayConfig;
import com.example.backend.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    /**
     * VNPay sử dụng GMT+7.
     */
    private static final ZoneId VN_TIME_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Định dạng bắt buộc của:
     * - vnp_CreateDate
     * - vnp_ExpireDate
     *
     * Ví dụ:
     * 20260723021530
     */
    private static final DateTimeFormatter VN_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * Thời gian cho phép thanh toán.
     */
    private static final int PAYMENT_EXPIRE_MINUTES = 15;


    /**
     * Tạo URL thanh toán VNPay.
     *
     * @param orderCode mã đơn hàng, ví dụ:
     *                  ORD178431127249530A1D4
     *
     * @param amountVnd số tiền thực tế tính bằng VND.
     *                  Ví dụ: 33.020.000
     *
     * @param orderInfo nội dung thanh toán.
     *
     * @param request HttpServletRequest dùng lấy IP.
     *
     * @return URL redirect sang VNPay.
     */
    public String createPaymentUrl(
            String orderCode,
            long amountVnd,
            String orderInfo,
            HttpServletRequest request
    ) {

        // =========================================================
        // 1. VALIDATE
        // =========================================================

        validateOrderCode(orderCode);
        validateAmount(amountVnd);

        // =========================================================
        // 2. VNPay yêu cầu Amount * 100
        // =========================================================

        long vnpAmount;

        try {
            vnpAmount = Math.multiplyExact(amountVnd, 100L);
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán quá lớn"
            );
        }

        /*
         * VNPay:
         * vnp_Amount = Numeric[1,12]
         */
        if (String.valueOf(vnpAmount).length() > 12) {
            throw new IllegalArgumentException(
                    "Số tiền vượt giới hạn VNPay"
            );
        }

        // =========================================================
        // 3. ORDER INFO
        // =========================================================

        /*
         * VNPay khuyến nghị nội dung không dấu.
         *
         * Nếu bên ngoài không truyền orderInfo
         * thì tự tạo.
         */
        String safeOrderInfo;

        if (orderInfo == null || orderInfo.isBlank()) {
            safeOrderInfo =
                    "Thanh toan don hang " + orderCode;
        } else {
            safeOrderInfo =
                    sanitizeOrderInfo(orderInfo);
        }

        /*
         * Giới hạn VNPay: 255 ký tự.
         */
        if (safeOrderInfo.length() > 255) {
            safeOrderInfo =
                    safeOrderInfo.substring(0, 255);
        }

        // =========================================================
        // 4. CLIENT IP
        // =========================================================

        String ipAddress =
                VNPayUtil.getIpAddress(request);

        /*
         * Trường hợp test local.
         */
        if (ipAddress == null
                || ipAddress.isBlank()
                || "unknown".equalsIgnoreCase(ipAddress)
                || "::1".equals(ipAddress)
                || "0:0:0:0:0:0:0:1".equals(ipAddress)) {

            ipAddress = "127.0.0.1";
        }

        /*
         * X-Forwarded-For đôi khi:
         *
         * 113.161.xxx.xxx, 172.16.xxx.xxx
         *
         * VNPay chỉ cần IP client đầu tiên.
         */
        if (ipAddress.contains(",")) {
            ipAddress =
                    ipAddress.split(",")[0].trim();
        }

        /*
         * VNPay yêu cầu IP tối đa 45 ký tự.
         */
        if (ipAddress.length() > 45) {
            throw new IllegalArgumentException(
                    "Địa chỉ IP không hợp lệ: " + ipAddress
            );
        }

        // =========================================================
        // 5. CREATE DATE + EXPIRE DATE
        // =========================================================

        ZonedDateTime now =
                ZonedDateTime.now(VN_TIME_ZONE);

        String createDate =
                now.format(VN_DATE_FORMAT);

        String expireDate =
                now.plusMinutes(PAYMENT_EXPIRE_MINUTES)
                        .format(VN_DATE_FORMAT);

        // =========================================================
        // 6. BUILD VNPay PARAMS
        // =========================================================

        Map<String, String> params =
                new HashMap<>();

        params.put(
                "vnp_Version",
                vnPayConfig.getVersion()
        );

        params.put(
                "vnp_Command",
                vnPayConfig.getCommand()
        );

        params.put(
                "vnp_TmnCode",
                vnPayConfig.getTmnCode()
        );

        params.put(
                "vnp_Amount",
                String.valueOf(vnpAmount)
        );

        params.put(
                "vnp_CurrCode",
                "VND"
        );

        params.put(
                "vnp_TxnRef",
                orderCode
        );

        params.put(
                "vnp_OrderInfo",
                safeOrderInfo
        );

        params.put(
                "vnp_OrderType",
                vnPayConfig.getOrderType()
        );

        params.put(
                "vnp_Locale",
                "vn"
        );

        params.put(
                "vnp_ReturnUrl",
                vnPayConfig.getReturnUrl()
        );

        params.put(
                "vnp_IpAddr",
                ipAddress
        );

        params.put(
                "vnp_CreateDate",
                createDate
        );

        params.put(
                "vnp_ExpireDate",
                expireDate
        );

        // =========================================================
        // 7. DEBUG
        // =========================================================

        /*
         * Có thể xóa khi production ổn định.
         *
         * TUYỆT ĐỐI KHÔNG log HashSecret.
         */
        System.out.println();
        System.out.println(
                "================ VNPAY REQUEST ================"
        );

        params.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry ->
                        System.out.println(
                                entry.getKey()
                                        + " = "
                                        + entry.getValue()
                        )
                );

        System.out.println(
                "================================================"
        );

        // =========================================================
        // 8. CREATE HASH
        // =========================================================

        String hashData =
                VNPayUtil.buildHashData(params);

        String secureHash =
                VNPayUtil.hmacSHA512(
                        vnPayConfig.getHashSecret(),
                        hashData
                );

        // =========================================================
        // 9. BUILD FINAL URL
        // =========================================================

        String query =
                VNPayUtil.buildQueryUrl(
                        params,
                        secureHash
                );
        System.out.println("VNPAY HASH DATA: " + hashData);
        System.out.println("VNPAY QUERY: " + query);

        return vnPayConfig.getPayUrl()
                + "?"
                + query;
    }


    // =============================================================
    // VERIFY CALLBACK / RETURN URL / IPN
    // =============================================================

    /**
     * Kiểm tra chữ ký VNPay trả về.
     */
    public boolean verifySignature(
            Map<String, String> allParams
    ) {

        if (allParams == null
                || allParams.isEmpty()) {
            return false;
        }

        String receivedHash =
                allParams.get("vnp_SecureHash");

        if (receivedHash == null
                || receivedHash.isBlank()) {
            return false;
        }

        /*
         * Copy tránh thay đổi Map gốc.
         */
        Map<String, String> filtered =
                new HashMap<>(allParams);

        /*
         * Hai trường này không được tham gia
         * quá trình tính checksum.
         */
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        String hashData =
                VNPayUtil.buildHashData(filtered);

        String calculatedHash =
                VNPayUtil.hmacSHA512(
                        vnPayConfig.getHashSecret(),
                        hashData
                );

        return calculatedHash
                .equalsIgnoreCase(receivedHash);
    }


    // =============================================================
    // VALIDATE ORDER CODE
    // =============================================================

    private void validateOrderCode(
            String orderCode
    ) {

        if (orderCode == null
                || orderCode.isBlank()) {

            throw new IllegalArgumentException(
                    "orderCode không được để trống"
            );
        }

        /*
         * VNPay:
         * vnp_TxnRef = Alphanumeric[1,100]
         */
        if (!orderCode.matches(
                "^[A-Za-z0-9]{1,100}$"
        )) {

            throw new IllegalArgumentException(
                    "orderCode chỉ được chứa chữ và số: "
                            + orderCode
            );
        }
    }


    // =============================================================
    // VALIDATE AMOUNT
    // =============================================================

    private void validateAmount(
            long amountVnd
    ) {

        if (amountVnd <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán phải lớn hơn 0"
            );
        }
    }


    // =============================================================
    // SANITIZE ORDER INFO
    // =============================================================

    /**
     * Chuyển:
     *
     * "Thanh toán đơn hàng #ORD123"
     *
     * thành:
     *
     * "Thanh toan don hang ORD123"
     */
    private String sanitizeOrderInfo(
            String input
    ) {

        /*
         * 1. Tách dấu Unicode.
         */
        String normalized =
                Normalizer.normalize(
                        input,
                        Normalizer.Form.NFD
                );

        /*
         * 2. Xóa dấu.
         */
        String noAccent =
                normalized.replaceAll(
                        "\\p{M}",
                        ""
                );

        /*
         * Chữ đ không được xử lý bởi NFD.
         */
        noAccent =
                noAccent
                        .replace("đ", "d")
                        .replace("Đ", "D");

        /*
         * 3. Chỉ giữ:
         * chữ
         * số
         * khoảng trắng
         */
        String clean =
                noAccent.replaceAll(
                        "[^A-Za-z0-9 ]",
                        " "
                );

        /*
         * 4. Xóa khoảng trắng dư.
         */
        clean =
                clean.replaceAll(
                        "\\s+",
                        " "
                ).trim();

        /*
         * Không cho OrderInfo rỗng.
         */
        if (clean.isBlank()) {
            return "Thanh toan don hang";
        }

        return clean;
    }
    public String createTestPaymentUrl(HttpServletRequest request) {

        Map<String, String> params = new HashMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");

        params.put(
                "vnp_TmnCode",
                vnPayConfig.getTmnCode().trim()
        );

        // 10.000 VND * 100
        params.put(
                "vnp_Amount",
                "1000000"
        );

        params.put(
                "vnp_CurrCode",
                "VND"
        );

        // Chỉ dùng số để loại toàn bộ khả năng format TxnRef
        String txnRef =
                String.valueOf(System.currentTimeMillis())
                        .substring(5);

        params.put(
                "vnp_TxnRef",
                txnRef
        );

        params.put(
                "vnp_OrderInfo",
                "Thanh toan don hang " + txnRef
        );

        params.put(
                "vnp_OrderType",
                "other"
        );

        params.put(
                "vnp_Locale",
                "vn"
        );

        params.put(
                "vnp_ReturnUrl",
                vnPayConfig.getReturnUrl().trim()
        );

        // Test giống mẫu VNPAY
        params.put(
                "vnp_IpAddr",
                "127.0.0.1"
        );

        ZoneId zone =
                ZoneId.of("Asia/Ho_Chi_Minh");

        ZonedDateTime now =
                ZonedDateTime.now(zone);

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern(
                        "yyyyMMddHHmmss"
                );

        params.put(
                "vnp_CreateDate",
                now.format(formatter)
        );

        params.put(
                "vnp_ExpireDate",
                now.plusMinutes(15)
                        .format(formatter)
        );

        String hashData =
                VNPayUtil.buildHashData(params);

        String secureHash =
                VNPayUtil.hmacSHA512(
                        vnPayConfig.getHashSecret().trim(),
                        hashData
                );

        System.out.println("HASH DATA:");
        System.out.println(hashData);

        String query =
                VNPayUtil.buildQueryUrl(
                        params,
                        secureHash
                );

        String paymentUrl =
                vnPayConfig.getPayUrl().trim()
                        + "?"
                        + query;

        System.out.println("PAYMENT URL:");
        System.out.println(paymentUrl);

        return paymentUrl;
    }
}