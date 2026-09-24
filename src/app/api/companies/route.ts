import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCompanyDTO } from "@/lib/companies";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const location = (searchParams.get("location") ?? "").trim().toLowerCase();

  const rows = await prisma.company.findMany({ orderBy: { name: "asc" } });
  const companies = rows
    .map(toCompanyDTO)
    .filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.oneLiner ?? "").toLowerCase().includes(q);
      const matchesLoc =
        !location ||
        c.locations.some((l) => l.toLowerCase().includes(location));
      return matchesQ && matchesLoc;
    });

  return NextResponse.json({ companies, count: companies.length });
}
