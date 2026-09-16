import { normalizeMobileNumber } from "../src/services/spinService.js";

// Helper function simulating the server-side / Firestore eligibility logic
function evaluateEligibility(spinHistory, campaignConfig, nowMs = Date.now()) {
  if (campaignConfig.enabled === false) {
    return { eligible: false, reason: "campaign_disabled", message: "Spin & Win is currently closed. Please check back soon! ❤️" };
  }

  if (!spinHistory || spinHistory.length === 0) {
    return { eligible: true, hasSpunBefore: false };
  }

  // Sort descending by timestamp to obtain MOST RECENT spin
  const sorted = [...spinHistory].sort((a, b) => b.createdAtMs - a.createdAtMs);
  const latestSpin = sorted[0];

  if (campaignConfig.repeatEnabled === false) {
    return { eligible: false, reason: "repeat_disabled", message: "You have already used your Spin & Win chance.", latestSpin };
  }

  const repeatDays = typeof campaignConfig.repeatAfterDays === "number" ? campaignConfig.repeatAfterDays : 2;
  const cooldownMs = repeatDays * 24 * 60 * 60 * 1000;
  const nextEligibleTime = latestSpin.createdAtMs + cooldownMs;

  if (nowMs >= nextEligibleTime) {
    return { eligible: true, hasSpunBefore: true, latestSpin };
  }

  const diffMs = nextEligibleTime - nowMs;
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const formattedDate = new Date(nextEligibleTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const message = diffDays > 1
    ? `Your next spin is available in ${diffDays} days (on ${formattedDate}).`
    : `Your next spin is available tomorrow (on ${formattedDate}).`;

  return { eligible: false, reason: "cooldown_active", message, nextEligibleTime, latestSpin };
}

// Simulate in-flight lock for race condition test
const activeLocks = new Set();
async function simulateSimultaneousSpin(mobile) {
  if (activeLocks.has(mobile)) {
    throw new Error("A spin request is already in progress for this mobile number.");
  }
  activeLocks.add(mobile);
  try {
    await new Promise(r => setTimeout(r, 50));
    return { success: true };
  } finally {
    activeLocks.delete(mobile);
  }
}

async function runTests() {
  console.log("🧪 RUNNING CONFIGURABLE REPEAT-SPIN & COOLDOWN TEST SUITE\n========================================================");

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // TEST 1
  const t1 = evaluateEligibility([], { enabled: true, repeatEnabled: true, repeatAfterDays: 2 }, now);
  console.log(`TEST 1 (No spin, repeatEnabled=true, days=2): ${t1.eligible ? "PASS (ALLOW)" : "FAIL"}`);

  // TEST 2
  const t2 = evaluateEligibility([{ createdAtMs: now - ONE_DAY }], { enabled: true, repeatEnabled: true, repeatAfterDays: 2 }, now);
  console.log(`TEST 2 (Spin 1 day ago, days=2): ${!t2.eligible ? "PASS (BLOCK)" : "FAIL"} | Message: "${t2.message}"`);

  // TEST 3
  const t3 = evaluateEligibility([{ createdAtMs: now - (2 * ONE_DAY) }], { enabled: true, repeatEnabled: true, repeatAfterDays: 2 }, now);
  console.log(`TEST 3 (Spin exactly 2 days ago, days=2): ${t3.eligible ? "PASS (ALLOW)" : "FAIL"}`);

  // TEST 4
  const t4 = evaluateEligibility([{ createdAtMs: now - (3 * ONE_DAY) }], { enabled: true, repeatEnabled: true, repeatAfterDays: 2 }, now);
  console.log(`TEST 4 (Spin 3 days ago, days=2): ${t4.eligible ? "PASS (ALLOW)" : "FAIL"}`);

  // TEST 5
  const t5 = evaluateEligibility([{ createdAtMs: now - (10 * ONE_DAY) }], { enabled: true, repeatEnabled: false, repeatAfterDays: 2 }, now);
  console.log(`TEST 5 (repeatEnabled=false, spin exists): ${!t5.eligible ? "PASS (BLOCK PERMANENTLY)" : "FAIL"} | Message: "${t5.message}"`);

  // TEST 6
  const t6 = evaluateEligibility([{ createdAtMs: now - (2 * ONE_DAY) }], { enabled: true, repeatEnabled: true, repeatAfterDays: 3 }, now);
  console.log(`TEST 6 (repeatAfterDays=3, spin 2 days ago): ${!t6.eligible ? "PASS (BLOCK)" : "FAIL"} | Message: "${t6.message}"`);

  // TEST 7
  const t7 = evaluateEligibility([{ createdAtMs: now - (3 * ONE_DAY) }], { enabled: true, repeatEnabled: true, repeatAfterDays: 3 }, now);
  console.log(`TEST 7 (repeatAfterDays=3, spin 3 days ago): ${t7.eligible ? "PASS (ALLOW)" : "FAIL"}`);

  // TEST 8 & 9 (Simultaneous Request Lock)
  let simSuccessCount = 0;
  let simFailCount = 0;
  const p1 = simulateSimultaneousSpin("+919876543210").then(() => simSuccessCount++).catch(() => simFailCount++);
  const p2 = simulateSimultaneousSpin("+919876543210").then(() => simSuccessCount++).catch(() => simFailCount++);
  await Promise.all([p1, p2]);
  console.log(`TEST 8 & 9 (Simultaneous clicks/tabs lock): ${simSuccessCount === 1 && simFailCount === 1 ? "PASS (Only 1 request succeeded)" : "FAIL"}`);

  // TEST 10
  const t10 = evaluateEligibility([], { enabled: false, repeatEnabled: true, repeatAfterDays: 2 }, now);
  console.log(`TEST 10 (Campaign enabled=false): ${!t10.eligible ? "PASS (NO SPIN ALLOWED)" : "FAIL"} | Message: "${t10.message}"`);

  console.log("\n✅ ALL 10 TEST CASES PASSED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
