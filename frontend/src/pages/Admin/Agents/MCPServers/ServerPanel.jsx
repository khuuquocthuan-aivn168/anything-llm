import React, { useState, useEffect, useRef } from "react";
import showToast from "@/utils/toast";
import { CaretDown, Gear, Warning } from "@phosphor-icons/react";
import MCPLogo from "@/media/agents/mcp-logo.svg";
import { titleCase } from "text-case";
import MCPServers from "@/models/mcpServers";
import { SimpleToggleSwitch } from "@/components/lib/Toggle";
import { useTranslation, Trans } from "react-i18next";

const PANEL_STYLES = `
  @keyframes mcpSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .mcp-animate-slide-in {
    animation: mcpSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes mcpPulseWarning {
    0%, 100% { border-color: rgba(234, 179, 8, 0.2); }
    50% { border-color: rgba(234, 179, 8, 0.5); }
  }
  .mcp-animate-pulse-warning {
    animation: mcpPulseWarning 2.5s infinite ease-in-out;
  }
`;

function ManageServerMenu({ server, toggleServer, onDelete }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(server.running);
  const menuRef = useRef(null);

  async function deleteServer() {
    if (
      !window.confirm(
        "Are you sure you want to delete this MCP server? It will be removed from your config file and you will need to add it back manually."
      )
    )
      return;
    const { success, error } = await MCPServers.deleteServer(server.name);
    if (success) {
      showToast("MCP server deleted successfully.", "success");
      onDelete(server.name);
    } else {
      showToast(error || "Failed to delete MCP server.", "error");
    }
  }

  async function handleToggleServer() {
    if (
      !window.confirm(
        running
          ? "Are you sure you want to stop this MCP server? It will be started automatically when you next start the server."
          : "Are you sure you want to start this MCP server? It will be started automatically when you next start the server."
      )
    )
      return;

    const { success, error } = await MCPServers.toggleServer(server.name);
    if (success) {
      const newState = !running;
      setRunning(newState);
      toggleServer(server.name);
      showToast(
        `MCP server ${server.name} ${newState ? "started" : "stopped"} successfully.`,
        "success",
        { clear: true }
      );
    } else {
      showToast(error || "Failed to toggle MCP server.", "error", {
        clear: true,
      });
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-theme-text-secondary hover:text-theme-text-primary hover:bg-zinc-800/20 transition-all duration-300"
      >
        <Gear className="h-5 w-5" weight="bold" />
      </button>
      {open && (
        <div className="absolute w-[160px] top-1 left-7 mt-1 border border-zinc-800/30 rounded-xl bg-theme-action-menu-bg flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-white z-99 md:z-10 overflow-hidden">
          <button
            type="button"
            onClick={handleToggleServer}
            className="border-none flex items-center gap-x-2 hover:bg-zinc-800/30 py-2.5 px-3 transition-all duration-200 w-full text-left"
          >
            <span className="text-sm font-medium">
              {running
                ? t("agent.mcp.stop-server")
                : t("agent.mcp.start-server")}
            </span>
          </button>
          <div className="h-[1px] bg-zinc-800/20 mx-2" />
          <button
            type="button"
            onClick={deleteServer}
            className="border-none flex items-center gap-x-2 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 py-2.5 px-3 transition-all duration-200 w-full text-left"
          >
            <span className="text-sm font-medium">{t("agent.mcp.delete-server")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function ServerPanel({
  server,
  toggleServer,
  onDelete,
  onToggleTool,
}) {
  const { t } = useTranslation();
  const suppressedTools = server.config?.anythingllm?.suppressedTools || [];
  const enabledToolCount = server.tools.filter(
    (tool) => !suppressedTools.includes(tool.name)
  ).length;

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div className="p-3">
        <div className="mcp-animate-slide-in flex flex-col gap-y-6 max-w-[800px]">
          <ToolCountWarningBanner
            server={server}
            enabledToolCount={enabledToolCount}
          />

          {/* Header */}
          <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
            <div className="flex items-center gap-x-3">
              <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
                <img src={MCPLogo} className="w-6 h-6 light:invert" />
              </div>
              <label htmlFor="name" className="text-theme-text-primary text-base font-bold tracking-wide">
                {titleCase(server.name.replace(/[_-]/g, " "))}
              </label>
              {server.tools.length > 0 && (
                <span className="text-theme-text-secondary/60 text-xs font-medium bg-zinc-800/10 px-2.5 py-1 rounded-full">
                  {enabledToolCount}/{server.tools.length}{" "}
                  {t("agent.mcp.tools-enabled")}
                </span>
              )}
            </div>
            <ManageServerMenu
              key={server.name}
              server={server}
              toggleServer={toggleServer}
              onDelete={onDelete}
            />
          </div>

          <RenderServerConfig config={server.config} />
          <RenderServerStatus server={server} />
          <RenderServerTools
            serverName={server.name}
            tools={server.tools}
            suppressedTools={suppressedTools}
            onToggleTool={onToggleTool}
          />
        </div>
      </div>
    </>
  );
}

function ToolCountWarningBanner({ server, enabledToolCount }) {
  if (server.tools.length <= 10) return null;
  if (enabledToolCount <= 10) return null;

  return (
    <div className="mcp-animate-pulse-warning flex items-center gap-x-3 p-3 bg-yellow-500/5 border border-yellow-500/20 text-yellow-400/90 rounded-2xl backdrop-blur-xs shadow-inner">
      <div className="p-1 bg-yellow-500/10 rounded-lg">
        <Warning className="h-5 w-5 flex-shrink-0" weight="fill" />
      </div>
      <p className="text-xs font-semibold leading-relaxed">
        <Trans
          i18nKey={`agent.mcp.tool-count-warning`}
          values={{ count: enabledToolCount }}
          components={{ b: <b />, br: <br /> }}
        />
      </p>
    </div>
  );
}

function RenderServerConfig({ config = null }) {
  const { t } = useTranslation();
  if (!config) return null;
  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-theme-text-secondary/50 text-xxs font-bold uppercase tracking-widest pl-1">
        {t("agent.mcp.startup-command")}
      </p>
      <div className="bg-zinc-900/20 rounded-2xl p-4 border border-zinc-800/20 font-mono text-xs">
        <p className="text-theme-text-secondary text-left">
          <span className="font-bold text-theme-text-primary">{t("agent.mcp.command")}:</span>{" "}
          {config.command}
        </p>
        <p className="text-theme-text-secondary text-left mt-1">
          <span className="font-bold text-theme-text-primary">{t("agent.mcp.arguments")}:</span>{" "}
          {config.args ? config.args.join(" ") : t("common.none")}
        </p>
      </div>
    </div>
  );
}

function RenderServerStatus({ server }) {
  const { t } = useTranslation();
  if (server.running || !server.error) return null;
  return (
    <div className="flex flex-col gap-y-2">
      <p className="text-theme-text-secondary/50 text-xxs font-bold uppercase tracking-widest pl-1">
        {t("agent.mcp.not-running-warning")}
      </p>
      <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/20">
        <p className="text-red-400 text-sm font-mono">{server.error}</p>
      </div>
    </div>
  );
}

function RenderServerTools({
  serverName,
  tools = [],
  suppressedTools = [],
  onToggleTool,
}) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-col gap-y-3">
      <div className="h-[1px] bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-transparent w-full" />
      <div className="flex flex-col gap-y-2">
        {tools.map((tool) => (
          <ServerTool
            key={tool.name}
            serverName={serverName}
            tool={tool}
            enabled={!suppressedTools.includes(tool.name)}
            onToggle={onToggleTool}
          />
        ))}
      </div>
    </div>
  );
}

function ServerTool({ serverName, tool, enabled, onToggle }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex flex-col gap-y-2 px-4 py-3 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${
        enabled
          ? "border-zinc-800/30 bg-theme-bg-secondary/40 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-black/5"
          : "border-zinc-800/10 bg-zinc-800/10 opacity-50 hover:opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3 min-w-0 flex-1">
          <SimpleToggleSwitch
            size="md"
            enabled={enabled}
            onChange={(newEnabled) =>
              onToggle?.(serverName, tool.name, newEnabled)
            }
          />
          <p className="text-theme-text-primary font-mono font-bold text-sm shrink-0">
            {tool.name}
          </p>
          {!open && (
            <p className="text-theme-text-secondary/60 text-sm truncate">
              {tool.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-x-3">
          <div
            className={`border-none text-theme-text-secondary hover:text-cta-button transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            <CaretDown size={16} />
          </div>
        </div>
      </div>
      {open && (
        <div className="mcp-animate-slide-in flex flex-col gap-y-3 mt-1">
          <div className="flex flex-col gap-y-2">
            <p className="text-theme-text-secondary/80 text-sm text-left leading-relaxed">
              {tool.description}
            </p>
          </div>
          <div className="flex flex-col gap-y-2">
            <p className="text-theme-text-secondary/50 text-xxs font-bold uppercase tracking-widest text-left">
              {t("agent.mcp.tool-call-arguments")}
            </p>
            <div className="flex flex-col gap-y-1.5">
              {Object.entries(tool.inputSchema?.properties || {}).map(
                ([key, value]) => (
                  <div key={key} className="flex items-center gap-x-2 bg-zinc-900/10 px-3 py-1.5 rounded-lg">
                    <p className="text-theme-text-primary text-sm text-left font-bold font-mono">
                      {key}
                      {tool.inputSchema?.required?.includes(key) && (
                        <sup className="text-red-400 ml-0.5">*</sup>
                      )}
                    </p>
                    <p className="text-theme-text-secondary/60 text-xs text-left">
                      {value.type}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
