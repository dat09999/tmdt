import React from "react";

export default function Skeleton({
  variant = "rect", // "rect" | "circle" | "text" | "product-card" | "order-card"
  width,
  height,
  count = 1,
  className = "",
  style = {},
}) {
  if (variant === "product-card") {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        {[...Array(count || 6)].map((_, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div className="skeleton" style={{ width: "100%", aspectRatio: "1/1", borderRadius: "8px" }} />
            <div className="skeleton" style={{ width: "90%", height: "14px" }} />
            <div className="skeleton" style={{ width: "60%", height: "14px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="skeleton" style={{ width: "45%", height: "18px" }} />
              <div className="skeleton" style={{ width: "30%", height: "12px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={`skeleton ${className}`}
        style={{
          width: width || "40px",
          height: height || width || "40px",
          borderRadius: "50%",
          ...style,
        }}
      />
    );
  }

  if (variant === "text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className={`skeleton ${className}`}
            style={{
              width: width || (i === count - 1 ? "70%" : "100%"),
              height: height || "14px",
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || "100%",
        height: height || "100px",
        ...style,
      }}
    />
  );
}
