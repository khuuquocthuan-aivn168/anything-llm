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
  ArrowSquareOut,
  XCircle,
} from "@phosphor-icons/react";
import Admin from "@/models/admin";
import System from "@/models/system";
import OutlookAgent from "@/models/outlookAgent";
import { getOutlookSkills, filterSkillCategories } from "./utils";
import OutlookIcon from "./outlook.png";
import { Tooltip } from "react-tooltip";

const PANEL_STYLES = `
  @keyframes olSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ol-animate-slide-in {
    animation: olSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes olPulseWarning {
    0%, 100% { border-color: rgba(251, 146, 60, 0.2); }
    50% { border-color: rgba(251, 146, 60, 0.5); }
  }
  .ol-animate-pulse-warning {
    animation: olPulseWarning 2.5s infinite ease-in-out;
  }
`;

export default function OutlookSkillPanel({
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
  const [clientId, setClientId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authType, setAuthType] = useState("common");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isMultiUserMode, setIsMultiUserMode] = useState(false);
  const [configDefaultExpanded, setConfigDefaultExpanded] = useState(true);
  const prevHasChanges = useRef(hasChanges);
  const skillCategories = getOutlookSkills(t);

  const fetchStatus = async () => {
    try {
      const data = await OutlookAgent.getStatus();
      if (data.success) {
        setIsAuthenticated(data.isAuthenticated);
        // Load config from status endpoint
        if (data.config) {
          setClientId(data.config.clientId || "");
          setTenantId(data.config.tenantId || "");
          setClientSecret(data.config.clientSecret || "");
          setAuthType(data.config.authType || "common");
          setConfigDefaultExpanded(
            !(data.config.clientId && data.config.clientSecret)
          );
        }
      }
    } catch (e) {
      console.error("Failed to fetch Outlook status:", e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      Admin.systemPreferencesByFields(["disabled_outlook_skills"]),
      System.keys(),
      OutlookAgent.getStatus(),
    ])
      .then(([prefsRes, settingsRes, statusRes]) => {
        setDisabledSkills(prefsRes?.settings?.disabled_outlook_skills ?? []);
        setIsMultiUserMode(settingsRes?.MultiUserMode ?? false);

        // Load config from status endpoint
        if (statusRes?.success) {
          setIsAuthenticated(statusRes.isAuthenticated);
          if (statusRes.config) {
            setClientId(statusRes.config.clientId || "");
            setTenantId(statusRes.config.tenantId || "");
            setClientSecret(statusRes.config.clientSecret || "");
            setAuthType(statusRes.config.authType || "common");
            setConfigDefaultExpanded(
              !(statusRes.config.clientId && statusRes.config.clientSecret)
            );
          }
        }
      })
      .catch(() => {
        setDisabledSkills([]);
        setClientId("");
        setTenantId("");
        setClientSecret("");
        setAuthType("common");
      })
      .finally(() => setLoading(false));

    const urlParams = new URLSearchParams(window.location.search);
    const outlookAuth = urlParams.get("outlook_auth");
    if (outlookAuth === "success") {
      fetchStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (outlookAuth === "error") {
      const message = urlParams.get("message");
      console.error("Outlook auth error:", message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (prevHasChanges.current === true && hasChanges === false) {
      Promise.all([
        Admin.systemPreferencesByFields(["disabled_outlook_skills"]),
        OutlookAgent.getStatus(),
      ])
        .then(([prefsRes, statusRes]) => {
          setDisabledSkills(prefsRes?.settings?.disabled_outlook_skills ?? []);
          if (statusRes?.success) {
            setIsAuthenticated(statusRes.isAuthenticated);
            if (statusRes.config) {
              setClientId(statusRes.config.clientId || "");
              setTenantId(statusRes.config.tenantId || "");
              setClientSecret(statusRes.config.clientSecret || "");
              setAuthType(statusRes.config.authType || "common");
            }
          }
        })
        .catch(() => {});
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  function toggleOutlookSkill(skillName) {
    setHasChanges(true);
    setDisabledSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  }

  const handleStartAuth = async () => {
    setAuthLoading(true);
    try {
      const data = await OutlookAgent.saveCredentialsAndGetAuthUrl({
        clientId,
        tenantId,
        clientSecret,
        authType,
      });
      if (data.success && data.url) {
        window.open(data.url, "_blank");
      } else {
        console.error("Failed to get auth URL:", data.error);
      }
    } catch (e) {
      console.error("Auth error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRevokeAuth = async () => {
    setAuthLoading(true);
    try {
      const data = await OutlookAgent.revokeAccess();
      if (data.success) {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Revoke error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  // For organization auth type, tenant ID is required; for others it's optional
  const hasCredentials =
    authType === "organization"
      ? clientId && tenantId && clientSecret
      : clientId && clientSecret;
  const isConfigured = hasCredentials && isAuthenticated;

  return (
    <div className="p-3">
      <style>{PANEL_STYLES}</style>
      <div className="flex flex-col gap-y-6 max-w-[500px]">
        {/* Header */}
        <div className="flex w-full justify-between items-center bg-zinc-800/10 p-3 rounded-2xl border border-zinc-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-x-3">
            <div className="p-2 bg-theme-bg-secondary rounded-xl shadow-inner border border-zinc-800/30">
              <img src={OutlookIcon} alt="Outlook" className="w-6 h-6" />
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
          <div className="ol-animate-pulse-warning flex items-center gap-x-3 p-3 bg-yellow-500/5 border border-yellow-500/20 text-yellow-400/90 rounded-2xl backdrop-blur-xs shadow-inner">
            <div className="p-1 bg-yellow-500/10 rounded-lg">
              <Warning size={20} className="flex-shrink-0" weight="fill" />
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              {t("agent.skill.outlook.multiUserWarning")}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-y-1">
          <p className="text-theme-text-secondary text-opacity-80 text-xs font-medium leading-relaxed pl-1">
            {t("agent.skill.outlook.description").replace(/<a[^>]*>|<\/a>/g, "")}
          </p>
        </div>

        {/* Configuration */}
        {enabled && !isMultiUserMode && (
          <div className="ol-animate-slide-in flex flex-col gap-y-5">
            <HiddenFormInputs disabledSkills={disabledSkills} />

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
                  clientId={clientId}
                  setClientId={setClientId}
                  tenantId={tenantId}
                  setTenantId={setTenantId}
                  clientSecret={clientSecret}
                  setClientSecret={setClientSecret}
                  authType={authType}
                  setAuthType={setAuthType}
                  setHasChanges={setHasChanges}
                  hasCredentials={hasCredentials}
                  isAuthenticated={isAuthenticated}
                  isConfigured={isConfigured}
                  defaultExpanded={configDefaultExpanded}
                  onStartAuth={handleStartAuth}
                  onRevokeAuth={handleRevokeAuth}
                  authLoading={authLoading}
                />

                {isConfigured && (
                  <SkillsSection
                    skillCategories={skillCategories}
                    disabledSkills={disabledSkills}
                    onToggle={toggleOutlookSkill}
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
  clientId,
  setClientId,
  tenantId,
  setTenantId,
  clientSecret,
  setClientSecret,
  authType,
  setAuthType,
  setHasChanges,
  hasCredentials,
  isAuthenticated,
  isConfigured,
  defaultExpanded = true,
  onStartAuth,
  onRevokeAuth,
  authLoading,
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showTenantId = authType === "organization";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/30 shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="border-none w-full flex items-center justify-between p-3.5 bg-zinc-800/10 hover:bg-zinc-800/20 transition-all duration-300"
      >
        <div className="flex items-center gap-x-2">
          <span className="text-theme-text-primary font-bold text-sm tracking-wide">
            {t("agent.skill.outlook.configuration")}
          </span>
          {isConfigured && (
            <div className="flex items-center gap-x-1 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle size={14} weight="fill" className="text-green-500" />
              <span className="text-xxs text-green-500 font-semibold">
                {t("agent.skill.outlook.configured")}
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
        <div className="ol-animate-slide-in p-4 flex flex-col gap-y-4 border-t border-zinc-800/20 bg-zinc-900/5">
          {/* Auth Type */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <label className="text-theme-text-primary text-sm font-semibold">
                {t("agent.skill.outlook.authType")}
              </label>
              <Info
                data-tooltip-id="auth-type-tooltip"
                size={16}
                className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
              />
              <Tooltip
                id="auth-type-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs !opacity-100 max-w-xs"
              >
                {t("agent.skill.outlook.authTypeHelp")}
              </Tooltip>
            </div>
            <select
              value={authType}
              onChange={(e) => {
                setAuthType(e.target.value);
                setHasChanges(true);
              }}
              className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
            >
              <option value="common">
                {t("agent.skill.outlook.authTypeCommon")}
              </option>
              <option value="consumers">
                {t("agent.skill.outlook.authTypeConsumers")}
              </option>
              <option value="organization">
                {t("agent.skill.outlook.authTypeOrganization")}
              </option>
            </select>
          </div>

          {/* Client ID */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <label className="text-theme-text-primary text-sm font-semibold">
                {t("agent.skill.outlook.clientId")}
              </label>
              <Info
                data-tooltip-id="client-id-tooltip"
                size={16}
                className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
              />
              <Tooltip
                id="client-id-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs !opacity-100"
              >
                {t("agent.skill.outlook.clientIdHelp")}
              </Tooltip>
            </div>
            <input
              type="text"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setHasChanges(true);
              }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Tenant ID */}
          {showTenantId && (
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center gap-x-2">
                <label className="text-theme-text-primary text-sm font-semibold">
                  {t("agent.skill.outlook.tenantId")}
                </label>
                <Info
                  data-tooltip-id="tenant-id-tooltip"
                  size={16}
                  className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
                />
                <Tooltip
                  id="tenant-id-tooltip"
                  place="top"
                  delayShow={300}
                  className="tooltip !text-xs !opacity-100"
                >
                  {t("agent.skill.outlook.tenantIdHelp")}
                </Tooltip>
              </div>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
              />
            </div>
          )}

          {/* Client Secret */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <label className="text-theme-text-primary text-sm font-semibold">
                {t("agent.skill.outlook.clientSecret")}
              </label>
              <Info
                data-tooltip-id="client-secret-tooltip"
                size={16}
                className="text-theme-text-secondary/60 hover:text-theme-text-secondary transition-colors"
              />
              <Tooltip
                id="client-secret-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs !opacity-100"
              >
                {t("agent.skill.outlook.clientSecretHelp")}
              </Tooltip>
            </div>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => {
                setClientSecret(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Your client secret..."
              className="w-full px-3.5 py-2.5 bg-theme-bg-primary border-2 border-zinc-800/30 rounded-xl text-theme-text-primary text-sm placeholder:text-theme-text-secondary/40 focus:border-zinc-700/60 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Status banners */}
          {!hasCredentials && (
            <div className="ol-animate-pulse-warning flex items-center gap-x-3 p-3 bg-orange-500/5 border border-orange-500/20 text-orange-400/90 rounded-2xl">
              <div className="p-1 bg-orange-500/10 rounded-lg">
                <Warning size={18} className="flex-shrink-0" weight="fill" />
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {t("agent.skill.outlook.configurationRequired")}
              </p>
            </div>
          )}

          {hasCredentials && !isAuthenticated && (
            <div className="flex flex-col gap-y-3">
              <div className="flex items-center gap-x-3 p-3 bg-blue-500/5 border border-blue-500/20 text-blue-400/90 rounded-2xl">
                <div className="p-1 bg-blue-500/10 rounded-lg">
                  <Info size={18} className="flex-shrink-0" weight="fill" />
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {t("agent.skill.outlook.authRequired")}
                </p>
              </div>
              <button
                type="button"
                onClick={onStartAuth}
                disabled={authLoading}
                className="flex items-center justify-center gap-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-blue-500/20"
              >
                {authLoading ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <ArrowSquareOut size={16} />
                )}
                {t("agent.skill.outlook.authenticateWithMicrosoft")}
              </button>
            </div>
          )}

          {hasCredentials && isAuthenticated && (
            <div className="flex flex-col gap-y-3">
              <div className="flex items-center gap-x-3 p-3 bg-green-500/5 border border-green-500/20 text-green-400/90 rounded-2xl">
                <div className="p-1 bg-green-500/10 rounded-lg">
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className="flex-shrink-0"
                  />
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {t("agent.skill.outlook.authenticated")}
                </p>
              </div>
              <button
                type="button"
                onClick={onRevokeAuth}
                disabled={authLoading}
                className="flex items-center justify-center gap-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {authLoading ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                {t("agent.skill.outlook.revokeAccess")}
              </button>
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
        placeholder={t("agent.skill.outlook.searchSkills")}
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
    <div className="ol-animate-slide-in flex flex-col gap-y-4 mt-1">
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
          {t("agent.skill.outlook.noSkillsFound")}
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

function HiddenFormInputs({ disabledSkills }) {
  return (
    <input
      name="system::disabled_outlook_skills"
      type="hidden"
      value={disabledSkills.join(",")}
    />
  );
}
