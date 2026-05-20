import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorkflowGraphSchema } from "@/lib/types";
import { executeWorkflow } from "@/lib/execute";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  targetNodeIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!parsed.success)
    return new Response(JSON.stringify({ error: "invalid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  const { workflowId, scope, targetNodeIds } = parsed.data;

  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!wf)
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  const graphParsed = WorkflowGraphSchema.safeParse(wf.graph);
  if (!graphParsed.success)
    return new Response(JSON.stringify({ error: "invalid_graph" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  const graph = graphParsed.data;

  const targetIds = new Set(
    scope === "full"
      ? graph.nodes.map((n) => n.id)
      : targetNodeIds ?? []
  );

  const run = await prisma.run.create({
    data: {
      workflowId,
      userId,
      scope,
      status: "running",
      nodeRuns: {
        create: graph.nodes
          .filter((n) => targetIds.has(n.id))
          .map((n) => ({
            nodeId: n.id,
            nodeType: n.type,
            status: "pending",
          })),
      },
    },
  });

  // Return SSE streaming response — execution runs INSIDE the stream
  // so the serverless function stays alive on Vercel until completion.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream closed
        }
      };

      // Send the run ID first
      send({ type: "hello", runId: run.id });

      try {
        await executeWorkflow({
          runId: run.id,
          workflowId,
          graph: graph as Parameters<typeof executeWorkflow>[0]["graph"],
          scope,
          targetNodeIds,
          onEvent: (evt) => send({ ...evt }),
        });
      } catch (err) {
        console.error("Run execution failed", err);
        send({ type: "run-error", error: err instanceof Error ? err.message : String(err) });
      }

      try {
        controller.close();
      } catch {
        // already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
