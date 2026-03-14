import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    const { targetId } = params;

    const target = await store.db.target.findUnique({
      where: { id: targetId },
      include: {
        capabilities: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, status: "error", error: "Target not found" },
        { status: 404 }
      );
    }

    // Group capabilities by category
    const capabilityTree: Record<string, any[]> = {};
    for (const cap of target.capabilities) {
      const category = cap.category || "General";
      if (!capabilityTree[category]) {
        capabilityTree[category] = [];
      }
      
      // Determine if it has algorithms or templates based on relations
      const algoRelations = await store.getNeighbors(cap.id, "capability", "REQUIRES", "outgoing");
      const hasAlgorithm = algoRelations.some(r => r.relTargetType === "algorithm");
      const hasTemplate = algoRelations.some(r => r.relTargetType === "atom" && r.relTargetId.includes("template"));

      capabilityTree[category].push({
        id: cap.id,
        name: cap.name,
        description: cap.userDescription || "",
        complexity: cap.complexity,
        has_template: hasTemplate,
        has_algorithm: hasAlgorithm,
        requires: [], // To be implemented with prerequisite relations
      });
    }

    const result = {
      id: target.id,
      name: target.name,
      kind: target.kind,
      version: "1.0", // To be implemented with version tracking
      tags: target.distinguishing,
      extensions: target.extensions,
      media_types: target.mediaTypes,
      confidence: 0.0, // To be implemented
      capabilities: capabilityTree,
      capability_count: target.capabilities.length,
      vitality: null // To be implemented with vitality tables
    };

    return NextResponse.json({
      success: true,
      data: {
        content: result
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
