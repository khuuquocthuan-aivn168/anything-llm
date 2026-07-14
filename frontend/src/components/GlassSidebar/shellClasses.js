import cn from "@/utils/cn";

/** Premium glass sidebar shell — layered gradients + depth */
export const sidebarShellClasses = (collapsed = false) =>
  cn(
    "relative flex flex-col h-full overflow-hidden font-sidebar text-sidebar-text",
    "bg-sidebar-premium backdrop-blur-sidebar",
    "border border-white/[0.55] shadow-sidebar-shell rounded-sidebar",
    "transition-all duration-300 ease-out",
    collapsed
      ? "w-sidebar-collapsed min-w-sidebar-collapsed px-2 py-3"
      : "w-full min-w-0 px-4 py-4 md:w-sidebar-desktop md:min-w-sidebar-tablet"
  );

/** Compact shell for main workspace sidebar (292px column) */
export const sidebarWorkspaceShellClasses = cn(
  "relative flex flex-col h-full w-full min-w-0 overflow-hidden font-sidebar text-sidebar-text",
  "bg-white/15 backdrop-blur-[6px]",
  "border border-white/[0.4] shadow-sidebar-shell rounded-[16px]"
);

/** Compact section card inside workspace sidebar */
export const sidebarWorkspaceCardClasses = cn(
  "w-full min-w-0 rounded-[16px] border border-white/[0.4]",
  "bg-white/40 backdrop-blur-[8px] shadow-sidebar-card",
  "p-[10px]"
);

/** Floating section card (Settings sidebar) */
export const sidebarCardClasses = cn(
  "rounded-sidebar-card border border-white/[0.55]",
  "bg-white/[0.78] backdrop-blur-sidebar-card shadow-sidebar-card",
  "p-3 animate-sidebar-card-in",
  "transition-all duration-250 ease-out",
  "hover:-translate-y-px hover:shadow-[0_14px_40px_rgba(30,41,59,0.07)]"
);

/** Mobile backdrop behind drawer */
export const sidebarMobileOverlayClasses = (visible) =>
  cn(
    "absolute inset-0 z-[1] bg-slate-900/35 backdrop-blur-[2px]",
    "transition-opacity duration-300 ease-out",
    visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  );

/** Mobile drawer panel */
export const sidebarMobileDrawerClasses = cn(
  "relative z-[2] h-full w-[min(80vw,320px)] max-w-sidebar-drawer"
);

/** Balanced inner padding for workspace sidebar content */
export const sidebarWorkspaceInnerPaddingClasses = "px-2.5 py-2.5";

/** Footer glass strip */
export const sidebarFooterStripClasses = cn(
  "bg-white/70 backdrop-blur-md border-t border-white/[0.45]"
);

/** Round action buttons at sidebar bottom (Settings, Upload, etc.) */
export const sidebarFooterActionButtonClasses = cn(
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
  "border border-white/[0.55] bg-white/90 text-[#4F8CFF] shadow-sm",
  "transition-all duration-200",
  "hover:bg-white hover:text-[#2F6BFF] hover:shadow-md",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
);

/** Glass control — matches sidebar hide/show toggle */
export const sidebarGlassControlClasses = cn(
  "inline-flex items-center justify-center",
  "rounded-xl border border-white/[0.55] bg-white/[0.78] shadow-sidebar-card",
  "outline-none transition-all duration-250",
  "hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
);

/** Logo box — same glass style as sidebar toggle */
export const sidebarLogoBoxClasses = cn(
  sidebarGlassControlClasses,
  "px-3 py-2"
);
