import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "no_files" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
    await mkdir(uploadDir, { recursive: true });

    const results = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      const mediaFile = await prisma.mediaFile.create({
        data: {
          userId,
          name: file.name,
          fileName: uniqueName,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          url: `/uploads/${userId}/${uniqueName}`,
          source: "upload",
        },
      });
      results.push(mediaFile);
    }

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
