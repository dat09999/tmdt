import React from "react";
import { CheckCircle2, Clock, Truck, Package, Check } from "lucide-react";

export default function OrderTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        position: "relative",
        padding: "24px 0 12px",
        overflowX: "auto",
      }}
    >
      {timeline.map((step, idx) => {
        const isDone = step.done;
        const isCurrent = step.current;

        return (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              flex: 1,
              minWidth: "120px",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Step Icon */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: isCurrent
                  ? "var(--primary)"
                  : isDone
                  ? "#00bfa5"
                  : "#e5e7eb",
                color: isDone || isCurrent ? "#ffffff" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                boxShadow: isCurrent ? "0 0 0 4px var(--primary-mid)" : "none",
                marginBottom: "8px",
                transition: "all 0.3s ease",
              }}
            >
              {isDone && !isCurrent ? <Check size={18} /> : <span>{idx + 1}</span>}
            </div>

            {/* Title & Time */}
            <div
              style={{
                fontSize: "13px",
                fontWeight: isCurrent ? "700" : isDone ? "600" : "500",
                color: isCurrent ? "var(--primary)" : isDone ? "var(--text)" : "var(--text-tertiary)",
                lineHeight: "1.3",
                marginBottom: "4px",
              }}
            >
              {step.title}
            </div>

            {step.time && (
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {step.time}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
