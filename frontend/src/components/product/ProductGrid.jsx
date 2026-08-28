import React from "react";
import ProductCard from "./ProductCard";
import Skeleton from "../common/Skeleton";
import EmptyState from "../common/EmptyState";
import { PackageSearch } from "lucide-react";

export default function ProductGrid({
  products = [],
  loading = false,
  emptyTitle = "Không tìm thấy sản phẩm phù hợp",
  emptyDescription = "Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc.",
  onResetFilters,
}) {
  if (loading) {
    return <Skeleton variant="product-card" count={12} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        actionText={onResetFilters ? "Xóa bộ lọc" : "Xem tất cả sản phẩm"}
        onAction={onResetFilters || (() => (window.location.href = "/products"))}
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: "12px",
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
