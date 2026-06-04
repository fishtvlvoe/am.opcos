import { runSync } from "./crawler.js";

console.log("Starting sync...");
const start = Date.now();

runSync()
  .then((result) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\nSync completed in ${elapsed}s:`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  });
