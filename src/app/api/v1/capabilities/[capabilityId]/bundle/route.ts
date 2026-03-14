import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { capabilityId: string } }
) {
  try {
    const { capabilityId } = params;
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("implementation_language") || "python";

    const capability = await store.db.capability.findUnique({
      where: { id: capabilityId }
    });

    if (!capability) {
      return NextResponse.json(
        { success: false, status: "error", error: "Capability not found" },
        { status: 404 }
      );
    }

    const relations = await store.getNeighbors(capabilityId, "capability", "REQUIRES", "outgoing");

    const templateIds = relations.filter(r => r.relTargetType === "atom" && r.relTargetId.includes("template")).map(r => r.relTargetId);
    const algorithmIds = relations.filter(r => r.relTargetType === "algorithm").map(r => r.relTargetId);

    const templates = await store.db.atom.findMany({
      where: { id: { in: templateIds } }
    });

    const algorithms = await store.db.algorithm.findMany({
      where: { id: { in: algorithmIds } }
    });

    const formattedAlgos = algorithms.map(a => {
        // Here we'd normally pick the preferred implementation based on the language requested
        // but for now, we'll return all and format them on the frontend
        return {
            id: a.id,
            name: a.name,
            content: {
                purpose: a.purpose,
                pseudocode: a.pseudocode ? JSON.parse(a.pseudocode) : [],
                implementations: {} // Needs real implementations populated
            }
        };
    });

    const bundle = {
      capability: {
        id: capability.id,
        name: capability.name,
        content: {
            description: capability.userDescription,
            complexity: capability.complexity
        }
      },
      structural_templates: templates.map(t => ({
        id: t.id,
        name: t.elementName,
        content: t.structure
      })),
      algorithms: formattedAlgos,
      coordinate_system: null, // Populate from atoms if present for target
      composition_rules: [], // Populate from relation/tags
      prerequisites: [], // Populate from relation
    };

    return NextResponse.json({
      success: true,
      data: bundle,
      meta: {
        capability_id: capabilityId,
        implementation_language: language,
        template_count: templates.length,
        algorithm_count: algorithms.length,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
