import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Admin DB
const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

const SERVER_PRIZES = [
  { id: "25-off-combo", label: "₹25 OFF ON ORDER COMBO", weight: 10 },
  { id: "10-percent", label: "10% OFF", weight: 55 },
  { id: "20-off", label: "₹20 OFF", weight: 12 },
  { id: "better-luck", label: "BETTER LUCK NEXT TIME", weight: 10 },
  { id: "15-percent", label: "15% OFF", weight: 8 },
  { id: "30-off", label: "₹30 OFF", weight: 5 }
];

async function runProbabilityAudit() {
  console.log("📊 AUDITING FIRESTORE PRIZE WEIGHTS & SELECTION PROBABILITY");
  console.log("=================================================================");

  // 1. Read actual Firestore documents
  const prizesSnap = await db.collection("prizes").get();
  console.log("\n1. Current Firestore `prizes` Collection Data:");
  const activePrizes = [];

  prizesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    console.log(`   - ID: ${docSnap.id.padEnd(15)} | Name: ${(data.name || data.label).padEnd(25)} | Weight: ${data.weight} | Enabled: ${data.enabled}`);
    if (data.enabled !== false) {
      activePrizes.push({
        id: docSnap.id,
        label: data.name || data.label,
        weight: typeof data.weight === "number" ? data.weight : 0
      });
    }
  });

  // 2. Monte Carlo Simulation: 10,000 Spins
  console.log("\n2. Monte Carlo Simulation (10,000 Spins using server weighted algorithm):");
  const counts = {};
  activePrizes.forEach(p => counts[p.id] = 0);

  const totalWeight = activePrizes.reduce((sum, p) => sum + (p.weight || 0), 0);
  const ITERATIONS = 10000;

  for (let i = 0; i < ITERATIONS; i++) {
    let rand = Math.random() * totalWeight;
    let selected = activePrizes[activePrizes.length - 1];

    for (const item of activePrizes) {
      if (rand < (item.weight || 0)) {
        selected = item;
        break;
      }
      rand -= (item.weight || 0);
    }
    counts[selected.id]++;
  }

  console.log(`\nPrize ID              Count       Approx %     Expected %`);
  console.log(`---------------------------------------------------------`);
  activePrizes.forEach(p => {
    const cnt = counts[p.id];
    const pct = ((cnt / ITERATIONS) * 100).toFixed(2);
    const expected = p.weight;
    console.log(`${p.id.padEnd(20)} ${String(cnt).padEnd(11)} ${pct}%`.padEnd(41) + `${expected}%`);
  });

  process.exit(0);
}

runProbabilityAudit().catch(err => {
  console.error("Probability audit error:", err);
  process.exit(1);
});
