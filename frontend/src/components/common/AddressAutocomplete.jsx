import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Check } from "lucide-react";
import { userService } from "../../services/userService";

export default function AddressAutocomplete({
  value = "",
  onChange,
  onPlaceSelect,
  placeholder = "Nhập địa chỉ (số nhà, tên đường, phường/xã, quận/huyện...)",
  required = false,
}) {
  const [inputVal, setInputVal] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputVal(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputVal(text);
    if (onChange) onChange(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const list = await userService.getAddressSuggestions(text.trim());
        setSuggestions(Array.isArray(list) ? list : []);
        setIsOpen(Array.isArray(list) && list.length > 0);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (item) => {
    try {
      setLoading(true);
      const detail = await userService.resolvePlace(item.placeId);
      const selectedAddress = detail?.formattedAddress || item.text || item.mainText;
      setInputVal(selectedAddress);

      if (onChange) onChange(selectedAddress);
      if (onPlaceSelect) {
        onPlaceSelect({
          formattedAddress: selectedAddress,
          detail: selectedAddress,
          lat: detail?.lat ?? null,
          lng: detail?.lng ?? null,
          placeId: item.placeId,
        });
      }
    } catch (err) {
      console.error("Failed to resolve place:", err);
      setInputVal(item.text);
      if (onChange) onChange(item.text);
    } finally {
      setLoading(false);
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          style={{
            width: "100%",
            padding: "10px 36px 10px 12px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            fontSize: "13px",
            outline: "none",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-tertiary)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" color="var(--primary)" />
          ) : (
            <Search size={16} />
          )}
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--surface)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            border: "1px solid var(--border-light)",
            zIndex: 9999,
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-secondary)",
              backgroundColor: "var(--surface-muted)",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <MapPin size={12} color="var(--primary)" />
            <span>Gợi ý địa chỉ từ bản đồ</span>
          </div>

          {suggestions.map((item) => (
            <div
              key={item.placeId || item.text}
              onClick={() => handleSelect(item)}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-light)",
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <MapPin size={16} color="var(--primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>
                  {item.mainText || item.text}
                </div>
                {item.secondaryText && (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {item.secondaryText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
