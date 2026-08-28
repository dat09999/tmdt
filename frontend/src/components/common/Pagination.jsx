import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const range = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    range.unshift("...");
  }
  if (currentPage + delta < totalPages - 1) {
    range.push("...");
  }

  pages.push(1, ...range, totalPages > 1 ? totalPages : []);

  return (
    <div
      className={`pagination ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        marginTop: "32px",
        marginBottom: "20px",
      }}
    >
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--border)",
          background: currentPage === 1 ? "var(--surface-muted)" : "var(--surface)",
          color: currentPage === 1 ? "var(--text-tertiary)" : "var(--text)",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.flat().map((p, idx) => {
        if (p === "...") {
          return (
            <span
              key={`dots-${idx}`}
              style={{
                width: "36px",
                textAlign: "center",
                color: "var(--text-tertiary)",
              }}
            >
              ...
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <button
            key={`page-${p}`}
            onClick={() => onPageChange(p)}
            style={{
              minWidth: "36px",
              height: "36px",
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--r-sm)",
              border: isCurrent ? "none" : "1px solid var(--border)",
              background: isCurrent ? "var(--primary)" : "var(--surface)",
              color: isCurrent ? "#fff" : "var(--text)",
              fontWeight: isCurrent ? "700" : "500",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {p}
          </button>
        );
      })}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--border)",
          background: currentPage === totalPages ? "var(--surface-muted)" : "var(--surface)",
          color: currentPage === totalPages ? "var(--text-tertiary)" : "var(--text)",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
