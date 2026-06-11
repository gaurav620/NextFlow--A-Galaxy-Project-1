"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function toggleFavorite(id: string) {
  const userId = await requireUser();
  const file = await prisma.mediaFile.findFirst({ where: { id, userId } });
  if (!file) throw new Error("Not found");
  await prisma.mediaFile.update({
    where: { id },
    data: { favorite: !file.favorite },
  });
  revalidatePath("/dashboard/library");
}

export async function deleteMediaFile(id: string) {
  const userId = await requireUser();
  await prisma.mediaFile.delete({ where: { id, userId } });
  revalidatePath("/dashboard/library");
}

export async function createFolder(name: string) {
  const userId = await requireUser();
  await prisma.mediaFolder.create({ data: { userId, name } });
  revalidatePath("/dashboard/library");
}
