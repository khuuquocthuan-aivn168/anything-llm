import { useEffect, useState } from "react";
import { AUTH_TOKEN, AUTH_USER } from "@/utils/constants";

function getModeFromStorage() {
  if (typeof window === "undefined") return null;
  const user = !!window.localStorage.getItem(AUTH_USER);
  const token = !!window.localStorage.getItem(AUTH_TOKEN);
  if (user && token) return "multi";
  if (!user && token) return "single";
  return null;
}

export default function useLoginMode() {
  // Initialize synchronously so UI doesn't disappear for a render.
  const [mode, setMode] = useState(getModeFromStorage);

  useEffect(() => {
    setMode(getModeFromStorage());
  }, []);

  return mode;
}
