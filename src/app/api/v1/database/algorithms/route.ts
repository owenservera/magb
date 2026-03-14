// src/app/api/v1/database/algorithms/route.ts
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
        { purpose: { contains: search, mode: "insensitive" } }
      ];
    }

    const [algorithms, total] = await Promise.all([
      prisma.algorithm.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          purpose: true,
          category: true,
          domain: true,
          updatedAt: true,
        }
      }),
      prisma.algorithm.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: algorithms,
      meta: { total, limit, offset }
    });
  } catch (error) {
    console.error("Database algorithms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch algorithms" },
      { status: 500 }
    );
  }
}