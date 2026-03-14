import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    const { targetId } = params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = { targetId };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const capabilities = await store.db.capability.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // Formatting for the response
    const formattedCaps = await Promise.all(capabilities.map(async (cap) => {
      const algoRelations = await store.getNeighbors(cap.id, "capability", "REQUIRES", "outgoing");
      const hasAlgorithm = algoRelations.some(r => r.relTargetType === "algorithm");

      return {
        id: cap.id,
        name: cap.name,
        description: cap.userDescription || "",
        category: cap.category,
        complexity: cap.complexity,
        requires: [], // To be implemented with relations
        has_algorithm: hasAlgorithm,
        parameters: [], // Derived from atoms/algorithms
      };
    }));

    return NextResponse.json({
      success: true,
      data: formattedCaps,
      meta: {
        total: formattedCaps.length,
        target: targetId
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
