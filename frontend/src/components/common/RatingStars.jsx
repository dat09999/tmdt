import React from "react";
import { Star, StarHalf } from "lucide-react";

export default function RatingStars({
  rating = 5,
  size = 14,
  showScore = false,
  interactive = false,
  onChange,
  className = "",
}) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4 && rating % 1 <= 0.8;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${interactive ? "cursor-pointer" : ""} ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
    >
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          fill="#ffaa00"
          color="#ffaa00"
          onClick={() => handleClick(i)}
        />
      ))}
      {hasHalfStar && (
        <StarHalf
          key="half"
          size={size}
          fill="#ffaa00"
          color="#ffaa00"
          onClick={() => handleClick(fullStars)}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          fill="none"
          color="#d1d5db"
          onClick={() => handleClick(fullStars + (hasHalfStar ? 1 : 0) + i)}
        />
      ))}
      {showScore && (
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#f59e0b", marginLeft: "4px" }}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
