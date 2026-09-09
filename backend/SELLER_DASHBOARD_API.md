# 📊 HƯỚNG DẪN TÍCH HỢP API THỐNG KÊ & BIỂU ĐỒ TRANG BÁN HÀNG (SELLER DASHBOARD)

Tài liệu này dành cho Frontend Developer để xây dựng giao diện Dashboard cho người bán (Shop Analytics), bao gồm các biểu đồ tăng trưởng, thống kê đơn hàng, sản phẩm bán chạy và cảnh báo tồn kho.

---

## 🚀 TỔNG QUAN CÁC API

| STT | Endpoint | Method | Chức năng | Dùng cho UI component |
|:---:|:---|:---:|:---|:---|
| 1 | `/shops/{shopId}/analytics/overview` | `GET` | **Tất cả trong 1 (Khuyên dùng)**: Lấy toàn bộ số liệu tổng quan + biểu đồ | Toàn bộ Dashboard |
| 2 | `/shops/{shopId}/analytics/revenue` | `GET` | Biểu đồ doanh thu và số đơn theo ngày (chọn khoảng ngày hoặc số ngày) | Line Chart / Bar Chart |
| 3 | `/shops/{shopId}/analytics/order-status` | `GET` | Phân bố tỷ lệ các trạng thái đơn hàng | Pie Chart / Donut Chart |
| 4 | `/shops/{shopId}/analytics/top-products` | `GET` | Top 5 sản phẩm bán chạy nhất | Leaderboard / Top Table |
| 5 | `/shops/{shopId}/analytics/low-stock` | `GET` | Cảnh báo biến thể sản phẩm sắp hết hàng | Alert Badge / Warning Table |

---

## 🗓️ CƠ CHẾ LỌC THỜI GIAN LINH HOẠT (DATE RANGE PICKER)

Ở cả 2 API **`/analytics/overview`** và **`/analytics/revenue`**, Frontend có thể truyền tham số theo 2 cách:

### Cách 1: Chọn khoảng ngày bất kỳ qua Date Picker (Ví dụ 10 ngày)
* **URL**: `GET /shops/{shopId}/analytics/overview?startDate=2026-08-01&endDate=2026-08-10`
* **Kết quả**: Backend sẽ trả về mảng đúng 10 ngày (từ 01/08/2026 đến 10/08/2026). Ngày nào không có đơn hàng sẽ tự động điền `revenue: 0` và `orderCount: 0`.

### Cách 2: Chọn nhanh số ngày gần nhất (Nút bấm 10 ngày, 30 ngày)
* **URL**: `GET /shops/{shopId}/analytics/overview?days=10`
* **Kết quả**: Tự động tính lùi 10 ngày gần nhất tính từ ngày hôm nay.

---

## 📋 CHI TIẾT TỪNG API & DỮ LIỆU MẪU (JSON)

### 1. API TỔNG HỢP: Toàn bộ Dashboard trong 1 Request
> 💡 **Khuyên dùng**: Frontend chỉ cần gọi API này 1 lần khi load trang Dashboard là có đủ dữ liệu cho tất cả biểu đồ và thẻ thống kê.

* **URL**: 
  * `GET /shops/{shopId}/analytics/overview?startDate=2026-08-01&endDate=2026-08-10`
  * Hoặc: `GET /shops/{shopId}/analytics/overview?days=10`
* **Headers**: `Authorization: Bearer <accessToken>`

