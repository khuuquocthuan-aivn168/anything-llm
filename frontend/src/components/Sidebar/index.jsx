import React, { useEffect, useRef, useState } from "react";
import { List, Plus, X } from "@phosphor-icons/react";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import SettingsButton from "../SettingsButton";
import TransferDocButton from "../TransferDocButton";
import { Link, useLocation } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { useSidebarToggle, ToggleSidebarButton } from "./SidebarToggle";
import SearchBox from "./SearchBox";
import { Tooltip } from "react-tooltip";
import { createPortal } from "react-dom";
import { useVisibility } from "@/VisibilityContext";
import UserButton from "@/components/UserMenu/UserButton";
import cn from "@/utils/cn";
import {
  SidebarMenu,
  SidebarFooter,
  sidebarWorkspaceShellClasses,
  sidebarWorkspaceCardClasses,
  sidebarMobileOverlayClasses,
  sidebarMobileDrawerClasses,
  sidebarFooterStripClasses,
} from "@/components/GlassSidebar";

export default function Sidebar() {
  const { user } = useUser();
  const { isVisible } = useVisibility();
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();

  return (
    <>
      <div
        style={{
          width: showSidebar ? "292px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="sidebar-bg-image relative h-full shrink-0 transition-all duration-500"
      >
        {canToggleSidebar && (
          <ToggleSidebarButton
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
          />
        )}
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="my-[18px] flex w-full shrink-0 justify-center">
            <div className="flex w-[250px] min-w-[250px]">
              <Link to={paths.home()} aria-label="Home">
                <img
                  src={logo}
                  alt="Logo"
                  className={cn(
                    "max-h-6 rounded object-contain transition-opacity duration-500",
                    showSidebar ? "opacity-100" : "opacity-0"
                  )}
                />
              </Link>
            </div>
          </div>
          <nav
            ref={sidebarRef}
            className={cn(
              sidebarWorkspaceShellClasses,
              "relative mx-4 mb-4 mt-0 flex min-h-0 flex-1 flex-col p-[10px]"
            )}
            aria-label="Workspace sidebar"
          >
            <SidebarMenu className="min-h-0 flex-1 pt-[10px]">
              <div className="flex min-w-[235px] flex-col gap-y-[14px]">
                {isVisible("search-box") && (
                  <section className={sidebarWorkspaceCardClasses}>
                    <SearchBox user={user} showNewWsModal={showNewWsModal} />
                  </section>
                )}
                {isVisible("active-workspaces") && (
                  <section
                    className={sidebarWorkspaceCardClasses}
                    aria-label="Workspaces"
                  >
                    <ActiveWorkspaces />
                  </section>
                )}
              </div>
            </SidebarMenu>

            <SidebarFooter className="relative z-10 shrink-0 px-1 pb-1 pt-2">
              <Footer />
            </SidebarFooter>
          </nav>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
      <WorkspaceAndThreadTooltips />
    </>
  );
}

export function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();
  const { isVisible } = useVisibility();
  const location = useLocation();

  useEffect(() => {
    setShowSidebar(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => setShowBgOverlay(true), 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  const logoNode = (
    <img
      src={logo}
      alt="Logo"
      className="max-h-10 w-auto object-contain"
    />
  );

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex h-16 items-center justify-between border-b border-white/[0.55] bg-white/80 px-4 py-2 text-sidebar-muted shadow-sidebar-card backdrop-blur-xl"
      >
        <div className="flex w-[76px] shrink-0 items-center justify-start">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex items-center justify-center rounded-xl p-2 text-sidebar-icon transition-all duration-250 hover:bg-white/70 hover:text-[#4F8CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
            aria-label="Open sidebar"
          >
            <List className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-grow items-center justify-center">
          <img
            src={logo}
            alt="Logo"
            className="mx-auto block h-6 w-auto max-h-10 object-contain"
          />
        </div>
        <div className="flex w-[76px] shrink-0 items-center justify-end">
          <div className="flex items-center gap-2">
            <div id="mobile-header-actions" className="flex items-center" />
            <UserButton placement="inline" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed left-0 top-0 z-99 h-screen w-screen transition-transform duration-500 ease-out",
          showSidebar ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={sidebarMobileOverlayClasses(showBgOverlay && showSidebar)}
          onClick={() => setShowSidebar(false)}
          aria-hidden={!showSidebar || !showBgOverlay}
        />
        <div
          ref={sidebarRef}
          className={cn(
            sidebarMobileDrawerClasses,
            sidebarWorkspaceShellClasses,
            "sidebar-bg-image !rounded-l-none !rounded-r-[26px] p-[18px]"
          )}
          aria-label="Workspace sidebar"
        >
          <div className="flex h-full w-full min-w-[235px] flex-col overflow-x-hidden">
            <div className="mb-4 flex w-full items-center justify-between gap-x-4">
              <div className="flex w-[60%] shrink items-center justify-start">
                {logoNode}
              </div>
              <div className="flex shrink-0 items-center gap-x-3 text-sidebar-icon">
                {(!user || user?.role !== "default") && <TransferDocButton />}
                {(!user || user?.role !== "default") && <SettingsButton />}
                <button
                  type="button"
                  onClick={() => setShowSidebar(false)}
                  className="rounded-lg p-1 text-sidebar-icon transition-colors duration-250 hover:bg-white/60 hover:text-sidebar-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
                  aria-label="Close sidebar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <SidebarMenu className="flex-1">
              {isVisible("new-workspace-button") && (
                <NewWorkspaceButton user={user} showNewWsModal={showNewWsModal} />
              )}
              {isVisible("active-workspaces") && (
                <section
                  className={sidebarWorkspaceCardClasses}
                  aria-label="Workspaces"
                >
                  <ActiveWorkspaces />
                </section>
              )}
            </SidebarMenu>

            <footer className={cn("mt-auto pt-2 pb-6", sidebarFooterStripClasses)}>
              <Footer hideActionButtons />
            </footer>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
}

function NewWorkspaceButton({ user, showNewWsModal }) {
  const { t } = useTranslation();
  if (!!user && user?.role === "default") return null;

  return (
    <div className="flex items-center justify-between gap-x-2">
      <button
        onClick={showNewWsModal}
        className={cn(
          "flex h-11 w-full max-w-[75%] flex-grow items-center justify-center gap-x-2 rounded-lg",
          "border border-white/[0.55] bg-white/80 px-4 py-[5px]",
          "text-sm font-semibold text-sidebar-text",
          "transition-all duration-200 hover:bg-white/90 hover:translate-x-1",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
        )}
      >
        <Plus className="h-5 w-5 text-[#4F8CFF]" />
        <span>{t("new-workspace.title")}</span>
      </button>
    </div>
  );
}

function WorkspaceAndThreadTooltips() {
  return createPortal(
    <React.Fragment>
      <Tooltip
        id="workspace-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="workspace-thread-name"
        place="right"
        delayShow={800}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="upload-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
      <Tooltip
        id="gear-workspace"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </React.Fragment>,
    document.body
  );
}
