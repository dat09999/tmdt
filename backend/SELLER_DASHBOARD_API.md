# 📊 HƯỚNG DẪN TÍCH HỢP API THỐNG KÊ & BIỂU ĐỒ TRANG BÁN HÀNG (SELLER DASHBOARD)

Tài liệu này dành cho Frontend Developer để xây dựng giao diện Dashboard cho người bán (Shop Analytics), bao gồm các biểu đồ tăng trưởng, thống kê đơn hàng, sản phẩm bán chạy và cảnh báo tồn kho.

---

## 🚀 TỔNG QUAN CÁC API MỚI

| STT | Endpoint | Method | Chức năng | Dùng cho UI component |
|:---:|:---|:---:|:---|:---|
| 1 | `/shops/{shopId}/analytics/overview` | `GET` | **Tất cả trong 1 (Khuyên dùng)**: Lấy toàn bộ số liệu tổng quan + biểu đồ | Toàn bộ Dashboard |
| 2 | `/shops/{shopId}/analytics/revenue` | `GET` | Biểu đồ doanh thu và số đơn theo từng ngày | Line Chart / Bar Chart |
| 3 | `/shops/{shopId}/analytics/order-status` | `GET` | Phân bố tỷ lệ các trạng thái đơn hàng | Pie Chart / Donut Chart |
| 4 | `/shops/{shopId}/analytics/top-products` | `GET` | Top 5 sản phẩm bán chạy nhất | Leaderboard / Top Table |
| 5 | `/shops/{shopId}/analytics/low-stock` | `GET` | Cảnh báo biến thể sản phẩm sắp hết hàng | Alert Badge / Warning Table |

---

## 📋 CHI TIẾT TỪNG API & DỮ LIỆU MẪU (JSON)

### 1. API TỔNG HỢP: Toàn bộ Dashboard trong 1 Request
> 💡 **Khuyên dùng**: Frontend chỉ cần gọi API này 1 lần khi load trang Dashboard là có đủ dữ liệu cho tất cả biểu đồ và thẻ thống kê.

* **URL**: `GET /shops/{shopId}/analytics/overview?days=7`
* **Query Params**:
  * `days` *(optional, mặc định `7`)*: Số ngày thống kê (ví dụ `7` hoặc `30`).
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
    { "date": "2026-08-29", "revenue": 3500000, "orderCount": 12 },
    { "date": "2026-08-30", "revenue": 7200000, "orderCount": 21 },
    { "date": "2026-08-31", "revenue": 4100000, "orderCount": 15 },
    { "date": "2026-09-01", "revenue": 8900000, "orderCount": 28 },
    { "date": "2026-09-02", "revenue": 6300000, "orderCount": 19 },
    { "date": "2026-09-03", "revenue": 10500000, "orderCount": 33 },
    { "date": "2026-09-04", "revenue": 11900000, "orderCount": 30 }
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
* **URL**: `GET /shops/{shopId}/analytics/revenue?days=7`
* **Query Params**: `days` (ví dụ `7` ngày hoặc `30` ngày).
* **Mô tả**: Tự động lấp đầy các ngày có doanh thu = 0 để trục thời gian của biểu đồ không bị gãy hoặc khuyết ngày.
* **Dữ liệu trả về**:
```json
[
  { "date": "2026-08-29", "revenue": 3500000, "orderCount": 12 },
  { "date": "2026-08-30", "revenue": 7200000, "orderCount": 21 },
  { "date": "2026-08-31", "revenue": 0,       "orderCount": 0 },
  { "date": "2026-09-01", "revenue": 8900000, "orderCount": 28 }
]
```

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
* **Dữ liệu trả về**: Mảng các sản phẩm xếp hạng theo số lượng bán (`soldCount`) giảm dần.

---

### 5. API Cảnh báo Tồn kho Sắp hết (Low Stock Alerts)
* **URL**: `GET /shops/{shopId}/analytics/low-stock?threshold=5`
* **Query Params**: `threshold` *(mặc định 5)*: Lấy những biến thể có `stock <= threshold`.
* **Dữ liệu trả về**: Mảng các SKU biến thể cần người bán bổ sung hàng gấp.

---

## 🎨 HƯỚNG DẪN VẼ BIỂU ĐỒ Ở FRONTEND (React / Recharts)

### 1. Cài đặt thư viện:
```bash
npm install recharts lucide-react
```

### 2. Code mẫu vẽ Biểu đồ Doanh thu (Revenue Line Chart):
```jsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function RevenueChart({ data }) {
  // data lấy từ response.revenueChart
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Biểu đồ doanh thu</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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

### 3. Code mẫu vẽ Biểu đồ Tròn Trạng thái Đơn (Donut Chart):
```jsx
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  SHIPPING: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELED: '#ef4444',
  REFUNDED: '#6b7280'
};

function OrderPieChart({ statusCounts }) {
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Tỷ lệ đơn hàng</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```