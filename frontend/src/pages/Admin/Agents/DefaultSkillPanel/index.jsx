import React from "react";
import { useTranslation } from "react-i18next";
import { DefaultBadge } from "../Badges/default";
import Toggle from "@/components/lib/Toggle";

export default function DefaultSkillPanel({
  title,
  description,
  image,
  icon,
  enabled = true,
  toggleSkill,
  skill,
}) {
  const { t } = useTranslation();

  const styleTag = `
    @keyframes dsSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ds-animate-slide-in {
      animation: dsSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `;

  return (
    <div className="p-3">
      <style>{styleTag}</style>
      <div className="ds-animate-slide-in flex flex-col gap-y-6 max-w-[500px]">
        {/* Header */}
        <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-x-3">
            <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
              {icon &&
                React.createElement(icon, {
                  size: 24,
                  color: "var(--theme-text-primary)",
                  weight: "bold",
                })}
            </div>
            <label
              htmlFor="name"
              className="text-theme-text-primary text-base font-bold tracking-wide"
            >
              {title}
            </label>
            <DefaultBadge title={title} />
          </div>
          <Toggle
            size="lg"
            enabled={enabled}
            onChange={() => toggleSkill(skill)}
          />
        </div>

        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800/30 shadow-md group">
          <img
            src={image}
            alt={title}
            className="w-full transform group-hover:scale-102 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-y-1">
          <p className="text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
            {description}
            <br />
            <br />
            {t("agent.skill.default_skill")}
          </p>
        </div>
      </div>
    </div>
  );
}
