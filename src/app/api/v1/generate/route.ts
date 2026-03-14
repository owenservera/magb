// src/app/api/v1/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { loadConfig } from "@/engine/config";
import { UniversalKnowledgeStore } from "@/engine/store";
import { ZaiClient } from "@/engine/llm/ZaiClient";
import { GenerationExecutor } from "@/engine/generation/executor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, targetType = "DATA_FORMAT", budgetUsd = 10.0 } = body;

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Target is required" },
        { status: 400 }
      );
    }

    // Create a new generation run
    const runId = uuidv4();
    const run = await prisma.generationRun.create({
      data: {
        id: runId,
        targetId: target,
        status: "RUNNING",
        config: JSON.stringify({
          targetType,
          budgetUsd,
          startedAt: new Date().toISOString(),
        }),
      },
    });

    // Start the generation process in the background
    // In a real implementation, this would be queued to a worker
    // For now, we'll just return the run ID and let the frontend poll
    
    return NextResponse.json({
      success: true,
      data: {
        runId,
        status: "STARTED",
        message: `Generation started for target ${target}`,
      }
    });
  } catch (error) {
    console.error("Generation start error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start generation" },
      { status: 500 }
    );
  }
}

// Get run status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("runId");
    
    if (!runId) {
      return NextResponse.json(
        { success: false, error: "runId is required" },
        { status: 400 }
      );
    }

    const run = await prisma.generationRun.findUnique({
      where: { id: runId },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            kind: true,
          }
        }
      }
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: "Run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error("Get run status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get run status" },
      { status: 500 }
    );
  }
}