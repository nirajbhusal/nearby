"use client";

import { useLayoutEffect, useMemo, useState } from "react";

/** Query string after hydration, without suspending static export. */
export function useClientSearch(): URLSearchParams {
  const [value, setValue] = useState("");
  useLayoutEffect(() => {
    const read = () => setValue(window.location.search);
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  return useMemo(() => new URLSearchParams(value), [value]);
}
