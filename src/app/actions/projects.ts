"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function createProject() {
  const userId = await requireUser();
  const project = await prisma.project.create({
    data: {
      userId,
      name: "New Project",
    },
  });
  revalidatePath("/dashboard/projects");
  return project;
}

export async function renameProject(id: string, name: string) {
  const userId = await requireUser();
  await prisma.project.update({
    where: { id, userId },
    data: { name },
  });
  revalidatePath("/dashboard/projects");
}

export async function deleteProject(id: string) {
  const userId = await requireUser();
  await prisma.project.delete({ where: { id, userId } });
  revalidatePath("/dashboard/projects");
}
