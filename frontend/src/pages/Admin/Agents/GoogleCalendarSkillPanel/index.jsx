import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Toggle, { SimpleToggleSwitch } from "@/components/lib/Toggle";
import { useTranslation } from "react-i18next";
import debounce from "lodash.debounce";
import {
  MagnifyingGlass,
  CircleNotch,
  Warning,
  CaretDown,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";
import Admin from "@/models/admin";
import System from "@/models/system";
import GoogleAgentSkills from "@/models/googleAgentSkills";
import { getGoogleCalendarSkills, filterSkillCategories } from "./utils";
import { Tooltip } from "react-tooltip";
import GoogleCalendarIcon from "./google-calendar.png";

const PANEL_STYLES = `
  @keyframes gcSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .gc-animate-slide-in {
    animation: gcSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes gcPulseWarning {
    0%, 100% { border-color: rgba(251, 146, 60, 0.2); }
    50% { border-color: rgba(251, 146, 60, 0.5); }
  }
  .gc-animate-pulse-warning {
    animation: gcPulseWarning 2.5s infinite ease-in-out;
  }
`;

export default function GoogleCalendarSkillPanel({
  title,
  skill,
  toggleSkill,
  enabled = false,
  disabled = false,
  setHasChanges,
  hasChanges = false,
}) {
  const { t } = useTranslation();
  const [disabledSkills, setDisabledSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploymentId, setDeploymentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isMultiUserMode, setIsMultiUserMode] = useState(false);
  const [configDefaultExpanded, setConfigDefaultExpanded] = useState(true);
  const prevHasChanges = useRef(hasChanges);
  const skillCategories = getGoogleCalendarSkills(t);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      Admin.systemPreferencesByFields(["disabled_google_calendar_skills"]),
      System.keys(),
      GoogleAgentSkills.calendar.getStatus(),
    ])
      .then(([prefsRes, settingsRes, statusRes]) => {
        setDisabledSkills(
          prefsRes?.settings?.disabled_google_calendar_skills ?? []
        );
        setIsMultiUserMode(settingsRes?.MultiUserMode ?? false);

        if (statusRes?.success && statusRes.config) {
          const loadedDeploymentId = statusRes.config.deploymentId || "";
          const loadedApiKey = statusRes.config.apiKey || "";
          setDeploymentId(loadedDeploymentId);
          setApiKey(loadedApiKey);
          setConfigDefaultExpanded(!(loadedDeploymentId && loadedApiKey));
        }
      })
      .catch(() => {
        setDisabledSkills([]);
        setDeploymentId("");
        setApiKey("");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (prevHasChanges.current === true && hasChanges === false) {
      Promise.all([
        Admin.systemPreferencesByFields(["disabled_google_calendar_skills"]),
        GoogleAgentSkills.calendar.getStatus(),
      ])
        .then(([prefsRes, statusRes]) => {
          setDisabledSkills(
            prefsRes?.settings?.disabled_google_calendar_skills ?? []
          );
          if (statusRes?.success && statusRes.config) {
            setDeploymentId(statusRes.config.deploymentId || "");
            setApiKey(statusRes.config.apiKey || "");
          }
        })
        .catch(() => {});
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  function toggleGoogleCalendarSkill(skillName) {
    setHasChanges(true);
    setDisabledSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  }

  const isConfigured = deploymentId && apiKey;

  return (
    <div className="p-3">
      <style>{PANEL_STYLES}</style>
      <div className="flex flex-col gap-y-6 max-w-[500px]">
        {/* Header */}
        <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-x-3">
            <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
              <img
                src={GoogleCalendarIcon}
                alt="Google Calendar"
                width={24}
                height={24}
              />
            </div>
            <label className="text-theme-text-primary text-base font-bold tracking-wide">
              {title}
            </label>
          </div>
          <Toggle
            size="lg"
            enabled={enabled}
            disabled={disabled || isMultiUserMode}
            onChange={() => toggleSkill(skill)}
          />
        </div>

        {/* Multi-user warning */}
        {isMultiUserMode && (
          <div className="gc-animate-pulse-warning flex items-center gap-x-3 p-3 bg-yellow-500/5 border border-yellow-500/20 text-yellow-400/90 rounded-2xl backdrop-blur-xs shadow-inner">
            <div className="p-1 bg-yellow-500/10 rounded-lg">
              <Warning size={20} className="flex-shrink-0" weight="fill" />
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              {t("agent.skill.googleCalendar.multiUserWarning")}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-y-1">
          <p className="text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
            {t("agent.skill.googleCalendar.description").replace(/<a[^>]*>|<\/a>/g, "")}
          </p>
        </div>

        {/* Configuration */}
        {enabled && !isMultiUserMode && (
          <div className="gc-animate-slide-in flex flex-col gap-y-5">
            <HiddenFormInputs
              disabledSkills={disabledSkills}
              deploymentId={deploymentId}
              apiKey={apiKey}
            />

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <CircleNotch
                  size={28}
                  className="animate-spin text-theme-text-primary opacity-80"
                />
              </div>
            ) : (
              <>
                <ConfigurationSection
                  deploymentId={deploymentId}
                  setDeploymentId={setDeploymentId}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  setHasChanges={setHasChanges}
                  isConfigured={isConfigured}
                  defaultExpanded={configDefaultExpanded}
                />

                {isConfigured && (
                  <SkillsSection
                    skillCategories={skillCategories}
                    disabledSkills={disabledSkills}
                    onToggle={toggleGoogleCalendarSkill}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigurationSection({
  deploymentId,
  setDeploymentId,
  apiKey,
  setApiKey,
  setHasChanges,
  isConfigured,
  defaultExpanded = true,
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/30 shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="border-none w-full flex items-center justify-between p-3.5 bg-zinc-800/10 hover:bg-zinc-800/20 transition-all duration-300"
      >
        <div className="flex items-center gap-x-2">
          <span className="text-theme-text-primary font-bold text-sm tracking-wide">
            {t("agent.skill.googleCalendar.configuration")}
          </span>
          {isConfigured && (
            <div className="flex items-center gap-x-1 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle size={14} weight="fill" className="text-green-500" />
              <span className="text-xxs text-green-500 font-semibold">
                {t("agent.skill.googleCalendar.configured")}
              </span>
            </div>
          )}
        </div>
        <CaretDown
          size={16}
          className={`text-theme-text-secondary transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="gc-animate-slide-in p-4 flex flex-col gap-y-4 border-t border-zinc-800/20 bg-zinc-900/5">
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <label className="text-theme-text-primary text-sm font-semibold">
                {t("agent.skill.googleCalendar.deploymentId")}
              </label>
              <Info
                data-tooltip-id="gcal-deployment-id-tooltip"
                size={16}
                className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
              />
              <Tooltip
                id="gcal-deployment-id-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs !opacity-100"
              >
                {t("agent.skill.googleCalendar.deploymentIdHelp")}
              </Tooltip>
            </div>
            <input
              type="text"
              value={deploymentId}
              onChange={(e) => {
                setDeploymentId(e.target.value);
                setHasChanges(true);
              }}
              placeholder="AKfycb..."
              className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <label className="text-theme-text-primary text-sm font-semibold">
                {t("agent.skill.googleCalendar.apiKey")}
              </label>
              <Info
                data-tooltip-id="gcal-api-key-tooltip"
                size={16}
                className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
              />
              <Tooltip
                id="gcal-api-key-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs !opacity-100"
              >
                {t("agent.skill.googleCalendar.apiKeyHelp")}
              </Tooltip>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Your API key..."
              className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
            />
          </div>
          {!isConfigured && (
            <div className="gc-animate-pulse-warning flex items-center gap-x-3 p-3 bg-orange-500/5 border border-orange-500/20 text-orange-400/90 rounded-2xl">
              <div className="p-1 bg-orange-500/10 rounded-lg">
                <Warning size={18} className="flex-shrink-0" weight="fill" />
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {t("agent.skill.googleCalendar.configurationRequired")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillSearchInput({ onSearch }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        onSearch(value);
      }, 300),
    [onSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e) => {
    debouncedSearch(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        placeholder={t("agent.skill.googleCalendar.searchSkills")}
        onChange={handleChange}
        className="w-full pl-10 pr-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300 search-input"
      />
      <MagnifyingGlass
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-secondary/50"
        weight="bold"
      />
    </div>
  );
}

function SkillsSection({ skillCategories, disabledSkills, onToggle }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const filteredCategories = useMemo(
    () => filterSkillCategories(skillCategories, searchTerm),
    [skillCategories, searchTerm]
  );

  const hasResults = Object.keys(filteredCategories).length > 0;

  return (
    <div className="gc-animate-slide-in flex flex-col gap-y-4 mt-1">
      <div className="h-[1px] bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-transparent w-full" />
      <SkillSearchInput onSearch={handleSearch} />
      {hasResults ? (
        <div className="flex flex-col gap-y-4">
          {Object.entries(filteredCategories).map(([categoryKey, category]) => (
            <CategorySection
              key={categoryKey}
              category={category}
              disabledSkills={disabledSkills}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : (
        <p className="text-theme-text-secondary/50 text-sm text-center py-6 font-medium">
          {t("agent.skill.googleCalendar.noSkillsFound")}
        </p>
      )}
    </div>
  );
}

function CategorySection({ category, disabledSkills, onToggle }) {
  const Icon = category.icon;

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-2 pl-1">
        <div className="p-1.5 bg-theme-bg-secondary/60 rounded-lg border border-zinc-800/20">
          <Icon size={14} className="text-theme-text-primary" />
        </div>
        <span className="text-xxs font-bold uppercase tracking-widest text-theme-text-secondary/50">
          {category.title}
        </span>
      </div>
      <div className="flex flex-col gap-y-2">
        {category.skills.map((skill) => (
          <SkillRow
            key={skill.name}
            skill={skill}
            disabled={disabledSkills.includes(skill.name)}
            onToggle={() => onToggle(skill.name)}
          />
        ))}
      </div>
    </div>
  );
}

function SkillRow({ skill, disabled, onToggle }) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.015] ${
        disabled
          ? "bg-zinc-800/10 border-zinc-800/10 opacity-40 hover:opacity-50"
          : "bg-theme-bg-secondary/40 border-zinc-800/30 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-black/5"
      }`}
    >
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
      <SimpleToggleSwitch enabled={!disabled} onChange={onToggle} size="md" />
    </div>
  );
}

function HiddenFormInputs({ disabledSkills, deploymentId, apiKey }) {
  const configJson = JSON.stringify({
    deploymentId: deploymentId || "",
    apiKey: apiKey || "",
  });

  return (
    <>
      <input
        name="system::disabled_google_calendar_skills"
        type="hidden"
        value={disabledSkills.join(",")}
      />
      <input
        name="system::google_calendar_agent_config"
        type="hidden"
        value={configJson}
      />
    </>
  );
}