#### Dữ liệu trả về (Response 200 OK):
```json
{
  "summary": {
    "shopId": "65f1234567890abcdef12345",
    "productCount": 24,
    "orderCount": 158,
    "totalSales": 340,
    "averageRating": 4.85,
    "revenue": 52400000
  },
  "revenueChart": [
    { "date": "2026-08-01", "revenue": 1500000, "orderCount": 4 },
    { "date": "2026-08-02", "revenue": 2200000, "orderCount": 7 },
    { "date": "2026-08-03", "revenue": 800000,  "orderCount": 3 },
    { "date": "2026-08-04", "revenue": 0,       "orderCount": 0 },
    { "date": "2026-08-05", "revenue": 3400000, "orderCount": 9 },
    { "date": "2026-08-06", "revenue": 1900000, "orderCount": 6 },
    { "date": "2026-08-07", "revenue": 2700000, "orderCount": 8 },
    { "date": "2026-08-08", "revenue": 4500000, "orderCount": 14 },
    { "date": "2026-08-09", "revenue": 3800000, "orderCount": 11 },
    { "date": "2026-08-10", "revenue": 5100000, "orderCount": 15 }
  ],
  "orderStatusDistribution": {
    "statusCounts": {
      "PENDING": 4,
      "PROCESSING": 8,
      "SHIPPING": 15,
      "COMPLETED": 125,
      "CANCELED": 5,
      "REFUNDED": 1
    },
    "totalOrders": 158
  },
  "topProducts": [
    {
      "productId": "65f9876543210fedcba54321",
      "productName": "Áo Thun Unisex Cotton 100% Form Rộng",
      "imageUrl": "https://.../aothun.jpg",
      "basePrice": 199000,
      "soldCount": 85,
      "revenue": 16915000
    },
    {
      "productId": "65f9876543210fedcba54322",
      "productName": "Quần Jean Baggy Nam Nữ Ống Rộng",
      "imageUrl": "https://.../quanjean.jpg",
      "basePrice": 350000,
      "soldCount": 42,
      "revenue": 14700000
    }
  ],
  "lowStockAlerts": [
    {
      "productId": "65f9876543210fedcba54321",
      "productName": "Áo Thun Unisex Cotton 100% Form Rộng",
      "sku": "AT-DEN-XL",
      "color": "Đen",
      "size": "XL",
      "stock": 2
    },
    {
      "productId": "65f9876543210fedcba54322",
      "productName": "Quần Jean Baggy Nam Nữ Ống Rộng",
      "sku": "QJ-XANH-M",
      "color": "Xanh nhạt",
      "size": "M",
      "stock": 0
    }
  ]
}
```

---

### 2. API Biểu đồ Doanh thu (Line/Bar Chart)
* **URL**: 
  * `GET /shops/{shopId}/analytics/revenue?startDate=2026-08-01&endDate=2026-08-10`
  * Hoặc: `GET /shops/{shopId}/analytics/revenue?days=10`
* **Dữ liệu trả về**: Mảng các ngày với doanh thu (`revenue`) và số đơn hoàn thành (`orderCount`).

---

### 3. API Biểu đồ Tròn Trạng thái Đơn hàng (Pie/Donut Chart)
* **URL**: `GET /shops/{shopId}/analytics/order-status`
* **Dữ liệu trả về**:
```json
{
  "statusCounts": {
    "PENDING": 4,
    "PROCESSING": 8,
    "SHIPPING": 15,
    "COMPLETED": 125,
    "CANCELED": 5,
    "REFUNDED": 1
  },
  "totalOrders": 158
}
```

---

### 4. API Top Sản phẩm Bán chạy
* **URL**: `GET /shops/{shopId}/analytics/top-products?limit=5`
* **Query Params**: `limit` *(mặc định 5, tối đa 50)*.

---

### 5. API Cảnh báo Tồn kho Sắp hết (Low Stock Alerts)
* **URL**: `GET /shops/{shopId}/analytics/low-stock?threshold=5`
* **Query Params**: `threshold` *(mặc định 5)*: Lấy những biến thể có `stock <= threshold`.

---

## 🎨 HƯỚNG DẪN CODE GIAO DIỆN REACT + RECHARTS

### Code mẫu Bộ chọn khoảng ngày (Date Range Picker) + Biểu đồ:
```jsx
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function RevenueAnalyticsCard({ shopId }) {
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-10');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/shops/${shopId}/analytics/revenue?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setChartData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [startDate, endDate]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Biểu đồ doanh thu</h3>
        
        {/* Bộ chọn khoảng ngày */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}Tr`} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`} />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```