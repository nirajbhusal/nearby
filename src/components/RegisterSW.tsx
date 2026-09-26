"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {
        /* offline or unsupported host */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
