export function rollLoot(lootTable, random = Math.random) {
  const results = [];
  for (const row of lootTable || []) {
    if (row.chance <= 0) continue;
    if (row.chance < 1 && random() >= row.chance) continue;
    const [minimum, maximum] = row.quantity;
    const quantityRoll = Math.min(0.999999999999, Math.max(0, random()));
    const quantity = minimum + Math.floor(quantityRoll * (maximum - minimum + 1));
    results.push({ itemId: row.itemId, quantity });
  }
  return results;
}
