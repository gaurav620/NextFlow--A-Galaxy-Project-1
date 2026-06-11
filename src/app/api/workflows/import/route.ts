import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema, defaultWorkflowGraph } from "@/lib/types";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = body.name || "Imported Workflow";

    // Try to parse the graph, fallback to default
    let graph: object;
    const parsed = WorkflowGraphSchema.safeParse(body.graph);
    if (parsed.success) {
      graph = parsed.data as unknown as object;
    } else {
      // Maybe the whole body IS the graph
      const parsed2 = WorkflowGraphSchema.safeParse(body);
      if (parsed2.success) {
        graph = parsed2.data as unknown as object;
      } else {
        graph = defaultWorkflowGraph() as unknown as object;
      }
    }

    const wf = await prisma.workflow.create({
      data: { userId, name, graph },
    });

    return NextResponse.json({ id: wf.id });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "import_failed" }, { status: 500 });
  }
}
