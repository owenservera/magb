import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { structureId: string } }
) {
  try {
    const { structureId } = params;

    const atom = await store.db.atom.findUnique({
      where: { id: structureId }
    });

    if (!atom) {
      return NextResponse.json(
        { success: false, status: "error", error: "Structure not found" },
        { status: 404 }
      );
    }

    const usages = await store.getNeighbors(structureId, "atom", "REQUIRES", "incoming");
    const servesCapabilities = usages.map(u => ({ id: u.sourceId, name: u.sourceId })); // Mocked name mapping

    const result = {
      id: atom.id,
      name: atom.elementName,
      content: atom.structure,
      serves_capabilities: servesCapabilities
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
