import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectsClient } from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { workflows: true } } },
  });

  const serialized = projects.map((p) => ({
    id: p.id,
    name: p.name,
    workflowCount: p._count.workflows,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectsClient projects={serialized} />;
}
