import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "danger" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  block = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case "secondary":
        return "btn-secondary";
      case "outline":
        return "btn-outline";
      case "danger":
        return "btn-danger";
      case "ghost":
        return "btn-ghost";
      case "primary":
      default:
        return "btn-primary";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "btn-sm";
      case "lg":
        return "btn-lg";
      case "md":
      default:
        return "btn-md";
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn ${getVariantClass()} ${getSizeClass()} ${block ? "btn-block" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      ) : null}
      
      {children && <span>{children}</span>}

      {!loading && IconRight && (
        <IconRight size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      )}
    </button>
  );
}
