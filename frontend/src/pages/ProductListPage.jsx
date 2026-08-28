import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import ProductGrid from "../components/product/ProductGrid";
import ProductFilter from "../components/product/ProductFilter";
import Pagination from "../components/common/Pagination";
import { productService } from "../services/productService";
import { ArrowUpDown, ChevronRight, SlidersHorizontal } from "lucide-react";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchKeyword, setSearchKeyword] = useState(initialSearch);
  const [sortOption, setSortOption] = useState("popular"); // popular, newest, sold, price_asc, price_desc
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const itemsPerPage = 12;

  useEffect(() => {
    productService.getCategories().then((cats) => setCategories(cats || []));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts({
          category: selectedCategory,
          search: searchKeyword,
          sort: sortOption,
        });

        // Filter by price range, rating, location
        let filtered = [...(data || [])];
        if (priceRange.min) {
          filtered = filtered.filter((p) => p.basePrice >= Number(priceRange.min));
        }
        if (priceRange.max) {
          filtered = filtered.filter((p) => p.basePrice <= Number(priceRange.max));
        }
        if (selectedRating > 0) {
          filtered = filtered.filter((p) => (p.rating || 0) >= selectedRating);
        }
        if (selectedLocation) {
          filtered = filtered.filter((p) => p.location === selectedLocation);
        }

        setProducts(filtered);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching products list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, searchKeyword, sortOption, priceRange, selectedRating, selectedLocation]);

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSearchKeyword("");
    setPriceRange({ min: "", max: "" });
    setSelectedRating(0);
    setSelectedLocation("");
    setSortOption("popular");
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const currentProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-shell">
      <Header
        initialSearch={searchKeyword}
        onSearch={(kw) => setSearchKeyword(kw)}
      />
      <SubNav />

      <main className="page-content">
        <div className="container">
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "16px",
            }}
          >
            <a href="/" style={{ color: "var(--text)" }}>Trang chủ</a>
            <ChevronRight size={14} />
            <span style={{ color: "var(--primary)", fontWeight: "600" }}>
              {searchKeyword
                ? `Kết quả tìm kiếm cho "${searchKeyword}"`
                : selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name || "Danh mục"
                : "Tất cả sản phẩm"}
            </span>
          </div>

          {/* Main Layout: 2 Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* Sidebar Filters */}
            <div className="hide-mobile">
              <ProductFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                priceRange={priceRange}
                onApplyPriceRange={setPriceRange}
                selectedRating={selectedRating}
                onSelectRating={setSelectedRating}
                selectedLocation={selectedLocation}
                onSelectLocation={setSelectedLocation}
                onReset={handleResetFilters}
              />
            </div>

            {/* Product List Content Area */}
            <div>
              {/* Sort Bar */}
              <div
                className="card"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  backgroundColor: "var(--surface-muted)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--r-md)",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Sắp xếp theo:
                  </span>
                  {[
                    { id: "popular", label: "Phổ Biến" },
                    { id: "newest", label: "Mới Nhất" },
                    { id: "sold", label: "Bán Chạy" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortOption(s.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "var(--r-sm)",
                        backgroundColor: sortOption === s.id ? "var(--primary)" : "var(--surface)",
                        color: sortOption === s.id ? "#fff" : "var(--text)",
                        fontSize: "13px",
                        fontWeight: sortOption === s.id ? "700" : "500",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}

                  {/* Price Sort Dropdown */}
                  <select
                    value={sortOption.startsWith("price") ? sortOption : ""}
                    onChange={(e) => e.target.value && setSortOption(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--r-sm)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      fontSize: "13px",
                      fontWeight: sortOption.startsWith("price") ? "700" : "500",
                      color: sortOption.startsWith("price") ? "var(--primary)" : "var(--text)",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Giá (Thấp đến Cao / Cao đến Thấp)</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                  </select>
                </div>

                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Tìm thấy <strong style={{ color: "var(--primary)" }}>{products.length}</strong> sản phẩm
                </div>
              </div>

              {/* Products Grid */}
              <ProductGrid
                products={currentProducts}
                loading={loading}
                onResetFilters={handleResetFilters}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
