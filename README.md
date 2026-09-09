# 🛒 DoMix E-Commerce Platform (Full-Stack Spring Boot & React)

<p align="center">
  <img src="https://images.unsplash.com/photo-1557821552-17105176677c?w=1000&auto=format&fit=crop&q=80" alt="DoMix E-Commerce Banner" width="100%" style="border-radius: 12px; max-height: 320px; object-fit: cover;" />
</p>

<p align="center">
  <b>Hệ thống sàn thương mại điện tử đa nhà bán hàng (Multi-vendor E-Commerce Platform)</b><br>
  Kiến trúc phân tầng chuẩn doanh nghiệp: <b>Spring Boot 3 + MongoDB + MinIO + VNPay + React 19 + Tailwind CSS</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Java-17-orange?logo=openjdk" alt="Java 17" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/MinIO-Storage-red?logo=minio" alt="MinIO" />
  <img src="https://img.shields.io/badge/VNPay-Gateway-blue" alt="VNPay" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-purple?logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/WebSocket-STOMP-blueviolet" alt="WebSocket" />
</p>

---

## 📌 Mục Lục
- [1. Giới Thiệu Dự Án](#1-giới-thiệu-dự-án)
- [2. Công Nghệ Sử Dụng (Tech Stack)](#2-công-nghệ-sử-dụng-tech-stack)
- [3. Tính Năng Nổi Bật](#3-tính-năng-nổi-bật)
  - [3.1. Phân Hệ Khách Hàng (Customer Marketplace)](#31-phân-hệ-khách-hàng-customer-marketplace)
  - [3.2. Phân Hệ Người Bán (Seller Portal - `/seller`)](#32-phân-hệ-người-bán-seller-portal---seller)
  - [3.3. Phân Hệ Quản Trị Viên (Admin Portal - `/admin`)](#33-phân-hệ-quản-trị-viên-admin-portal---admin)
- [4. Kiến Trúc Bảo Mật & Concurrency](#4-kiến-trúc-bảo-mật--concurrency)
- [5. Cấu Trúc Thư Mục Dự Án](#5-cấu-trúc-thư-mục-dự-án)
- [6. Hướng Dẫn Cài Đặt & Chạy Local](#6-hướng-dẫn-cài-đặt--chạy-local)
  - [6.1. Yêu Cầu Môi Trường](#61-yêu-cầu-môi-trường)
  - [6.2. Cấu Hình Backend](#62-cấu-hình-backend)
  - [6.3. Khởi Chạy Frontend](#63-khởi-chạy-frontend)
- [7. Tài Liệu API (OpenAPI / Swagger)](#7-tài-liệu-api-openapi--swagger)
- [8. Triển Khai (Deployment)](#8-triển-khai-deployment)

---

## 1. Giới Thiệu Dự Án

**DoMix** là một nền tảng sàn thương mại điện tử đa người bán hiện đại (mô hình tương tự Shopee, Tiki, Lazada), cung cấp trải nghiệm mua sắm liền mạch, tích hợp thanh toán trực tuyến qua cổng VNPay Sandbox, tải lưu trữ hình ảnh/video qua MinIO Object Storage và trao đổi tin nhắn/thông báo thời gian thực bằng WebSocket STOMP.

Dự án gồm 3 cổng giao diện tích hợp:
1. **Sàn Mua Sắm (Marketplace)** dành cho Khách hàng.
2. **Kênh Người Bán (Seller Portal)** dành cho Chủ shop đăng bán, quản lý kho hàng và xử lý đơn.
3. **Trung Tâm Quản Trị (Admin Portal)** dành cho Admin toàn sàn giám sát dòng tiền, duyệt shop, xử lý khiếu nại, phân quyền và cấu hình chiết khấu hoa hồng sàn.

---

## 2. Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Core Framework**: Spring Boot 3.x, Spring MVC, Spring Data MongoDB.
- **Ngôn ngữ**: Java 17 (LTS).
- **Cơ sở dữ liệu**: MongoDB (MongoDB Atlas Cloud hoặc Local).
- **Bảo mật & Phân quyền**: 
  - Spring Security 6 với `@EnableMethodSecurity`.
  - JWT Stateless (Access Token in-memory + Refresh Token trong HttpOnly Cookie).
  - OAuth2 Social Login với Google (`spring-boot-starter-oauth2-client`).
  - Cơ chế `tokenVersion` tự động thu hồi phiên đăng nhập tức thì khi khóa tài khoản.
- **Thanh toán**: Tích hợp Cổng thanh toán VNPay Sandbox với mã hóa bảo mật HMAC-SHA512.
- **Lưu trữ Media**: MinIO S3-Compatible Object Storage (avatar, ảnh sản phẩm, video).
- **Realtime**: WebSocket STOMP qua SockJS cho Chat Khách - Shop và Thông báo Realtime.
- **Concurrency & Khóa Phân Tán**: Native MongoDB Distributed Lock (`MongoDistributedLock`) trên collection `distributed_locks` với TTL index.
- **Tài liệu API**: Springdoc OpenAPI 3.0 / Swagger UI.

### Frontend
- **Thư viện chính**: React 19, React DOM 19.
- **Build Tool**: Vite 7 (Hot Module Replacement siêu tốc).
- **Styling**: Tailwind CSS 4, CSS Variables hiện đại, Responsive Mobile & Desktop.
- **Icons**: Lucide React.
- **Realtime Client**: `@stomp/stompjs` 7.3.0.

---

## 3. Tính Năng Nổi Bật

### 3.1. Phân Hệ Khách Hàng (Customer Marketplace)
- **Trang chủ & Khám phá**: Banner slider, danh mục ngành hàng trực quan, Flash Sale đếm ngược thời gian thực, sản phẩm gợi ý cá nhân hóa.
- **Tìm kiếm & Bộ lọc**: Lọc sản phẩm đa tiêu chí (danh mục, khoảng giá, đánh giá sao, sắp xếp theo giá/độ phổ biến).
- **Chi tiết sản phẩm**: Bộ sưu tập hình ảnh zoom, chọn biến thể (Màu sắc, Size, SKU) tự động cập nhật giá và tồn kho thực tế, xem đánh giá có hình ảnh kèm sao.
- **Giỏ hàng & Đặt hàng**: Phân nhóm sản phẩm theo từng Shop, áp dụng Voucher khuyến mãi, chọn địa chỉ giao hàng với tính năng gợi ý bản đồ tự động.
- **Thanh toán linh hoạt**: Hỗ trợ COD (Thanh toán khi nhận hàng) và Cổng VNPay (quét mã QR / thẻ ATM nội địa / thẻ quốc tế).
- **Theo dõi đơn hàng & Hoàn tiền**: Timeline cập nhật trạng thái đơn (Chờ duyệt $\rightarrow$ Chuẩn bị hàng $\rightarrow$ Đang giao $\rightarrow$ Đã nhận). Hỗ trợ gửi khiếu nại Trả hàng & Hoàn tiền.
- **Chat trực tuyến**: Chat trực tiếp với từng chủ shop qua Widget nổi, lưu lịch sử tin nhắn thời gian thực.
- **Yêu thích & Đánh giá**: Danh sách Wishlist, viết đánh giá và chấm điểm sao sau khi đơn hàng giao thành công.

### 3.2. Phân Hệ Người Bán (Seller Portal - `/seller`)
- **Onboarding Gian Hàng**: Quy trình đăng ký mở shop chỉ trong 1 phút, cấu hình logo, banner, địa chỉ kho và mô tả.
- **Dashboard Tổng Quan**: Thống kê số sản phẩm, tổng đơn hàng, doanh số và đánh giá trung bình. Biểu đồ doanh thu theo ngày và biểu đồ tròn phân bổ trạng thái đơn hàng.
- **Quản lý Sản phẩm & Biến thể**: Thêm mới, chỉnh sửa, xóa sản phẩm kèm nhiều biến thể SKU (Màu sắc, kích thước, giá bán, giá khuyến mãi, tồn kho).
- **Quản lý Đơn hàng**: Tiếp nhận và cập nhật tiến trình đơn hàng (`PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
- **Mã giảm giá của Shop**: Tự tạo và phát hành voucher giảm giá riêng cho khách mua tại shop.
- **Seller Chat Center**: Trung tâm hội thoại đa khách hàng, hỗ trợ đọc/trả lời tức thì qua WebSocket.
- **Cảnh báo tồn kho**: Cảnh báo tức thì các mặt hàng sắp hết hàng (tồn kho $\le$ ngưỡng chỉ định).

### 3.3. Phân Hệ Quản Trị Viên (Admin Portal - `/admin`)
- **10 Phân hệ chức năng chuyên nghiệp**:
  1. 📊 **Dashboard Toàn Sàn**:
     - 📦 **Tổng GMV Sàn**: Toàn bộ giá trị hàng hóa hoàn tất.
     - 💰 **Doanh Thu Thực Của Sàn (Net Platform Revenue)**: Tiền hoa hồng thực tế Admin thu được theo tỷ lệ chiết khấu.
     - 🏪 **Tiền Đối Soát Trả Cho Shop (Seller Payout)**: Số tiền đối soát chi trả về cho các chủ shop.
     - Biểu đồ cột doanh thu toàn sàn (7, 10, 30 ngày), biểu đồ trạng thái đơn, Top 5 Shop và Top 5 Sản phẩm bán chạy nhất sàn.
  2. 👥 **Quản Lý Người Dùng**: Danh sách người dùng, tìm kiếm, lọc cổng login (Local/Google), nút Khóa / Mở khóa tài khoản (lập tức thu hồi JWT).
  3. 🏪 **Quản Lý Gian Hàng (Shops)**: Danh sách shop toàn sàn, lọc theo trạng thái (`PENDING`, `ACTIVE`, `SUSPENDED`), nút **Duyệt Shop**, **Tạm Khóa** và **Kích Hoạt Lại**.
  4. 📑 **Quản Lý Đơn Hàng Toàn Sàn**: Giám sát mọi đơn hàng, chi tiết đơn mua, nút **Quét & Hủy Đơn Quá Hạn (VNPay 15 phút)**.
  5. 🔄 **Quản Lý Khiếu Nại & Hoàn Tiền**: Admin có quyền tối cao phân xử khiếu nại: **Chấp thuận** (tự động hoàn tồn kho về shop) hoặc **Từ chối** (nhập lý do từ chối).
  6. 🏷️ **Quản Lý Danh Mục**: Thêm mới, sửa icon/tên, xóa danh mục sản phẩm hiển thị trên trang chủ.
  7. 🎟️ **Quản Lý Voucher Toàn Sàn**: Theo dõi các mã giảm giá, kiểm soát số lượt đã sử dụng (`usedCount / usageLimit`).
  8. ⭐ **Kiểm Duyệt Đánh Giá**: Lọc đánh giá 1-5 sao, gỡ bỏ đánh giá vi phạm / bôi nhọ / spam.
  9. 📢 **Phát Thông Báo Toàn Sàn (Broadcast)**: Gửi thông báo đẩy hàng loạt đến tất cả người dùng trong hệ thống.
  10. 💰 **Đối Soát Thanh Toán VNPay**: Bảng so sánh doanh thu đơn hàng hoàn tất vs tổng tiền cổng VNPay theo khoảng ngày, tự động cảnh báo sai lệch dòng tiền.
  11. ⚙️ **Cài Đặt % Chiết Khấu Sàn (Commission Setting)**: Modal trực quan cho phép Admin nhập và lưu % hoa hồng sàn (ví dụ 5.0%, 8.0%), toàn bộ Dashboard lập tức tính lại số liệu theo % mới.

---

## 4. Kiến Trúc Bảo Mật & Concurrency

- **Cơ chế Token In-Memory + HttpOnly Cookie**: Access Token chỉ lưu trong RAM (không lưu ở `localStorage` để chống triệt để XSS). Refresh Token được lưu trong HttpOnly, Secure Cookie để chống đánh cắp.
- **Tự động Silent Refresh Token**: Khi Access Token hết hạn, frontend tự động gửi request làm mới token ngầm mà không làm gián đoạn người dùng.
- **Vô hiệu hóa phiên tức thì (`tokenVersion`)**: Khi Admin bấm Khóa tài khoản, trường `tokenVersion` trong User được tăng lên $\rightarrow$ Ngay lập tức mọi Access Token và Refresh Token cũ của user đó bị từ chối ở tầng Filter (`JwtAuthenticationFilter`).
- **Khóa Phân Tán (Distributed Lock)**: Sử dụng `MongoDistributedLock` với cơ chế atomic upsert và TTL index để đồng bộ tiến trình Scheduler định kỳ quét hủy đơn VNPay quá hạn, ngăn chặn Race Condition khi scale nhiều instance backend.
- **Phục hồi tồn kho nguyên tử (Atomic Inventory Restore)**: Khi khiếu nại hoàn tiền được duyệt (`APPROVED`), hệ thống sử dụng `$inc` trên MongoDB để khôi phục chính xác số lượng tồn kho từng SKU.

---

## 5. Cấu Trúc Thư Mục Dự Án

```
tmdt/
├── backend/                              # Spring Boot 3 Backend
│   ├── src/main/java/com/example/backend/
│   │   ├── config/                       # OpenAPI, CORS, MinIO config
│   │   ├── controller/                   # Public & Seller Controllers (13 controllers)
│   │   │   └── admin/                    # Admin Controllers (9 controllers)
│   │   │       ├── AdminAnalyticsController.java
│   │   │       ├── AdminCouponController.java
│   │   │       ├── AdminNotificationController.java
│   │   │       ├── AdminOrderController.java
│   │   │       ├── AdminPaymentController.java
│   │   │       ├── AdminRefundController.java
│   │   │       ├── AdminReviewController.java
│   │   │       ├── AdminSettingController.java
│   │   │       ├── AdminShopController.java
│   │   │       └── AdminUserController.java
│   │   ├── DTO/                          # Data Transfer Objects
│   │   ├── module/                       # MongoDB Entity Documents
│   │   ├── repository/                   # Spring Data MongoDB Repositories
│   │   ├── sercurity/                    # JWT Filter, SecurityConfig, OAuth2 Handler
│   │   ├── service/                      # Service interfaces
│   │   │   └── impl/                     # Service business logic implementations
│   │   └── util/                         # Distributed Lock, Scheduler, Formatters
│   ├── src/test/                         # 19 Unit Tests (100% BUILD SUCCESS)
│   ├── pom.xml                           # Maven dependencies
│   └── mvnw.cmd                          # Maven Wrapper
│
├── frontend/                             # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/                     # Cart components
│   │   │   ├── chat/                     # ChatWidget, SellerChatCenter
│   │   │   ├── common/                   # Modal, Button, Pagination, Badge...
│   │   │   ├── layout/                   # Header, SubNav, Footer, MobileNav
│   │   │   ├── order/                    # Order cards & timeline
│   │   │   └── product/                  # Product cards, gallery, filter
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx             # Giao diện Admin Portal 10 phân hệ
│   │   │   ├── SellerPage.jsx            # Giao diện Seller Portal
│   │   │   ├── HomePage.jsx              # Trang chủ khách hàng
│   │   │   ├── ProductDetailPage.jsx     # Chi tiết sản phẩm
│   │   │   ├── CheckoutPage.jsx          # Thanh toán & đặt hàng
│   │   │   ├── OrdersPage.jsx            # Lịch sử đơn mua
│   │   │   └── Authcontext.jsx           # Quản lý Context Auth
│   │   ├── services/                     # Gọi API backend (adminService, sellerService...)
│   │   └── utils/                        # auth.js, formatters.js
│   ├── package.json
│   └── vite.config.js
└── README.md                             # Tài liệu dự án
```

---

## 6. Hướng Dẫn Cài Đặt & Chạy Local

### 6.1. Yêu Cầu Môi Trường
- **Java**: JDK 17 trở lên.
- **Node.js**: Node 18 trở lên (khuyên dùng Node 20 LTS) & npm.
- **Cơ sở dữ liệu**: MongoDB (Local hoặc URI MongoDB Atlas Cloud).
- **MinIO**: Cài đặt MinIO Server chạy ở cổng `9000` (hoặc dùng Docker).

---

### 6.2. Cấu Hình & Khởi Chạy Backend

1. Mở file cấu hình `backend/src/main/resources/application.properties` và điều chỉnh các thông số kết nối (nếu cần):
   ```properties
   # MongoDB Connection
   spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority

   # MinIO Object Storage
   minio.url=http://localhost:9000
   minio.access-key=minioadmin
   minio.secret-key=minioadmin

   # JWT Secret Key
   jwt.secret=VGhpc0lzQVNlY3JldEtleUZvckpXVFRoaXNJc0FTZWNyZXRLZXlGb3JKV1Q=
   jwt.expiration=900000
   jwt.refresh-expiration=604800000

   # VNPay Sandbox
   vnpay.tmn-code=DKUIV5V2
   vnpay.hash-secret=FSHEZV8321H4PZGD84EGAS6OK4CMUISF
   vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   vnpay.return-url=http://localhost:5173/payment/vnpay-result
   ```

2. Chạy kiểm thử Unit Test:
   ```powershell
   cd c:\tmdt\backend
   .\mvnw.cmd test -Dtest=Admin*Test
   ```

3. Khởi động Backend:
   ```powershell
   cd c:\tmdt\backend
   .\mvnw.cmd spring-boot:run
   ```
   > Backend sẽ khởi chạy tại: `http://localhost:8080`

---

### 6.3. Cấu Hình & Khởi Chạy Frontend

1. Cài đặt các thư viện phụ thuộc:
   ```powershell
   cd c:\tmdt\frontend
   npm install
   ```

2. Tạo file cấu hình môi trường `.env` trong thư mục `frontend`:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

3. Khởi chạy môi trường phát triển (Dev Server):
   ```powershell
   npm run dev
   ```
   > Truy cập ứng dụng tại: `http://localhost:5173`

4. Build production:
   ```powershell
   npm run build
   ```

---

## 7. Tài Liệu API (OpenAPI / Swagger)

Sau khi backend khởi động, bạn có thể truy cập tài liệu API trực quan tại:
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> Giao diện Swagger hỗ trợ nút **Authorize** nhập Bearer JWT Token để test trực tiếp tất cả các API `/admin/**`, `/shops/**`, `/orders/**`, `/products/**`.

---

## 8. Triển Khai (Deployment)

- **Frontend**: Triển khai dễ dàng lên **Vercel** hoặc **Netlify**. Đã bao gồm file cấu hình định tuyến SPA `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Backend**: Đóng gói thành file `.jar` và triển khai trên **Render**, **Railway**, **AWS EC2** hoặc **Docker**:
  ```powershell
  cd backend
  .\mvnw.cmd clean package -DskipTests
  java -jar target/backend-0.0.1-SNAPSHOT.jar
  ```

---

## 👥 Tác Giả & Đóng Góp

Dự án được xây dựng và phát triển bởi **DoMix Team**.  
Mọi thắc mắc hoặc đóng góp vui lòng mở Issue hoặc gửi Pull Request! ⭐
