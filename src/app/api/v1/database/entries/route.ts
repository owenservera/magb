// src/app/api/v1/database/entries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    
    if (search) {
      where.OR = [
        { path: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } }
      ];
    }
    
    if (type) {
      where.entryType = type;
    }

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { path: "asc" },
        select: {
          id: true,
          path: true,
          entryType: true,
          contentStandard: true,
          updatedAt: true,
        }
      }),
      prisma.entry.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      meta: { total, limit, offset }
    });
  } catch (error) {
    console.error("Database entries error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}