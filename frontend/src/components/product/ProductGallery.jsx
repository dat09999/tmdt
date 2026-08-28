import React, { useState } from "react";

export default function ProductGallery({ images = [], name = "" }) {
  const imageList =
    images && images.length > 0
      ? images
      : [
          {
            id: "default",
            url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
          },
        ];

  const [activeImage, setActiveImage] = useState(
    imageList.find((img) => img.isMain)?.url || imageList[0]?.url
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Main Large Image */}
      <div
        className="card"
        style={{
          width: "100%",
          paddingTop: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--r-lg)",
          backgroundColor: "#f9fafb",
          border: "1px solid var(--border-light)",
        }}
      >
        <img
          src={activeImage}
          alt={name}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* Thumbnails Row */}
      {imageList.length > 1 && (
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
          {imageList.map((img, idx) => {
            const isCurrent = activeImage === img.url;
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveImage(img.url)}
                onMouseEnter={() => setActiveImage(img.url)}
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "var(--r-sm)",
                  overflow: "hidden",
                  border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--border)",
                  padding: "2px",
                  background: "#fff",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
