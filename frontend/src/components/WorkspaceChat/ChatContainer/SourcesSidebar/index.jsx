import { useState } from "react";
import useMobile from "@/hooks/useMobile";
import { useTranslation } from "react-i18next";
import { X } from "@phosphor-icons/react";
import {
  combineLikeSources,
  CitationDetailModal,
} from "../ChatHistory/Citation";
import MobileCitationModal from "./MobileCitationModal";
import SourceItem from "./SourceItem";
import ChatSidebar, { useSourcesSidebar } from "../ChatSidebar";

// Re-export for backward compat with existing imports
export { useSourcesSidebar } from "../ChatSidebar";

export default function SourcesSidebar() {
  const { sources, sidebarOpen, closeSidebar } = useSourcesSidebar();
  const { t } = useTranslation();
  const [selectedSource, setSelectedSource] = useState(null);
  const isMobile = useMobile();

  const combined = combineLikeSources(sources);

  if (isMobile) {
    return (
      <MobileCitationModal
        sources={sources}
        isOpen={sidebarOpen}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        onClose={() => {
          setSelectedSource(null);
          closeSidebar();
        }}
      />
    );
  }

  return (
    <>
      <ChatSidebar isOpen={sidebarOpen}>
        <div
          className="ml-4 w-[350px] bg-zinc-950/60 backdrop-blur-md light:bg-white/95 border border-zinc-800/80 light:border-slate-200/80 md:rounded-2xl p-5 flex flex-col gap-5 overflow-hidden mt-[72px] shadow-2xl"
          style={{ maxHeight: "calc(100% - 88px)" }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 light:border-slate-200/60">
            <p className="font-semibold text-base text-zinc-150 light:text-slate-900">
              {t("chat_window.sources")}
            </p>
            <button
              onClick={closeSidebar}
              type="button"
              className="text-zinc-400 light:text-slate-400 hover:text-white light:hover:text-slate-900 transition-all border border-zinc-800 light:border-slate-200/60 bg-zinc-900/40 hover:bg-zinc-800 light:bg-slate-100 rounded-lg p-1.5 cursor-pointer shadow-sm"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
          <div className="flex flex-col gap-3.5 overflow-y-auto no-scroll pr-0.5">
            {combined.map((source, idx) => (
              <SourceItem
                key={source.title || idx}
                source={source}
                onClick={() => setSelectedSource(source)}
              />
            ))}
          </div>
        </div>
      </ChatSidebar>
      {selectedSource && (
        <CitationDetailModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </>
  );
}
