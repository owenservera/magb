import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    const { targetId } = params;

    const atomId = `atom_${targetId}_minimal`;

    const minimalFile = await store.db.atom.findUnique({
      where: { id: atomId }
    });

    if (!minimalFile) {
      return NextResponse.json(
        { success: false, status: "error", error: "Minimal file not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: minimalFile.structure
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
