import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, target, implementation_language, max_context_tokens } = body;

    // A very rudimentary context assembly for the POC
    // In reality this would embed the task and do a vector search

    const capabilities = await store.db.capability.findMany({
        where: {
            OR: [
                { name: { contains: task.split(" ")[0] || "json", mode: 'insensitive' } },
            ]
        },
        take: 5
    });

    let contextData = "";
    capabilities.forEach(c => {
        contextData += `Capability: ${c.name}\n${c.userDescription}\n\n`;
    });

    const formattedContext = `=== KNOWLEDGE CONTEXT FOR: ${task} ===
Target format: ${target}
Implementation language: ${implementation_language || 'python'}

Use the following reference knowledge to implement the task.

${contextData || "No relevant capabilities found."}

=== END KNOWLEDGE CONTEXT ===`;

    return new NextResponse(formattedContext, {
        headers: {
            'Content-Type': 'text/plain',
            'X-Token-Estimate': String(formattedContext.split(" ").length * 1.3),
            'X-Target': target
        }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "error", error: error.message },
      { status: 500 }
    );
  }
}
