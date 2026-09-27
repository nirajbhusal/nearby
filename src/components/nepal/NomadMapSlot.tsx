"use client";

import dynamic from "next/dynamic";
import type { NomadPin } from "@/components/nepal/NomadMap";
import { Peek } from "@/components/peek/Peek";

const NomadMap = dynamic(() => import("@/components/nepal/NomadMap"), {
  ssr: false,
  loading: () => (
    <div className="nomad-map nomad-map-loading peek-stage" role="status" aria-label="Loading map">
      <Peek size={64} state="looking" />
    </div>
  ),
});

export function NomadMapSlot({ pins }: { pins: NomadPin[] }) {
  return <NomadMap pins={pins} />;
}
