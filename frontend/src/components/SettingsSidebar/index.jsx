import React, { useEffect, useState } from "react";
import paths from "@/utils/paths";
import useLogo from "@/hooks/useLogo";
import {
  List,
  Flask,
  Gear,
  UserCircleGear,
  PencilSimpleLine,
  Nut,
  Toolbox,
  Plugs,
} from "@phosphor-icons/react";
import AgentIcon from "@/media/animations/agent-static.png";
import useUser from "@/hooks/useUser";
import useMobile from "@/hooks/useMobile";
import Footer from "../Footer";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import showToast from "@/utils/toast";
import System from "@/models/system";
import Option from "./MenuOption";
import { CanViewChatHistoryProvider } from "../CanViewChatHistory";
import useAppVersion from "@/hooks/useAppVersion";
import { useVisibility } from "@/VisibilityContext";
import GlassSidebar, {
  SidebarSection,
  sidebarMobileOverlayClasses,
  sidebarMobileDrawerClasses,
} from "@/components/GlassSidebar";
import cn from "@/utils/cn";
import { Home, X } from "lucide-react";

export default function SettingsSidebar() {
  const { t } = useTranslation();
  const { logo } = useLogo();
  const { user } = useUser();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const { isVisible } = useVisibility();
  const isMobile = useMobile();
  const location = useLocation();

  useEffect(() => {
    setShowSidebar(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  const footerNode = isVisible("footer") ? <Footer /> : null;

  const metaLinks = (
    <div className="flex flex-col gap-1 px-1 pt-1">
      <SupportEmail />
      {isVisible("privacy") &&
        (!user?.hasOwnProperty("role") || user.role === "admin") && (
          <Link
            to={paths.settings.privacy()}
            className="text-sidebar-muted hover:text-[#4F8CFF] text-xs leading-[18px] px-3 transition-colors duration-250 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF] rounded"
          >
            {t("settings.privacy")}
          </Link>
        )}
      <AppVersion />
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-10 flex h-16 items-center justify-between border-b border-white/[0.55] bg-white/80 px-4 py-2 text-sidebar-muted shadow-sidebar-card backdrop-blur-xl">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex items-center justify-center rounded-xl p-2 text-sidebar-icon transition-all duration-250 hover:bg-white/70 hover:text-[#4F8CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F8CFF]"
            aria-label="Open sidebar"
          >
            <List className="h-6 w-6" />
          </button>
          <div className="flex items-center justify-center flex-grow">
            <img
              src={logo}
              alt="Logo"
              className="block mx-auto h-6 w-auto"
              style={{ maxHeight: "40px", objectFit: "contain" }}
            />
          </div>
          <div className="w-12" />
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
          <div className={cn(sidebarMobileDrawerClasses, "h-full")}>
            <GlassSidebar
              footer={footerNode}
              showToggle={false}
              header={null}
              persist={false}
              className="h-full !rounded-l-none !rounded-r-sidebar"
              ariaLabel={t("settings.title")}
            >
              <div className="mb-1 flex justify-end -mt-2">
                <div className="flex items-center gap-x-2">
                  <a
                    href={paths.home()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.55] bg-white/60 text-sidebar-icon transition-all duration-250 hover:scale-[1.02] hover:bg-white/90 hover:text-[#4F8CFF]"
                    aria-label="Home"
                  >
                    <Home size={16} strokeWidth={2} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowSidebar(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.55] bg-white/60 text-sidebar-icon transition-all duration-250 hover:scale-[1.02] hover:bg-white/90 hover:text-[#4F8CFF]"
                    aria-label="Close sidebar"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <SidebarSection title={t("settings.title")}>
                <SidebarOptions user={user} t={t} />
              </SidebarSection>
              {(isVisible("support-email") ||
                isVisible("privacy") ||
                isVisible("app-version")) && (
                <SidebarSection>{metaLinks}</SidebarSection>
              )}
            </GlassSidebar>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative shrink-0">
      <Link
        to={paths.home()}
        className="mx-[20.5px] my-[18px] flex max-w-[55%] shrink-0 items-center justify-start"
      >
        <img
          src={logo}
          alt="Logo"
          className="max-h-6 rounded object-contain"
        />
      </Link>
      <div className="relative m-4 mt-0 h-[calc(100%-76px)] shrink-0">
        <GlassSidebar
          footer={footerNode}
          showToggle={false}
          header={null}
          ariaLabel={t("settings.title")}
          className="h-full"
        >
        <SidebarSection title={t("settings.title")}>
          <SidebarOptions user={user} t={t} />
        </SidebarSection>
        {(isVisible("support-email") ||
          isVisible("privacy") ||
          isVisible("app-version")) && (
          <SidebarSection>{metaLinks}</SidebarSection>
        )}
        </GlassSidebar>
      </div>
    </div>
  );
}

function SupportEmail() {
  const { isVisible } = useVisibility();
  const [supportEmail, setSupportEmail] = useState(paths.mailToMintplex());
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSupportEmail = async () => {
      const supportEmail = await System.fetchSupportEmail();
      setSupportEmail(
        supportEmail?.email
          ? `mailto:${supportEmail.email}`
          : paths.mailToMintplex()
      );
    };
    fetchSupportEmail();
  }, []);

  if (!isVisible("support-email")) return null;
  if (supportEmail === paths.mailToMintplex()) return null;
  return (
    <Link
      to={supportEmail}
      className="text-sidebar-muted hover:text-[#4F8CFF] text-xs leading-[18px] px-3 transition-colors duration-250"
    >
      {t("settings.contact")}
    </Link>
  );
}

const SidebarOptions = ({ user = null, t }) => {
  const { isVisible } = useVisibility();
  const iconClass = "h-5 w-5 flex-shrink-0";

  return (
    <CanViewChatHistoryProvider>
      {({ viewable: canViewChatHistory }) => (
        <>
          <Option
            btnText={t("settings.ai-providers")}
            icon={<Gear className={iconClass} />}
            user={user}
            hidden={!isVisible("ai-providers")}
            childOptions={[
              {
                btnText: t("settings.llm"),
                href: paths.settings.llmPreference(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("ai-providers") || !isVisible("llm"),
              },
              {
                btnText: t("settings.vector-database"),
                href: paths.settings.vectorDatabase(),
                flex: true,
                roles: ["admin"],
                hidden:
                  !isVisible("ai-providers") || !isVisible("vector-database"),
              },
              {
                btnText: t("settings.embedder"),
                href: paths.settings.embedder.modelPreference(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("ai-providers") || !isVisible("embedder"),
              },
              {
                btnText: t("settings.text-splitting"),
                href: paths.settings.embedder.chunkingPreference(),
                flex: true,
                roles: ["admin"],
                hidden:
                  !isVisible("ai-providers") || !isVisible("text-splitting"),
              },
              {
                btnText: t("settings.voice-speech"),
                href: paths.settings.audioPreference(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("ai-providers") || !isVisible("voice-speech"),
              },
              {
                btnText: t("settings.transcription"),
                href: paths.settings.transcriptionPreference(),
                flex: true,
                roles: ["admin"],
                hidden:
                  !isVisible("ai-providers") || !isVisible("transcription"),
              },
              {
                btnText: t("settings.model-router"),
                href: paths.settings.modelRouters(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("ai-providers") || !isVisible("model-router"),
              },
            ]}
          />
          <Option
            btnText={t("settings.admin")}
            icon={<UserCircleGear className={iconClass} />}
            user={user}
            hidden={!isVisible("admin")}
            childOptions={[
              {
                btnText: t("settings.users"),
                href: paths.settings.users(),
                roles: ["admin", "manager"],
                hidden: !isVisible("admin") || !isVisible("users"),
              },
              {
                btnText: t("settings.workspaces"),
                href: paths.settings.workspaces(),
                roles: ["admin", "manager"],
                hidden: !isVisible("admin") || !isVisible("workspaces"),
              },
              {
                hidden:
                  !canViewChatHistory ||
                  !isVisible("admin") ||
                  !isVisible("workspace-chats"),
                btnText: t("settings.workspace-chats"),
                href: paths.settings.chats(),
                flex: true,
                roles: ["admin", "manager"],
              },
              {
                btnText: t("settings.invites"),
                href: paths.settings.invites(),
                roles: ["admin", "manager"],
                hidden: !isVisible("admin") || !isVisible("invites"),
              },
              {
                btnText: t("settings.default-system-prompt"),
                href: paths.settings.defaultSystemPrompt(),
                flex: true,
                roles: ["admin"],
                hidden:
                  !isVisible("admin") || !isVisible("default-system-prompt"),
              },
            ]}
          />
          <Option
            btnText={t("settings.agent-skills")}
            icon={
              <img
                src={AgentIcon}
                alt=""
                className="h-5 w-5 flex-shrink-0"
              />
            }
            href={paths.settings.agentSkills()}
            user={user}
            flex={true}
            roles={["admin", "manager", "default"]}
            hidden={!isVisible("agent-skills")}
          />
          <Option
            btnText="Multi-Agents"
            icon={
              <img
                src={AgentIcon}
                alt=""
                className="h-5 w-5 flex-shrink-0"
              />
            }
            href={paths.agents.subAgents()}
            user={user}
            flex={true}
            roles={["admin", "manager", "default"]}
            hidden={!isVisible("agent-skills")}
          />
          <Option
            btnText={t("settings.customization")}
            icon={<PencilSimpleLine className={iconClass} />}
            user={user}
            hidden={!isVisible("customization")}
            childOptions={[
              {
                btnText: t("settings.interface"),
                href: paths.settings.interface(),
                flex: true,
                roles: ["admin", "manager"],
                hidden:
                  !isVisible("customization") || !isVisible("interface"),
              },
              {
                btnText: t("settings.branding"),
                href: paths.settings.branding(),
                flex: true,
                roles: ["admin", "manager"],
                hidden: !isVisible("customization") || !isVisible("branding"),
              },
              {
                btnText: t("settings.chat"),
                href: paths.settings.chat(),
                flex: true,
                roles: ["admin", "manager"],
                hidden: !isVisible("customization") || !isVisible("chat"),
              },
            ]}
          />
          <Option
            btnText={t("settings.channels")}
            icon={<Plugs className={iconClass} />}
            user={user}
            hidden={!isVisible("channels")}
            childOptions={[
              {
                btnText: t("settings.available-channels.telegram"),
                href: paths.settings.telegram(),
                flex: true,
                hidden:
                  !!user ||
                  !isVisible("channels") ||
                  !isVisible("available-channels-telegram"),
              },
            ]}
          />
          <Option
            btnText={t("settings.tools")}
            icon={<Toolbox className={iconClass} />}
            user={user}
            hidden={!isVisible("tools")}
            childOptions={[
              {
                hidden:
                  !canViewChatHistory ||
                  !isVisible("tools") ||
                  !isVisible("embeds"),
                btnText: t("settings.embeds"),
                href: paths.settings.embedChatWidgets(),
                flex: true,
                roles: ["admin"],
              },
              {
                btnText: t("settings.event-logs"),
                href: paths.settings.logs(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("tools") || !isVisible("event-logs"),
              },
              {
                btnText: t("settings.scheduled-jobs"),
                href: paths.settings.scheduledJobs(),
                flex: true,
                hidden:
                  !!user ||
                  !isVisible("tools") ||
                  !isVisible("scheduled-jobs"),
              },
              {
                btnText: t("settings.api-keys"),
                href: paths.settings.apiKeys(),
                flex: true,
                roles: ["admin"],
                hidden: !isVisible("tools") || !isVisible("api-keys"),
              },
              {
                btnText: t("settings.system-prompt-variables"),
                href: paths.settings.systemPromptVariables(),
                flex: true,
                roles: ["admin"],
                hidden:
                  !isVisible("tools") ||
                  !isVisible("system-prompt-variables"),
              },
              {
                btnText: t("settings.browser-extension"),
                href: paths.settings.browserExtension(),
                flex: true,
                roles: ["admin", "manager"],
                hidden:
                  !isVisible("tools") || !isVisible("browser-extension"),
              },
            ]}
          />
          <Option
            btnText={t("settings.security")}
            icon={<Nut className={iconClass} />}
            href={paths.settings.security()}
            user={user}
            flex={true}
            roles={["admin", "manager"]}
            hidden={user?.role}
          />
          <Option
            btnText={t("settings.experimental-features")}
            icon={<Flask className={iconClass} />}
            href={paths.settings.experimental()}
            user={user}
            flex={true}
            roles={["admin"]}
            hidden={!isVisible("experimental-features")}
          />
        </>
      )}
    </CanViewChatHistoryProvider>
  );
};

function HoldToReveal({ children, holdForMs = 3_000 }) {
  let timeout = null;
  const [showing, setShowing] = useState(
    window.localStorage.getItem(
      "anythingllm_experimental_feature_preview_unlocked"
    )
  );

  useEffect(() => {
    const onPress = (e) => {
      if (!["Control", "Meta"].includes(e.key) || timeout !== null) return;
      timeout = setTimeout(() => {
        setShowing(true);
        showToast("Experimental feature previews unlocked!");
        window.localStorage.setItem(
          "anythingllm_experimental_feature_preview_unlocked",
          "enabled"
        );
        window.removeEventListener("keypress", onPress);
        window.removeEventListener("keyup", onRelease);
        clearTimeout(timeout);
      }, holdForMs);
    };
    const onRelease = (e) => {
      if (!["Control", "Meta"].includes(e.key)) return;
      if (showing) {
        window.removeEventListener("keypress", onPress);
        window.removeEventListener("keyup", onRelease);
        clearTimeout(timeout);
        return;
      }
      clearTimeout(timeout);
    };

    if (!showing) {
      window.addEventListener("keydown", onPress);
      window.addEventListener("keyup", onRelease);
    }
    return () => {
      window.removeEventListener("keydown", onPress);
      window.removeEventListener("keyup", onRelease);
    };
  }, []);

  if (!showing) return null;
  return children;
}

function AppVersion() {
  const { isVisible } = useVisibility();
  const { version, isLoading } = useAppVersion();
  if (!isVisible("app-version")) return null;
  if (isLoading) return null;
  return (
    <div className="text-sidebar-muted opacity-70 text-xs px-3">
      v{version}
    </div>
  );
}
