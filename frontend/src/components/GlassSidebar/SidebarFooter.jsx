import React from "react";
import cn from "@/utils/cn";
import { sidebarFooterStripClasses } from "./shellClasses";

export default function SidebarFooter({ children, className = "" }) {
  if (!children) return null;

  return (
    <footer
      className={cn(
        "mt-auto shrink-0 pt-3",
        sidebarFooterStripClasses,
        "rounded-b-sidebar",
        className
      )}
    >
      {children}
    </footer>
  );
}
