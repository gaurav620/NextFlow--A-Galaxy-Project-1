import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const files = await prisma.mediaFile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const folders = await prisma.mediaFolder.findMany({
    where: { userId },
    include: { _count: { select: { files: true } } },
  });

  const serializedFiles = files.map((f) => ({
    id: f.id,
    name: f.name,
    fileName: f.fileName,
    mimeType: f.mimeType,
    size: f.size,
    url: f.url,
    source: f.source,
    favorite: f.favorite,
    createdAt: f.createdAt.toISOString(),
  }));

  const serializedFolders = folders.map((f) => ({
    id: f.id,
    name: f.name,
    fileCount: f._count.files,
  }));

  return <LibraryClient files={serializedFiles} folders={serializedFolders} />;
}
