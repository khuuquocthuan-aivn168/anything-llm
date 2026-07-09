import React from "react";
import { Tooltip } from "react-tooltip";
import cn from "@/utils/cn";
import {
  GlassSidebarProvider,
  useGlassSidebar,
} from "./GlassSidebarContext";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarFooter from "./SidebarFooter";
import SidebarSection from "./SidebarSection";
import SidebarItem, {
  GLASS_SIDEBAR_ITEM_TOOLTIP_ID,
} from "./SidebarItem";
import { sidebarShellClasses } from "./shellClasses";

export {
  GlassSidebarProvider,
  useGlassSidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarItem,
  SidebarSection,
  SidebarFooter,
  GLASS_SIDEBAR_ITEM_TOOLTIP_ID,
  sidebarShellClasses,
};
export {
  sidebarCardClasses,
  sidebarWorkspaceShellClasses,
  sidebarWorkspaceCardClasses,
  sidebarMobileOverlayClasses,
  sidebarMobileDrawerClasses,
  sidebarFooterStripClasses,
  sidebarFooterActionButtonClasses,
} from "./shellClasses";

/** @deprecated Use SidebarItem */
export { default as SidebarMenuItem } from "./SidebarItem";

/**
 * Premium glassmorphism sidebar — Dribbble-inspired SaaS dashboard shell.
 */
export default function GlassSidebar({
  logo,
  footer,
  children,
  className = "",
  ariaLabel = "Sidebar navigation",
  showToggle = true,
  defaultCollapsed = false,
  persist = true,
  header = null,
}) {
  return (
    <GlassSidebarProvider defaultCollapsed={defaultCollapsed} persist={persist}>
      <GlassSidebarInner
        logo={logo}
        footer={footer}
        header={header}
        className={className}
        ariaLabel={ariaLabel}
        showToggle={showToggle}
      >
        {children}
      </GlassSidebarInner>
    </GlassSidebarProvider>
  );
}

function GlassSidebarInner({
  logo,
  footer,
  header,
  children,
  className,
  ariaLabel,
  showToggle,
}) {
  const { collapsed } = useGlassSidebar();

  return (
    <nav
      className={cn(sidebarShellClasses(collapsed), className)}
      aria-label={ariaLabel}
      aria-expanded={!collapsed}
    >
      {header === undefined ? (
        <SidebarHeader logo={logo} showToggle={showToggle} />
      ) : (
        header
      )}

      <SidebarMenu>{children}</SidebarMenu>

      <SidebarFooter>{footer}</SidebarFooter>

      {collapsed ? (
        <Tooltip
          id={GLASS_SIDEBAR_ITEM_TOOLTIP_ID}
          place="right"
          delayShow={200}
          className="tooltip !text-xs z-99"
        />
      ) : null}
    </nav>
  );
}
