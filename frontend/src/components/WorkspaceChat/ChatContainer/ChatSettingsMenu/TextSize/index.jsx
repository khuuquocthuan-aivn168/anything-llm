import { useEffect, useRef, useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import useMobile from "@/hooks/useMobile";

function getTextSizes(t) {
  return [
    { key: "small", label: t("chat_window.small") },
    { key: "normal", label: t("chat_window.normal") },
    { key: "large", label: t("chat_window.large") },
  ];
}

function useHoverCapable() {
  const [canHover, setCanHover] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = (e) => setCanHover(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return canHover;
}

export default function TextSizeRow() {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const canHover = useHoverCapable();
  const useHoverSubmenu = canHover && !isMobile;
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [selectedSize, setSelectedSize] = useState(
    window.localStorage.getItem("anythingllm_text_size") || "normal"
  );
  const wrapperRef = useRef(null);

  function handleTextSizeChange(size) {
    setSelectedSize(size);
    window.localStorage.setItem("anythingllm_text_size", size);
    window.dispatchEvent(new CustomEvent("textSizeChange", { detail: size }));
    setShowSubmenu(false);
  }

  useEffect(() => {
    if (!showSubmenu) return;
    function handleClickOutside(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setShowSubmenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showSubmenu]);

  function handleMouseLeave(e) {
    const related = e.relatedTarget;
    // Touch/iOS often reports null when moving between children — don't close.
    if (related === null) return;
    if (related instanceof Node && wrapperRef.current?.contains(related)) {
      return;
    }
    setShowSubmenu(false);
  }

  function handleRowClick() {
    if (!useHoverSubmenu) {
      setShowSubmenu((v) => !v);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={useHoverSubmenu ? () => setShowSubmenu(true) : undefined}
      onMouseLeave={useHoverSubmenu ? handleMouseLeave : undefined}
    >
      <div
        onClick={handleRowClick}
        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
          showSubmenu
            ? "bg-zinc-700 light:bg-slate-200"
            : "hover:bg-zinc-700 light:hover:bg-slate-200"
        }`}
      >
        <span className="text-sm font-normal text-zinc-50 light:text-slate-800 whitespace-nowrap">
          {t("chat_window.text_size_label")}
        </span>
        <CaretRight
          size={14}
          weight="bold"
          className="text-zinc-50 light:text-slate-800"
        />
      </div>
      {showSubmenu && (
        <TextSizeSubmenu
          selectedSize={selectedSize}
          onSizeChange={handleTextSizeChange}
          placement={isMobile ? "below" : "left"}
        />
      )}
    </div>
  );
}

function TextSizeSubmenu({ selectedSize, onSizeChange, placement = "left" }) {
  const { t } = useTranslation();
  const textSizes = getTextSizes(t);

  if (placement === "below") {
    return (
      <div
        className="absolute left-0 right-0 top-full mt-1 z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-800 light:bg-slate-50 border border-zinc-700 light:border-slate-300 rounded-lg p-3.5 flex flex-col gap-1.5 shadow-lg">
          {textSizes.map(({ key, label }) => (
            <div
              key={key}
              onClick={() => onSizeChange(key)}
              className={`px-2 py-1 rounded cursor-pointer text-sm font-normal text-white light:text-slate-800 whitespace-nowrap ${
                selectedSize === key
                  ? "bg-zinc-700 light:bg-slate-200"
                  : "hover:bg-zinc-700/50 light:hover:bg-slate-100"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute right-full top-0 -mr-2 flex items-stretch"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Invisible bridge: keeps hover path inside wrapper (no flicker). */}
      <div className="w-3 shrink-0" aria-hidden="true" />
      <div className="bg-zinc-800 light:bg-slate-50 border border-zinc-700 light:border-slate-300 rounded-lg p-3.5 w-[132px] flex flex-col gap-1.5 shadow-lg">
        {textSizes.map(({ key, label }) => (
          <div
            key={key}
            onClick={() => onSizeChange(key)}
            className={`px-2 py-1 rounded cursor-pointer text-sm font-normal text-white light:text-slate-800 whitespace-nowrap ${
              selectedSize === key
                ? "bg-zinc-700 light:bg-slate-200"
                : "hover:bg-zinc-700/50 light:hover:bg-slate-100"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
