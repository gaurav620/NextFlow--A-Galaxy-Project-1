import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching runs from database...");
  try {
    const runs = await prisma.run.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        nodeRuns: true,
      },
    });

    console.log(`Found ${runs.length} recent runs:`);
    for (const r of runs) {
      console.log(`- Run ID: ${r.id}`);
      console.log(`  Workflow ID: ${r.workflowId}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Started At: ${r.startedAt}`);
      console.log(`  Finished At: ${r.finishedAt}`);
      console.log(`  Node Runs (${r.nodeRuns.length}):`);
      for (const nr of r.nodeRuns) {
        console.log(`    * Node: ${nr.nodeId} (${nr.nodeType}) -> Status: ${nr.status}`);
      }
    }
  } catch (err) {
    console.error("Error fetching runs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
