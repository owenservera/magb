import { NextRequest, NextResponse } from "next/server";
import { submitPetition, getPetitionStatus } from "@/pipeline/petition-engine";

/**
 * POST /api/v1/petitions
 *
 * Submit a new petition or get existing petition status.
 *
 * Request body:
 * {
 *   query: string;           // The user's natural language request
 *   userId?: string;         // Optional user ID
 *   priority?: "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | "BACKGROUND";
 *   context?: string;        // Optional context about what they're building
 *   targetOutputs?: string[]; // Desired output formats
 *   maxCostUsd?: number;     // Budget limit
 *   maxApiCalls?: number;    // API call limit
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     petitionId: string,
 *     status: string,
 *     message: string,
 *     estimatedCostUsd?: number,
 *     estimatedTimeMinutes?: number
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid 'query' field. Must be a non-empty string.",
        },
        { status: 400 },
      );
    }

    // Validate priority if provided
    const validPriorities = ["CRITICAL", "HIGH", "NORMAL", "LOW", "BACKGROUND"];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate budget constraints
    if (body.maxCostUsd !== undefined && typeof body.maxCostUsd !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "'maxCostUsd' must be a number.",
        },
        { status: 400 },
      );
    }

    if (
      body.maxApiCalls !== undefined &&
      (typeof body.maxApiCalls !== "number" || body.maxApiCalls < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "'maxApiCalls' must be a non-negative number.",
        },
        { status: 400 },
      );
    }

    // Submit the petition
    const result = await submitPetition(body.query, {
      userId: body.userId,
      priority: body.priority,
      context: body.context,
      targetOutputs: body.targetOutputs,
      maxCostUsd: body.maxCostUsd,
      maxApiCalls: body.maxApiCalls,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Petition submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit petition",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/petitions?id=<petitionId>
 *
 * Get petition status and progress.
 *
 * Query parameters:
 * - id: string (required) - The petition ID
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     petition: {...},
 *     threads: [...],
 *     progress: number (0.0 to 1.0)
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const petitionId = searchParams.get("id");

    if (!petitionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing 'id' query parameter",
        },
        { status: 400 },
      );
    }

    const status = await getPetitionStatus(petitionId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("Petition status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get petition status",
      },
      { status: 500 },
    );
  }
}
