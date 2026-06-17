import React, { useEffect, useState, useRef } from "react";
import Toggle, { SimpleToggleSwitch } from "@/components/lib/Toggle";
import { useTranslation } from "react-i18next";
import {
  Warning,
  File,
  Files,
  PencilSimple,
  FloppyDisk,
  FolderPlus,
  FolderOpen,
  ArrowsLeftRight,
  MagnifyingGlass,
  Info,
  CircleNotch,
  Copy,
} from "@phosphor-icons/react";
import Admin from "@/models/admin";

export const getFileSystemSubSkills = (t) => {
  return [
    {
      name: "filesystem-read-text-file",
      title: t("agent.skill.filesystem.skills.read-text-file.title"),
      description: t(
        "agent.skill.filesystem.skills.read-text-file.description"
      ),
      icon: File,
      category: "read",
    },
    {
      name: "filesystem-read-multiple-files",
      title: t("agent.skill.filesystem.skills.read-multiple-files.title"),
      description: t(
        "agent.skill.filesystem.skills.read-multiple-files.description"
      ),
      icon: Files,
      category: "read",
    },
    {
      name: "filesystem-list-directory",
      title: t("agent.skill.filesystem.skills.list-directory.title"),
      description: t(
        "agent.skill.filesystem.skills.list-directory.description"
      ),
      icon: FolderOpen,
      category: "read",
    },
    {
      name: "filesystem-search-files",
      title: t("agent.skill.filesystem.skills.search-files.title"),
      description: t("agent.skill.filesystem.skills.search-files.description"),
      icon: MagnifyingGlass,
      category: "read",
    },
    {
      name: "filesystem-get-file-info",
      title: t("agent.skill.filesystem.skills.get-file-info.title"),
      description: t("agent.skill.filesystem.skills.get-file-info.description"),
      icon: Info,
      category: "read",
    },
    {
      name: "filesystem-write-text-file",
      title: t("agent.skill.filesystem.skills.write-text-file.title"),
      description: t(
        "agent.skill.filesystem.skills.write-text-file.description"
      ),
      icon: FloppyDisk,
      category: "write",
    },
    {
      name: "filesystem-edit-file",
      title: t("agent.skill.filesystem.skills.edit-file.title"),
      description: t("agent.skill.filesystem.skills.edit-file.description"),
      icon: PencilSimple,
      category: "write",
    },
    {
      name: "filesystem-create-directory",
      title: t("agent.skill.filesystem.skills.create-directory.title"),
      description: t(
        "agent.skill.filesystem.skills.create-directory.description"
      ),
      icon: FolderPlus,
      category: "write",
    },
    {
      name: "filesystem-copy-file",
      title: t("agent.skill.filesystem.skills.copy-file.title"),
      description: t("agent.skill.filesystem.skills.copy-file.description"),
      icon: Copy,
      category: "write",
    },
    {
      name: "filesystem-move-file",
      title: t("agent.skill.filesystem.skills.move-file.title"),
      description: t("agent.skill.filesystem.skills.move-file.description"),
      icon: ArrowsLeftRight,
      category: "write",
    },
  ];
};

