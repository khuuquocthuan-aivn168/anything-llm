import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "react-tooltip";
import cn from "@/utils/cn";
import { useGlassSidebar } from "./GlassSidebarContext";

/** Logo row + optional collapse toggle (Settings sidebar). */
export default function SidebarHeader({
  logo = null,
  showToggle = true,
  className = "",
}) {
  const { collapsed, toggle } = useGlassSidebar();
  const isMac =
    typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");
  const shortcut = isMac ? "⌘ + Shift + B" : "Ctrl + Shift + B";

  if (!logo && !showToggle) return null;

  return (
    <header
      className={cn(
        "mb-4 flex shrink-0 items-center gap-3",
        collapsed ? "flex-col justify-center" : "justify-between",
        className
      )}
    >
      {logo && !collapsed ? (
        <div className="min-w-0 flex-1 overflow-hidden animate-sidebar-slide [&_img]:max-h-7 [&_img]:w-auto [&_img]:object-contain">
          {logo}
        </div>
      ) : null}

      {showToggle ? (
        <>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "border border-white/[0.55] bg-white/60 text-sidebar-icon",
              "transition-all duration-250 ease-out",
              "hover:scale-[1.02] active:scale-[0.98]",
              "hover:bg-white/90 hover:text-[#4F8CFF]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF] focus-visible:outline-offset-2",
              collapsed && "mx-auto"
            )}
            aria-label={
              collapsed
                ? `Expand sidebar (${shortcut})`
                : `Collapse sidebar (${shortcut})`
            }
            data-tooltip-id="glass-sidebar-toggle"
            data-tooltip-content={
              collapsed
                ? `Expand sidebar (${shortcut})`
                : `Collapse sidebar (${shortcut})`
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={2} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={2} />
            )}
          </button>
          <Tooltip
            id="glass-sidebar-toggle"
            place="right"
            delayShow={250}
            className="tooltip !text-xs z-99"
          />
        </>
      ) : null}
    </header>
  );
}
