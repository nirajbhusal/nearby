import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  rankNearbyEvents,
  toEventDTO,
  upcomingEvents,
} from "@/lib/events";

export async function GET(req: NextRequest) {
  const place = req.nextUrl.searchParams.get("place") ?? "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    20,
    Math.max(1, limitParam ? parseInt(limitParam, 10) || 5 : 5)
  );

  const rows = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
  });
  const events = rows.map(toEventDTO);

  if (place.trim()) {
    const ranked = rankNearbyEvents(events, place, limit);
    return NextResponse.json({
      place: place.trim(),
      events: ranked.events,
      eventsSummary: ranked.eventsSummary,
    });
  }

  const upcoming = upcomingEvents(events, limit);
  return NextResponse.json({
    place: "",
    events: upcoming,
    eventsSummary: "Upcoming AI meetups.",
  });
}
