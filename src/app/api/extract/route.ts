import { NextResponse } from "next/server";

/** Stub — Nearby ranking uses /api/nearby. Kept for future ingest tools. */
export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Not used by Nearby yet — try POST /api/nearby" },
    { status: 501 }
  );
}
