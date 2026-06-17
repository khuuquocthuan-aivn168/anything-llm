import {
  parseChunkSource,
  SourceTypeCircle,
  getCustomImage,
} from "../../ChatHistory/Citation";
import { useTranslation } from "react-i18next";

export default function SourceItem({ source, onClick }) {
  const { t } = useTranslation();
  const info = parseChunkSource(source);
  const customImage = getCustomImage(info?.icon);
  const subtitle = info?.isUrl ? info?.text : t("chat_window.document");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 items-start w-full text-left bg-zinc-800/30 light:bg-slate-50 border border-zinc-800 light:border-slate-200/80 hover:bg-zinc-800/60 light:hover:bg-slate-100 rounded-xl p-3.5 transition-all duration-300 shadow-sm hover:scale-[1.015] active:scale-[0.985] group"
    >
      <div className="flex gap-[8px] items-center w-full">
        <SourceTypeCircle
          type={info.icon}
          size={18}
          iconSize={10}
          url={info.href}
          customImage={customImage}
        />
        <p className="flex-1 font-semibold text-sm text-zinc-200 light:text-slate-800 leading-[18px] truncate group-hover:text-white light:group-hover:text-slate-900 transition-colors">
          {source.title}
        </p>
      </div>
      <div className="flex justify-between items-center w-full pl-[26px] text-xs text-zinc-450 light:text-slate-500">
        <span className="truncate max-w-[150px]">{subtitle}</span>
        <span className="bg-zinc-800 light:bg-slate-200 text-[10px] text-zinc-350 light:text-slate-650 px-2 py-0.5 rounded-full border border-zinc-700/50 light:border-slate-300/50 font-medium">
          {t("chat_window.source_count", { count: source.references })}
        </span>
      </div>
    </button>
  );
}

