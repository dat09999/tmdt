import React from "react";

export default function Badge({
  children,
  type = "primary", // "primary" | "discount" | "mall" | "freeship" | "warning" | "success" | "info"
  className = "",
  size = "md",
  ...props
}) {
  const getStyleClass = () => {
    switch (type) {
      case "discount":
        return "badge-discount";
      case "mall":
        return "badge-mall";
      case "freeship":
        return "badge-freeship";
      case "warning":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "success":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "info":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "primary":
      default:
        return "badge-primary";
    }
  };

  return (
    <span className={`badge ${getStyleClass()} ${className}`} {...props}>
      {children}
    </span>
  );
}
