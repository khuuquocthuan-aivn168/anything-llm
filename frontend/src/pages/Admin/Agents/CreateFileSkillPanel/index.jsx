import React, { useEffect, useState, useRef } from "react";
import Toggle, { SimpleToggleSwitch } from "@/components/lib/Toggle";
import { useTranslation } from "react-i18next";
import {
  FilePpt,
  FileXls,
  FileDoc,
  FilePdf,
  FileText,
  CircleNotch,
} from "@phosphor-icons/react";
import Admin from "@/models/admin";

export const getCreateFileSkills = (t) => [
  {
    name: "create-text-file",
    title: t("agent.skill.createFiles.skills.create-text-file.title"),
    description: t(
      "agent.skill.createFiles.skills.create-text-file.description"
    ),
    icon: FileText,
  },
  {
    name: "create-pptx-presentation",
    title: t("agent.skill.createFiles.skills.create-pptx.title"),
    description: t("agent.skill.createFiles.skills.create-pptx.description"),
    icon: FilePpt,
  },
  {
    name: "create-pdf-file",
    title: t("agent.skill.createFiles.skills.create-pdf.title"),
    description: t("agent.skill.createFiles.skills.create-pdf.description"),
    icon: FilePdf,
  },
  {
    name: "create-excel-file",
    title: t("agent.skill.createFiles.skills.create-xlsx.title"),
    description: t("agent.skill.createFiles.skills.create-xlsx.description"),
    icon: FileXls,
  },
  {
    name: "create-docx-file",
    title: t("agent.skill.createFiles.skills.create-docx.title"),
    description: t("agent.skill.createFiles.skills.create-docx.description"),
    icon: FileDoc,
  },
];

export default function CreateFileSkillPanel({
  title,
  skill,
  toggleSkill,
  enabled = false,
  disabled = false,
  image,
  icon,
  setHasChanges,
  hasChanges = false,
}) {
  const { t } = useTranslation();
  const [disabledSkills, setDisabledSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevHasChanges = useRef(hasChanges);
  const skills = getCreateFileSkills(t);

  useEffect(() => {
    setLoading(true);
    Admin.systemPreferencesByFields(["disabled_create_files_skills"])
      .then((res) =>
        setDisabledSkills(res?.settings?.disabled_create_files_skills ?? [])
      )
      .catch(() => setDisabledSkills([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (prevHasChanges.current === true && hasChanges === false) {
      Admin.systemPreferencesByFields(["disabled_create_files_skills"])
        .then((res) =>
          setDisabledSkills(res?.settings?.disabled_create_files_skills ?? [])
        )
        .catch(() => {});
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  function toggleFileSkill(skillName) {
    setHasChanges(true);
    setDisabledSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  }

  const styleTag = `
    @keyframes cfSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cf-animate-slide-in {
      animation: cfSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `;

  return (
    <div className="p-3">
      <style>{styleTag}</style>
      <div className="flex flex-col gap-y-6 max-w-[500px]">
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
          </div>
          <Toggle
            size="lg"
            enabled={enabled}
            disabled={disabled}
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
            {t("agent.skill.createFiles.description")}
          </p>
        </div>

        {/* Configuration */}
        {enabled && (
          <div className="cf-animate-slide-in flex flex-col gap-y-5 mt-2">
            <input
              name="system::disabled_create_files_skills"
              type="hidden"
              value={disabledSkills.join(",")}
            />
            <div className="h-[1px] bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-transparent w-full" />
            <div className="flex justify-between items-center">
              <p className="text-theme-text-primary font-bold text-sm tracking-wide">
                {t("agent.skill.createFiles.configuration")}
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <CircleNotch
                  size={28}
                  className="animate-spin text-theme-text-primary opacity-80"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-y-2">
                {skills.map((fileSkill) => (
                  <SkillRow
                    key={fileSkill.name}
                    skill={fileSkill}
                    disabled={disabledSkills.includes(fileSkill.name)}
                    onToggle={() => toggleFileSkill(fileSkill.name)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillRow({ skill, disabled, onToggle }) {
  const Icon = skill.icon;
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.015] ${
        disabled
          ? "bg-zinc-800/10 border-zinc-800/10 opacity-40 hover:opacity-50"
          : "bg-theme-bg-secondary/40 border-zinc-800/30 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-black/5 text-theme-text-primary"
      }`}
    >
      <div className="flex items-center gap-x-3">
        <div
          className={`p-2 rounded-xl border ${
            disabled
              ? "bg-zinc-900/10 border-zinc-800/10"
              : "bg-theme-bg-secondary border-zinc-800/40 text-theme-text-primary"
          }`}
        >
          <Icon
            size={18}
            className={
              disabled
                ? "text-theme-text-secondary/30"
                : "text-theme-text-primary"
            }
            weight="bold"
          />
        </div>
        <div className="flex flex-col gap-y-0.5">
          <span
            className={`text-sm font-semibold tracking-wide ${disabled ? "text-theme-text-secondary/40" : "text-theme-text-primary"}`}
          >
            {skill.title}
          </span>
          <span
            className={`text-xxs leading-normal ${disabled ? "text-theme-text-secondary/30" : "text-theme-text-secondary/70"}`}
          >
            {skill.description}
          </span>
        </div>
      </div>
      <SimpleToggleSwitch enabled={!disabled} onChange={onToggle} size="md" />
    </div>
  );
}
