"use client";

import { useEffect, useState } from "react";
import type { ToastDetail } from "@/lib/toast";

export function ToastHost() {
  const [toast, setToast] = useState<ToastDetail | null>(null);

  useEffect(() => {
    let timer = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      setToast(detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener("nearby-toast", onToast);
    return () => {
      window.removeEventListener("nearby-toast", onToast);
      window.clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;
  return (
    <p className="toast" role="status">
      <span>{toast.message}</span>
      {toast.undo ? (
        <>
          <span aria-hidden="true"> · </span>
          <button
            type="button"
            onClick={() => {
              toast.undo?.();
              setToast(null);
            }}
          >
            Undo
          </button>
        </>
      ) : null}
    </p>
  );
}
