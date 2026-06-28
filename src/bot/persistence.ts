import { readFileSync, writeFileSync, existsSync } from "fs";
import { marriages, interactionCounts, pendingProposals } from "./data.js";
import type { Marriage, InteractionCount, PendingProposal } from "./data.js";

const DATA_FILE = "./bot-data.json";

interface SavedData {
  marriages: [string, Marriage][];
  interactionCounts: [string, number][];
  pendingProposals: [string, PendingProposal][];
}

export function loadData(): void {
  if (!existsSync(DATA_FILE)) {
    console.log("📂 No saved data found. Starting fresh.");
    return;
  }
  try {
    const raw = readFileSync(DATA_FILE, "utf-8");
    const saved: SavedData = JSON.parse(raw);

    for (const [k, v] of saved.marriages ?? []) marriages.set(k, v);
    for (const [k, v] of saved.interactionCounts ?? []) interactionCounts.set(k, v);

    const now = Date.now();
    for (const [k, v] of saved.pendingProposals ?? []) {
      if (now - v.timestamp < 60000) pendingProposals.set(k, v);
    }

    console.log(
      `📂 Loaded: ${marriages.size} marriages, ${interactionCounts.size} interactions.`
    );
  } catch (err) {
    console.error("❌ Failed to load data:", err);
  }
}

export function saveData(): void {
  try {
    const data: SavedData = {
      marriages: [...marriages.entries()],
      interactionCounts: [...interactionCounts.entries()],
      pendingProposals: [...pendingProposals.entries()],
    };
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Failed to save data:", err);
  }
}

export function startAutoSave(intervalMs = 30000): void {
  setInterval(() => {
    saveData();
  }, intervalMs);
  console.log(`💾 Auto-save every ${intervalMs / 1000}s enabled.`);
}
