import React from "react";
import cn from "@/utils/cn";
import { sidebarCardClasses } from "./shellClasses";
import { useGlassSidebar } from "./GlassSidebarContext";

export default function SidebarSection({
  title,
  children,
  className = "",
  "aria-label": ariaLabel,
}) {
  const { collapsed } = useGlassSidebar();

  return (
    <section
      className={cn(sidebarCardClasses, className)}
      aria-label={ariaLabel || title}
    >
      {title && !collapsed ? (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
          {title}
        </p>
      ) : null}
      <div className="flex flex-col gap-1" role="list">
        {children}
      </div>
    </section>
  );
}
