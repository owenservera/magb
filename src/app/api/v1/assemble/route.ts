import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, target, implementation_language, include_tests, max_context_tokens } = body;

    // Simulate assembly based on the POC text search
    const capabilities = await store.db.capability.findMany({
        where: {
            OR: [
                { name: { contains: task.split(" ")[0] || "json", mode: 'insensitive' } },
            ]
        },
        take: 3
    });

    const capIds = capabilities.map(c => c.id);

    const relations = await store.db.relation.findMany({
        where: {
            sourceId: { in: capIds },
            sourceType: "capability",
            relationType: "REQUIRES"
        }
    });

    const atomIds = relations.filter(r => r.relTargetType === "atom").map(r => r.relTargetId);
    const algoIds = relations.filter(r => r.relTargetType === "algorithm").map(r => r.relTargetId);

    const atoms = await store.db.atom.findMany({ where: { id: { in: atomIds } } });
    const algos = await store.db.algorithm.findMany({ where: { id: { in: algoIds } } });

    const formattedAlgos = algos.map(a => ({
        id: a.id,
        name: a.name,
        purpose: a.purpose,
        implementation: {
            language: implementation_language,
            code: "# Implementation placeholder\npass"
        }
    }));

    return NextResponse.json({
      success: true,
      data: {
        task,
        target,
        implementation_language,
        usage_guide: `To implement '${task}':\n1. Use the provided templates.\n2. Apply algorithms.`,
        structural_templates: atoms.map(a => ({
            id: a.id,
            name: a.elementName,
            content: a.structure
        })),
        algorithms: formattedAlgos,
        coordinate_system: null,
      },
      meta: {
        templates_found: atoms.length,
        algorithms_found: algos.length,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
