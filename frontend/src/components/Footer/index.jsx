import System from "@/models/system";
import paths from "@/utils/paths";
import {
  BookOpen,
  DiscordLogo,
  GithubLogo,
  Briefcase,
  Envelope,
  Globe,
  HouseLine,
  Info,
  LinkSimple,
} from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import SettingsButton from "../SettingsButton";
import TransferDocButton from "../TransferDocButton";
import { Tooltip } from "react-tooltip";
import { Link } from "react-router-dom";
import { useVisibility } from "@/VisibilityContext";
import { sidebarFooterActionButtonClasses } from "@/components/GlassSidebar";
import cn from "@/utils/cn";

export const MAX_ICONS = 3;
export const ICON_COMPONENTS = {
  BookOpen: BookOpen,
  DiscordLogo: DiscordLogo,
  GithubLogo: GithubLogo,
  Envelope: Envelope,
  LinkSimple: LinkSimple,
  HouseLine: HouseLine,
  Globe: Globe,
  Briefcase: Briefcase,
  Info: Info,
};

export default function Footer({ hideActionButtons = false }) {
  const { isVisible } = useVisibility();
  const [footerData, setFooterData] = useState(false);

  useEffect(() => {
    async function fetchFooterData() {
      const { footerData } = await System.fetchCustomFooterIcons();
      setFooterData(footerData);
    }
    fetchFooterData();
  }, []);

  // wait for some kind of non-false response from footer data first
  // to prevent pop-in — but always show action buttons at the bottom.
  const showCustomIcons =
    footerData !== false &&
    isVisible("footer-custom-icons") &&
    Array.isArray(footerData) &&
    footerData.length > 0;

  return (
    <div className="relative z-10 mb-1 flex justify-center py-1">
      <div className="flex items-center gap-4">
        {showCustomIcons &&
          footerData.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                sidebarFooterActionButtonClasses,
                "h-fit w-fit p-2"
              )}
            >
              {React.createElement(
                ICON_COMPONENTS?.[item.icon] ?? ICON_COMPONENTS.Info,
                {
                  weight: "fill",
                  className: "h-5 w-5",
                }
              )}
            </a>
          ))}
        {!hideActionButtons && (
          <>
            <TransferDocButton className={sidebarFooterActionButtonClasses} />
            <SettingsButton className={sidebarFooterActionButtonClasses} />
          </>
        )}
      </div>
      <Tooltip
        id="footer-item"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </div>
  );
}