export default function FileSystemSkillPanel({
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
  const [disabledSubSkills, setDisabledSubSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevHasChanges = useRef(hasChanges);
  const FILESYSTEM_SUB_SKILLS = getFileSystemSubSkills(t);

  useEffect(() => {
    setLoading(true);
    Admin.systemPreferencesByFields(["disabled_filesystem_skills"])
      .then((res) =>
        setDisabledSubSkills(res?.settings?.disabled_filesystem_skills ?? [])
      )
      .catch(() => setDisabledSubSkills([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (prevHasChanges.current === true && hasChanges === false) {
      Admin.systemPreferencesByFields(["disabled_filesystem_skills"])
        .then((res) =>
          setDisabledSubSkills(res?.settings?.disabled_filesystem_skills ?? [])
        )
        .catch(() => {});
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  function toggleSubSkill(subSkillName) {
    setHasChanges(true);
    setDisabledSubSkills((prev) => {
      if (prev.includes(subSkillName)) {
        return prev.filter((s) => s !== subSkillName);
      }
      return [...prev, subSkillName];
    });
  }
  const readSkills = FILESYSTEM_SUB_SKILLS.filter((s) => s.category === "read");
  const writeSkills = FILESYSTEM_SUB_SKILLS.filter(
    (s) => s.category === "write"
  );

  const styleTag = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-in {
      animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes pulseWarning {
      0%, 100% { border-color: rgba(251, 146, 60, 0.2); }
      50% { border-color: rgba(251, 146, 60, 0.5); }
    }
    .animate-pulse-warning {
      animation: pulseWarning 2.5s infinite ease-in-out;
    }
  `;

  return (
    <div className="p-3">
      <style>{styleTag}</style>
      <div className="flex flex-col gap-y-6 max-w-[500px]">
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

        <div className="overflow-hidden rounded-2xl border border-zinc-800/30 shadow-md group">
          <img 
            src={image} 
            alt={title} 
            className="w-full transform group-hover:scale-102 transition-transform duration-700 ease-out" 
          />
        </div>
        
        <WarningBanner />

        <div className="flex flex-col gap-y-1">
          <p className="text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
            {t("agent.skill.filesystem.description")}
          </p>
        </div>

        {enabled && (
          <div className="animate-slide-in flex flex-col gap-y-5 mt-2">
            <input
              name="system::disabled_filesystem_skills"
              type="hidden"
              value={disabledSubSkills.join(",")}
            />
            <div className="h-[1px] bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-transparent w-full" />
            <div className="flex justify-between items-center">
              <p className="text-theme-text-primary font-bold text-sm tracking-wide">
                {t("agent.skill.filesystem.configuration")}
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
              <>
                <div className="flex flex-col gap-y-3">
                  <p className="text-theme-text-secondary/50 text-xxs font-bold uppercase tracking-widest pl-1">
                    {t("agent.skill.filesystem.readActions")}
                  </p>
                  <div className="flex flex-col gap-y-2">
                    {readSkills.map((subSkill) => (
                      <SubSkillRow
                        key={subSkill.name}
                        subSkill={subSkill}
                        disabled={disabledSubSkills.includes(subSkill.name)}
                        onToggle={() => toggleSubSkill(subSkill.name)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-y-3 mt-1">
                  <p className="text-theme-text-secondary/50 text-xxs font-bold uppercase tracking-widest flex items-center gap-x-1 pl-1">
                    <Warning
                      size={12}
                      className="text-orange-400"
                      weight="fill"
                    />
                    {t("agent.skill.filesystem.writeActions")}
                  </p>
                  <div className="flex flex-col gap-y-2">
                    {writeSkills.map((subSkill) => (
                      <SubSkillRow
                        key={subSkill.name}
                        subSkill={subSkill}
                        disabled={disabledSubSkills.includes(subSkill.name)}
                        onToggle={() => toggleSubSkill(subSkill.name)}
                        isWriteOperation
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WarningBanner() {
  const { t } = useTranslation();
  return (
    <div className="animate-pulse-warning flex items-start gap-x-3 p-3 bg-orange-500/5 border border-orange-500/20 text-orange-400/90 rounded-2xl backdrop-blur-xs items-center shadow-inner">
      <div className="p-1 bg-orange-500/10 rounded-lg">
        <Warning size={20} className="flex-shrink-0" weight="fill" />
      </div>
      <p className="text-xs font-semibold leading-relaxed">
        {t("agent.skill.filesystem.warning").replace(/<a[^>]*>|<\/a>/g, "")}
      </p>
    </div>
  );
}

function SubSkillRow({ subSkill, disabled, onToggle, isWriteOperation }) {
  const Icon = subSkill.icon;
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.015] ${
        disabled
          ? "bg-zinc-800/10 border-zinc-800/10 opacity-40 hover:opacity-50"
          : isWriteOperation
            ? "bg-orange-500/[0.03] border-orange-500/10 hover:border-orange-500/30 text-orange-400/90 hover:shadow-lg hover:shadow-orange-500/[0.02]"
            : "bg-theme-bg-secondary/40 border-zinc-800/30 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-black/5 text-theme-text-primary"
      }`}
    >
      <div className="flex items-center gap-x-3">
        <div className={`p-2 rounded-xl border ${
          disabled
            ? "bg-zinc-900/10 border-zinc-800/10"
            : isWriteOperation
              ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
              : "bg-theme-bg-secondary border-zinc-800/40 text-theme-text-primary"
        }`}>
          <Icon
            size={18}
            className={
              disabled
                ? "text-theme-text-secondary/30"
                : isWriteOperation
                  ? "text-orange-400"
                  : "text-theme-text-primary"
            }
            weight="bold"
          />
        </div>
        <div className="flex flex-col gap-y-0.5">
          <span
            className={`text-sm font-semibold tracking-wide ${disabled ? "text-theme-text-secondary/40" : "text-theme-text-primary"}`}
          >
            {subSkill.title}
          </span>
          <span
            className={`text-xxs leading-normal ${disabled ? "text-theme-text-secondary/30" : "text-theme-text-secondary/70"}`}
          >
            {subSkill.description}
          </span>
        </div>
      </div>
      <SimpleToggleSwitch enabled={!disabled} onChange={onToggle} size="md" />
    </div>
  );
}
