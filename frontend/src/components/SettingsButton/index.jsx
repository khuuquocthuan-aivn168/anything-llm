import cn from "@/utils/cn";
import useUser from "@/hooks/useUser";
import paths from "@/utils/paths";
import { ArrowUUpLeft, Wrench } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useMatch } from "react-router-dom";
import { useVisibility } from "@/VisibilityContext";

export default function SettingsButton({ className = "" }) {
  const isInSettings = !!useMatch("/settings/*");
  const { user } = useUser();
  const { isVisible } = useVisibility();

  if (user && user?.role === "default") return null;
  if (!isInSettings && !isVisible("settings-button")) return null;

  const buttonClassName = cn(
    "transition-all duration-300 p-2 rounded-full",
    "border border-white/[0.55] bg-white/90 text-[#4F8CFF] shadow-sm",
    "hover:bg-white hover:text-[#2F6BFF] hover:shadow-md",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]",
    className
  );

  if (isInSettings)
    return (
      <div className="flex w-fit">
        <Link
          to={paths.home()}
          className={buttonClassName}
          aria-label="Home"
          data-tooltip-id="footer-item"
          data-tooltip-content="Back to workspaces"
        >
          <ArrowUUpLeft className="h-5 w-5" weight="fill" />
        </Link>
      </div>
    );

  return (
    <div className="flex w-fit">
      <Link
        to={paths.settings.interface()}
        className={buttonClassName}
        aria-label="Settings"
        data-tooltip-id="footer-item"
        data-tooltip-content="Open settings"
      >
        <Wrench className="h-5 w-5" weight="fill" />
      </Link>
    </div>
  );
}
