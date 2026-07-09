import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "anythingllm_glass_sidebar_collapsed";
const GlassSidebarContext = createContext(null);

export function GlassSidebarProvider({
  children,
  defaultCollapsed = false,
  persist = true,
}) {
  const [collapsed, setCollapsedState] = useState(() => {
    if (!persist) return defaultCollapsed;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      /* ignore */
    }
    return defaultCollapsed;
  });

  const setCollapsed = useCallback(
    (value) => {
      setCollapsedState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (persist) {
          try {
            window.localStorage.setItem(STORAGE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    [persist]
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggle }),
    [collapsed, setCollapsed, toggle]
  );

  return (
    <GlassSidebarContext.Provider value={value}>
      {children}
    </GlassSidebarContext.Provider>
  );
}

export function useGlassSidebar() {
  const ctx = useContext(GlassSidebarContext);
  if (!ctx) {
    return {
      collapsed: false,
      setCollapsed: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
