import React, { useState, useEffect, useRef } from "react";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";
import { FlowArrow, Gear } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import paths from "@/utils/paths";
import Toggle from "@/components/lib/Toggle";

const PANEL_STYLES = `
  @keyframes fpSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fp-animate-slide-in {
    animation: fpSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

function ManageFlowMenu({ flow, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  async function deleteFlow() {
    setOpen(false);
    if (
      !window.confirm(
        "Are you sure you want to delete this flow? This action cannot be undone."
      )
    )
      return;
    const { success, error } = await AgentFlows.deleteFlow(flow.uuid);
    if (success) {
      showToast("Flow deleted successfully.", "success");
      onDelete(flow.uuid);
    } else {
      showToast(error || "Failed to delete flow.", "error");
    }
  }

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

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
        <div className="absolute min-w-[150px] top-full right-0 mt-1 border border-zinc-800/30 rounded-xl bg-theme-action-menu-bg flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-white z-99 md:z-10 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate(paths.agents.editAgent(flow.uuid))}
            className="border-none flex items-center gap-x-2 hover:bg-zinc-800/30 py-2.5 px-3 transition-all duration-200 w-full text-left"
          >
            <span className="text-sm font-medium whitespace-nowrap">Edit Flow</span>
          </button>
          <div className="h-[1px] bg-zinc-800/20 mx-2" />
          <button
            type="button"
            onClick={deleteFlow}
            className="border-none flex items-center gap-x-2 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 py-2.5 px-3 transition-all duration-200 w-full text-left"
          >
            <span className="text-sm font-medium whitespace-nowrap">Delete Flow</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlowPanel({ flow, toggleFlow, enabled, onDelete }) {
  const handleToggle = async () => {
    try {
      const { success, error } = await AgentFlows.toggleFlow(
        flow.uuid,
        !enabled
      );
      if (!success) throw new Error(error);
      toggleFlow(flow.uuid);
    } catch (error) {
      console.error("Failed to toggle flow:", error);
      showToast("Failed to toggle flow", "error", { clear: true });
    }
  };

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div className="p-3">
        <div className="fp-animate-slide-in flex flex-col gap-y-6 max-w-[500px]">
          {/* Header */}
          <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
            <div className="flex items-center gap-x-3">
              <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
                <FlowArrow size={24} weight="bold" className="text-theme-text-primary" />
              </div>
              <label htmlFor="name" className="text-theme-text-primary text-base font-bold tracking-wide">
                {flow.name}
              </label>
            </div>
            <div className="flex items-center gap-x-2">
              <Toggle size="lg" enabled={enabled} onChange={handleToggle} />
              <ManageFlowMenu flow={flow} onDelete={onDelete} />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-y-1">
            <p className="whitespace-pre-wrap text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
              {flow.description || "No description provided"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
