import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";

const isVideoMedia = (media) => {
  if (!media) return false;
  if (typeof media === "string") {
    return /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(media) || media.startsWith("data:video/");
  }
  if (media.imageVideo === "VIDEO" || media.type === "video") return true;
  if (media.url) {
    return /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(media.url) || media.url.startsWith("data:video/");
  }
  return false;
};

export default function ProductGallery({ images = [], name = "" }) {
  const mediaList =
    images && images.length > 0
      ? images.map((item, idx) => {
          const url = typeof item === "string" ? item : item.url;
          const isVideo = isVideoMedia(item);
          return {
            id: item.id || item.key || idx,
            url,
            isMain: item.isMain,
            isVideo,
            original: item,
          };
        })
      : [
          {
            id: "default",
            url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
            isVideo: false,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (mediaList.length > 0) {
      const mainIdx = mediaList.findIndex((m) => m.isMain);
      setActiveIndex(mainIdx >= 0 ? mainIdx : 0);
    }
  }, [images]);

  const activeMedia = mediaList[activeIndex] || mediaList[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Main Large Media */}
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
        {activeMedia.isVideo ? (
          <video
            key={activeMedia.url}
            src={activeMedia.url}
            controls
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#000",
            }}
          />
        ) : (
          <img
            src={activeMedia.url}
            alt={name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600";
            }}
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
        )}
      </div>

      {/* Thumbnails Row */}
      {mediaList.length > 1 && (
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
          {mediaList.map((media, idx) => {
            const isCurrent = activeIndex === idx;
            return (
              <button
                key={media.id || idx}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
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
                  position: "relative",
                }}
              >
                {media.isVideo ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      backgroundColor: "#111",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <video
                      src={media.url}
                      muted
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      <Play size={18} fill="#fff" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={media.url}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
