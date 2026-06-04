import { db } from "@repo/database";

async function main() {
  try {
    const count = await db.anismileProduct.count({ take: 1 });
    console.log("DB OK, count:", count);
  } catch (e) {
    console.error("DB error:", e instanceof Error ? e.message : e);
  } finally {
    await db.$disconnect();
  }
}

main();
