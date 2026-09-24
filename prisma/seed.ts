import { db } from "../src/lib/db";
import { seedCharacters } from "./seed-helpers";

async function main() {
  for (const c of seedCharacters()) {
    const existing = await db.character.findFirst({ where: { name: c.name } });
    if (!existing) await db.character.create({ data: c });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
