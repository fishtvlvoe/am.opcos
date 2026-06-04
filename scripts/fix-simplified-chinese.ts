// 將 DB 中 series、franchise、brand 欄位的簡體中文轉換為繁體中文
// 執行方式：npx tsx scripts/fix-simplified-chinese.ts

import { db } from "@repo/database";
import { ensureConverterReady, toTraditionalChinese } from "../packages/api/modules/anismile/lib/opencc";

async function main() {
  await ensureConverterReady();

  const products = await db.anismileProduct.findMany({
    select: { id: true, series: true, franchise: true, brand: true },
  });

  let updated = 0;
  for (const p of products) {
    const newSeries = p.series ? toTraditionalChinese(p.series) : null;
    const newFranchise = p.franchise ? toTraditionalChinese(p.franchise) : null;
    const newBrand = p.brand ? toTraditionalChinese(p.brand) : null;

    if (newSeries !== p.series || newFranchise !== p.franchise || newBrand !== p.brand) {
      await db.anismileProduct.update({
        where: { id: p.id },
        data: {
          ...(newSeries !== p.series ? { series: newSeries } : {}),
          ...(newFranchise !== p.franchise ? { franchise: newFranchise } : {}),
          ...(newBrand !== p.brand ? { brand: newBrand } : {}),
        },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated}/${products.length} products.`);
  await db.$disconnect();
}

main().catch(console.error);
