import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCompanyDTO } from "@/lib/companies";
import { rankNearby } from "@/lib/nearby";
import { rankNearbyEvents, toEventDTO } from "@/lib/events";

export async function POST(req: NextRequest) {
  let body: { place?: string; intent?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Expected JSON body with place and optional intent" },
      { status: 400 }
    );
  }

  const place = typeof body.place === "string" ? body.place : "";
  const intent = typeof body.intent === "string" ? body.intent : "";

  if (!place.trim() && !intent.trim()) {
    return NextResponse.json(
      { error: "Provide a place and/or intent" },
      { status: 400 }
    );
  }

  const [companyRows, eventRows] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({ orderBy: { startsAt: "asc" } }),
  ]);

  const companies = companyRows.map(toCompanyDTO);
  const events = eventRows.map(toEventDTO);
  const jobResult = rankNearby(companies, place, intent);
  const eventResult = rankNearbyEvents(events, place);

  return NextResponse.json({
    ...jobResult,
    events: eventResult.events,
    eventsSummary: eventResult.eventsSummary,
  });
}
