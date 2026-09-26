"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ProvinceRecord } from "@/lib/nepal/provinces";

const NepalMap = dynamic(() => import("@/components/home/NepalMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton nepal-map-canvas" role="status" aria-label="Loading the map" />,
});

export function NepalMapSlot({ provinces }: { provinces: ProvinceRecord[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShow(true);
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="nepal-map">
      {show ? <NepalMap provinces={provinces} /> : <div className="map-skeleton nepal-map-canvas" role="status" aria-label="Loading the map" />}
    </div>
  );
}
