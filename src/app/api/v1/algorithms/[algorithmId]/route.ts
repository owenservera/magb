import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { algorithmId: string } }
) {
  try {
    const { algorithmId } = params;

    const algorithm = await store.db.algorithm.findUnique({
      where: { id: algorithmId }
    });

    if (!algorithm) {
      return NextResponse.json(
        { success: false, status: "error", error: "Algorithm not found" },
        { status: 404 }
      );
    }

    const usages = await store.getNeighbors(algorithmId, "algorithm", "REQUIRES", "incoming");
    const usedBy = usages.map(u => ({ id: u.sourceId, name: u.sourceId })); // Mocked name mapping

    const result = {
      id: algorithm.id,
      name: algorithm.name,
      purpose: algorithm.purpose,
      domain: algorithm.domain,
      mathematical_foundation: {}, // Populated if JSON structure has it
      pseudocode: algorithm.pseudocode ? JSON.parse(algorithm.pseudocode) : [],
      complexity: {},
      parameters: [],
      edge_cases: [],
      numerical_stability: {},
      implementation: {}, // Populated with language logic
      available_languages: ["python"], // Mocked
      optimizations: [],
      test_vectors: [],
      used_by: usedBy
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
