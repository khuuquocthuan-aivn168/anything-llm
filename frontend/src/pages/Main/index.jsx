import React from "react";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import Home from "./Home";
import useMobile from "@/hooks/useMobile";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";

export default function Main() {
  const { loading, requiresAuth, mode } = usePasswordModal();
  const isMobile = useMobile();

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false)
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 light:bg-slate-50 flex">
      {!isMobile ? <Sidebar /> : <SidebarMobileHeader />}
      <Home />
    </div>
  );
}
