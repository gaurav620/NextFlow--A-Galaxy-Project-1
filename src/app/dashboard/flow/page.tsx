import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FlowPageClient } from "./flow-client";

export const dynamic = "force-dynamic";

export default async function FlowPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  const serialized = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    updatedAt: w.updatedAt.toISOString(),
  }));

  return <FlowPageClient workflows={serialized} />;
}
