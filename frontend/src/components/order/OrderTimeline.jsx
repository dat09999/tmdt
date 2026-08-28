import React from "react";
import { Check, Clock, Truck, Package, CheckCircle2, XCircle, FileText } from "lucide-react";

export default function OrderTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        position: "relative",
        padding: "20px 0 10px",
        overflowX: "auto",
      }}
    >
      {timeline.map((step, idx) => {
        const isDone = step.done;
        const isCurrent = step.current;
        const isCancelled = step.isCancelled;

        const isLast = idx === timeline.length - 1;

        return (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              flex: 1,
              minWidth: "130px",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Connecting line to previous step */}
            {idx > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "50%",
                  width: "100%",
                  height: "3px",
                  backgroundColor: isDone ? "#10b981" : "#e5e7eb",
                  zIndex: -1,
                  transition: "background-color 0.3s",
                }}
              />
            )}

            {/* Step Icon */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: isCancelled
                  ? "#ef4444"
                  : isCurrent
                  ? "var(--primary)"
                  : isDone
                  ? "#10b981"
                  : "#f3f4f6",
                color: isDone || isCurrent || isCancelled ? "#ffffff" : "var(--text-tertiary)",
                border: isDone || isCurrent || isCancelled ? "none" : "2px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "14px",
                boxShadow: isCurrent ? "0 0 0 4px rgba(238, 77, 45, 0.2)" : "none",
                marginBottom: "10px",
                transition: "all 0.3s ease",
              }}
            >
              {isCancelled ? (
                <XCircle size={20} />
              ) : isDone && !isCurrent ? (
                <Check size={20} />
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>

            {/* Title & Time */}
            <div
              style={{
                fontSize: "13px",
                fontWeight: isCurrent ? "800" : isDone ? "700" : "500",
                color: isCancelled
                  ? "#ef4444"
                  : isCurrent
                  ? "var(--primary)"
                  : isDone
                  ? "var(--text)"
                  : "var(--text-tertiary)",
                lineHeight: "1.4",
                marginBottom: "4px",
                maxWidth: "140px",
              }}
            >
              {step.title}
            </div>

            {step.time && (
              <span
                style={{
                  fontSize: "11px",
                  color: isCurrent ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: isCurrent ? "600" : "400",
                }}
              >
                {step.time}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
