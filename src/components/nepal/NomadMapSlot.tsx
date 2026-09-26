"use client";

import dynamic from "next/dynamic";
import type { NomadPin } from "@/components/nepal/NomadMap";

const NomadMap = dynamic(() => import("@/components/nepal/NomadMap"), {
  ssr: false,
  loading: () => <div className="nomad-map nomad-map-loading" role="status" aria-label="Loading map" />,
});

export function NomadMapSlot({ pins }: { pins: NomadPin[] }) {
  return <NomadMap pins={pins} />;
}
