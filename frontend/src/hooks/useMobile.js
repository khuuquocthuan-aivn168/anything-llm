import { useState, useEffect } from "react";

export default function useMobile() {
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleResize() {
      setIsMobileViewport(window.innerWidth < 1024);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobileViewport;
}
