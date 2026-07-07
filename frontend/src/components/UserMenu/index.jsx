import UserButton from "./UserButton";
import useMobile from "@/hooks/useMobile";

export default function UserMenu({ children }) {
  const isMobile = useMobile();
  return (
    <div className="w-auto h-auto">
      {/* On <1024px, the user menu lives in SidebarMobileHeader. */}
      {!isMobile && <UserButton />}
      {children}
    </div>
  );
}
