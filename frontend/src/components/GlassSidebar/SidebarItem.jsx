import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import cn from "@/utils/cn";
import { useGlassSidebar } from "./GlassSidebarContext";

export const GLASS_SIDEBAR_ITEM_TOOLTIP_ID = "glass-sidebar-item-tooltip";

const itemBaseClasses = cn(
  "group relative flex h-12 w-full items-center gap-3 rounded-sidebar-item",
  "px-4 py-3 text-sm font-medium leading-tight no-underline",
  "outline-none cursor-pointer appearance-none border-none bg-transparent",
  "transition-all duration-[250ms] ease-out",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF] focus-visible:outline-offset-2"
);

const itemIdleClasses = cn(
  "text-sidebar-text",
  "hover:translate-x-1 hover:scale-[1.02] hover:bg-white/55 active:scale-[0.98]"
);

const itemActiveClasses = cn(
  "bg-sidebar-item-active text-white shadow-sidebar-item-active",
  "hover:translate-x-1 hover:scale-[1.02] active:scale-[0.98]"
);

const iconWrapClasses = (active, isChild) =>
  cn(
    "flex shrink-0 items-center justify-center transition-transform duration-[250ms]",
    isChild ? "h-7 w-7" : "h-5 w-5",
    !active && "text-sidebar-icon group-hover:scale-[1.08]",
    active && "text-white"
  );

const SidebarItem = forwardRef(function SidebarItem(
  {
    label,
    icon,
    href,
    active = false,
    isChild = false,
    hasChildren = false,
    expanded = false,
    badge = null,
    onClick,
    onToggle,
    className = "",
    disabled = false,
  },
  ref
) {
  const { collapsed } = useGlassSidebar();

  const classes = cn(
    itemBaseClasses,
    active ? itemActiveClasses : itemIdleClasses,
    isChild && "ml-2 h-10 w-[calc(100%-0.5rem)] text-[13px] font-medium",
    collapsed && "justify-center px-0 hover:translate-x-0",
    collapsed && isChild && "hidden",
    className
  );

  const content = (
    <>
      {icon ? (
        <span className={iconWrapClasses(active, isChild)} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      )}
      {!collapsed && badge ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            active
              ? "bg-white/20 text-white"
              : "bg-blue-50 text-[#4F8CFF]"
          )}
        >
          {badge}
        </span>
      ) : null}
      {!collapsed && hasChildren ? (
        <ChevronRight
          size={16}
          strokeWidth={2.5}
          className={cn(
            "shrink-0 transition-transform duration-[250ms]",
            active ? "text-white" : "text-sidebar-muted",
            expanded && "rotate-90"
          )}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const sharedProps = {
    ref,
    className: classes,
    "aria-label": label,
    "aria-current": active && !hasChildren ? "page" : undefined,
    "aria-expanded": hasChildren ? expanded : undefined,
    "data-tooltip-id": collapsed ? GLASS_SIDEBAR_ITEM_TOOLTIP_ID : undefined,
    "data-tooltip-content": collapsed ? label : undefined,
    "data-tooltip-place": "right",
  };

  const handleActivate = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (hasChildren) {
      e.preventDefault();
      onToggle?.();
      return;
    }
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (hasChildren) {
        e.preventDefault();
        onToggle?.();
      }
    }
    if (e.key === "ArrowRight" && hasChildren && !expanded) {
      e.preventDefault();
      onToggle?.();
    }
    if (e.key === "ArrowLeft" && hasChildren && expanded) {
      e.preventDefault();
      onToggle?.();
    }
  };

  if (href && !hasChildren) {
    return (
      <Link
        {...sharedProps}
        to={href}
        role="listitem"
        tabIndex={disabled ? -1 : 0}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...sharedProps}
      type="button"
      role="listitem"
      disabled={disabled}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      {content}
    </button>
  );
});

export default SidebarItem;
