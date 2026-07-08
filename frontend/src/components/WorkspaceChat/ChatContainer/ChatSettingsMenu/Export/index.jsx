import { useEffect, useRef, useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import moment from "moment";
import useMobile from "@/hooks/useMobile";

const EXPORT_FORMATS = [
  { key: "pdf", label: "PDF", ext: "pdf" },
  { key: "markdown", label: "Markdown", ext: "md" },
  { key: "plaintext", label: "Plain Text", ext: "txt" },
  { key: "json", label: "JSON", ext: "json" },
  { key: "html", label: "HTML", ext: "html" },
];

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

export default function ExportRow({
  history = [],
  workspace = null,
  threadSlug = null,
  onClose,
}) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const canHover = useHoverCapable();
  const useHoverSubmenu = canHover && !isMobile;
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const wrapperRef = useRef(null);

  async function handleExport(format) {
    if (exporting || !workspace?.slug) return;
    setExporting(true);
    const blob = await Workspace.exportChatsToType(
      workspace.slug,
      threadSlug,
      format.key
    );
    if (blob) {
      const stamp = moment().format("YYYY-MM-DD HH:mm:ss");
      saveAs(blob, `AnythingLLM Export - ${stamp}.${format.ext}`);
    } else {
      showToast("Failed to export chat.", "error");
    }
    setExporting(false);
    setShowSubmenu(false);
    onClose();
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

  if (history.length === 0) return null;
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
          {exporting ? t("chat_window.exporting") : t("Xuất cuộc trò chuyện")}
        </span>
        <CaretRight
          size={14}
          weight="bold"
          className="text-zinc-50 light:text-slate-800"
        />
      </div>
      {showSubmenu && (
        <ExportSubmenu
          onSelect={handleExport}
          exporting={exporting}
          placement={isMobile ? "below" : "left"}
        />
      )}
    </div>
  );
}

function ExportSubmenu({ onSelect, exporting, placement = "left" }) {
  if (placement === "below") {
    return (
      <div
        className="absolute left-0 right-0 top-full mt-1 z-10"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-800 light:bg-slate-50 border border-zinc-700 light:border-slate-300 rounded-lg p-3.5 flex flex-col gap-1.5 shadow-lg">
          {EXPORT_FORMATS.map((format) => (
            <div
              key={format.key}
              onClick={() => !exporting && onSelect(format)}
              className={`px-2 py-1 rounded text-sm font-normal text-white light:text-slate-800 whitespace-nowrap ${
                exporting
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-zinc-700/50 light:hover:bg-slate-100"
              }`}
            >
              {format.label}
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
      <div className="w-3 shrink-0" aria-hidden="true" />
      <div className="bg-zinc-800 light:bg-slate-50 border border-zinc-700 light:border-slate-300 rounded-lg p-3.5 w-[130px] flex flex-col gap-1.5 shadow-lg">
        {EXPORT_FORMATS.map((format) => (
          <div
            key={format.key}
            onClick={() => !exporting && onSelect(format)}
            className={`px-2 py-1 rounded text-sm font-normal text-white light:text-slate-800 ${
              exporting
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-zinc-700/50 light:hover:bg-slate-100"
            }`}
          >
            {format.label}
          </div>
        ))}
      </div>
    </div>
  );
}
