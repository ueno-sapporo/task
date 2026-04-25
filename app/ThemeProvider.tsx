"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") ?? "blue";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return <>{children}</>;
}
