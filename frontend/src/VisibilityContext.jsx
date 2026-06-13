import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "@/utils/constants";

const VisibilityContext = createContext({
  config: {},
  loading: true,
  refreshConfig: () => {},
  isVisible: (key) => true,
});

export function VisibilityProvider({ children }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/visibility/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || {});
      }
    } catch (err) {
      console.error("Failed to load visibility config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const isVisible = (key) => {
    // While loading, show everything to avoid UI flash
    if (loading) return true;
    // If key not in config at all, default to visible
    if (!(key in config)) return true;
    // Support both boolean false and string "false" from DB
    const val = config[key];
    if (val === false || val === "false") return false;
    return true;
  };

  return (
    <VisibilityContext.Provider value={{ config, loading, refreshConfig: fetchConfig, isVisible }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  return useContext(VisibilityContext);
}
