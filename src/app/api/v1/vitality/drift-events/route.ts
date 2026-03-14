import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [] // Simplified for POC
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
