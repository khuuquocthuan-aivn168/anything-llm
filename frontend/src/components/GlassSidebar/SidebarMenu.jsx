import React from "react";
import cn from "@/utils/cn";

export default function SidebarMenu({ children, className = "" }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth",
        "overscroll-contain [scrollbar-gutter:stable]",
        "[&::-webkit-scrollbar]:w-1",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-200/60",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        className
      )}
      tabIndex={-1}
    >
      <div className="flex flex-col gap-3 pb-4">{children}</div>
    </div>
  );
}
