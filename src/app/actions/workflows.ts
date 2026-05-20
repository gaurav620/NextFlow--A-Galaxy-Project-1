"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { defaultWorkflowGraph } from "@/lib/types";
import { sampleWorkflowGraph } from "@/lib/sample-workflow";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function createWorkflow() {
  const userId = await requireUser();
  const wf = await prisma.workflow.create({
    data: {
      userId,
      name: "New Workflow",
      graph: defaultWorkflowGraph() as unknown as object,
    },
  });
  redirect(`/workflow/${wf.id}`);
}

export async function renameWorkflow(id: string, name: string) {
  const userId = await requireUser();
  await prisma.workflow.update({
    where: { id, userId },
    data: { name },
  });
  revalidatePath("/dashboard");
}

export async function createSampleWorkflow() {
  const userId = await requireUser();
  const wf = await prisma.workflow.create({
    data: {
      userId,
      name: "Trial Task Workflow",
      graph: sampleWorkflowGraph() as unknown as object,
    },
  });
  redirect(`/workflow/${wf.id}`);
}

export async function deleteWorkflow(id: string) {
  const userId = await requireUser();
  await prisma.workflow.delete({ where: { id, userId } });
  revalidatePath("/dashboard");
}
