// src/app/api/v1/database/capabilities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { technicalDescription: { contains: search, mode: "insensitive" } }
      ];
    }

    const [capabilities, total] = await Promise.all([
      prisma.capability.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          technicalDescription: true,
          userDescription: true,
          complexity: true,
          updatedAt: true,
        }
      }),
      prisma.capability.count({ where })
    ]);

    // Map the capabilities to match the CapabilitySummary interface
    const capabilitySummaries = capabilities.map((cap: any) => ({
      id: cap.id,
      name: cap.name,
      description: cap.technicalDescription || cap.userDescription || '',
      complexity: cap.complexity?.toLowerCase() || undefined,
      updatedAt: cap.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: capabilitySummaries,
      meta: { total, limit, offset }
    });
  } catch (error) {
    console.error("Database capabilities error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch capabilities" },
      { status: 500 }
    );
  }
}