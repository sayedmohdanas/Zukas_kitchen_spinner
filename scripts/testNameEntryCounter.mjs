import handler from "../api/spin.js";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getAdminDb() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getFirestore(existingApps[0]);
  }
  const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error("serviceAccountKey.json missing for test execution.");
  }
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const app = initializeApp({
    credential: cert(sa),
    projectId: sa.project_id || "zukas-kitchen-spin-win",
  });
  return getFirestore(app);
}

function createMockReqRes(body = {}, method = "POST") {
  const req = {
    method,
    body,
  };
  let statusCode = 200;
  let responseData = null;
  const headers = {};

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(key, value) {
      headers[key] = value;
    },
    json(data) {
      responseData = data;
      return { statusCode, data: responseData, headers };
    },
  };

  return { req, res, getResult: () => ({ statusCode, responseData, headers }) };
}

async function runNameEntryCounterTests() {
  console.log("🧪 TESTING FIRESTORE nameEntryCount ANALYTICS COUNTER IN /api/spin");
  console.log("====================================================================");

  const db = getAdminDb();
  const campaignRef = db.collection("campaigns").doc("spin_and_win");

  // Ensure campaign doc exists and is enabled for testing
  await campaignRef.set(
    {
      enabled: true,
      repeatEnabled: true,
      repeatAfterDays: 2,
    },
    { merge: true }
  );

  // Read current nameEntryCount before test run
  const initialSnap = await campaignRef.get();
  const initialCount = initialSnap.exists ? initialSnap.data().nameEntryCount || 0 : 0;
  console.log(`📊 Initial nameEntryCount in Firestore: ${initialCount}`);

  // Test 1: Invalid Name (Missing/empty) -> Must return 400 and NOT increment counter
  const { req: req1, res: res1, getResult: g1 } = createMockReqRes({ name: "", mobile: "9876543210" });
  await handler(req1, res1);
  const r1 = g1();
  const snap1 = await campaignRef.get();
  const count1 = snap1.data().nameEntryCount || 0;
  const pass1 = r1.statusCode === 400 && count1 === initialCount;
  console.log(`1. Empty Name Submission → Status: ${r1.statusCode}, Count: ${count1} (Delta: ${count1 - initialCount}) → ${pass1 ? "PASS" : "FAIL"}`);
  if (!pass1) throw new Error("Test 1 Failed");

  // Test 2: Invalid Name (< 2 chars) -> Must return 400 and NOT increment counter
  const { req: req2, res: res2, getResult: g2 } = createMockReqRes({ name: "A", mobile: "9876543210" });
  await handler(req2, res2);
  const r2 = g2();
  const snap2 = await campaignRef.get();
  const count2 = snap2.data().nameEntryCount || 0;
  const pass2 = r2.statusCode === 400 && count2 === initialCount;
  console.log(`2. Short Name Submission (<2 chars) → Status: ${r2.statusCode}, Count: ${count2} (Delta: ${count2 - initialCount}) → ${pass2 ? "PASS" : "FAIL"}`);
  if (!pass2) throw new Error("Test 2 Failed");

  // Test 3: Invalid Name (> 50 chars) -> Must return 400 and NOT increment counter
  const longName = "A".repeat(51);
  const { req: req3, res: res3, getResult: g3 } = createMockReqRes({ name: longName, mobile: "9876543210" });
  await handler(req3, res3);
  const r3 = g3();
  const snap3 = await campaignRef.get();
  const count3 = snap3.data().nameEntryCount || 0;
  const pass3 = r3.statusCode === 400 && count3 === initialCount;
  console.log(`3. Long Name Submission (>50 chars) → Status: ${r3.statusCode}, Count: ${count3} (Delta: ${count3 - initialCount}) → ${pass3 ? "PASS" : "FAIL"}`);
  if (!pass3) throw new Error("Test 3 Failed");

  // Test 4: Valid Name Submission -> Must return 200 and increment counter by EXACTLY +1
  const testMobile1 = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req4, res: res4, getResult: g4 } = createMockReqRes({ name: "Rahul Sharma", mobile: testMobile1 });
  await handler(req4, res4);
  const r4 = g4();
  const snap4 = await campaignRef.get();
  const count4 = snap4.data().nameEntryCount || 0;
  const pass4 = r4.statusCode === 200 && r4.responseData.success === true && count4 === initialCount + 1;
  console.log(`4. Valid Spin 1 ("Rahul Sharma") → Status: ${r4.statusCode}, Count: ${count4} (Delta: +${count4 - initialCount}) → ${pass4 ? "PASS" : "FAIL"}`);
  if (!pass4) throw new Error("Test 4 Failed");

  // Test 5: Second Valid Spin with distinct mobile -> Must increment counter by EXACTLY +1 again
  const testMobile2 = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req5, res: res5, getResult: g5 } = createMockReqRes({ name: "Priya Patel", mobile: testMobile2 });
  await handler(req5, res5);
  const r5 = g5();
  const snap5 = await campaignRef.get();
  const count5 = snap5.data().nameEntryCount || 0;
  const pass5 = r5.statusCode === 200 && r5.responseData.success === true && count5 === initialCount + 2;
  console.log(`5. Valid Spin 2 ("Priya Patel") → Status: ${r5.statusCode}, Count: ${count5} (Delta: +${count5 - count4}) → ${pass5 ? "PASS" : "FAIL"}`);
  if (!pass5) throw new Error("Test 5 Failed");

  // Test 6: Cooldown Rejection -> Re-submitting for testMobile1 (already spun) must return 400 and NOT increment counter
  const { req: req6, res: res6, getResult: g6 } = createMockReqRes({ name: "Rahul Sharma", mobile: testMobile1 });
  await handler(req6, res6);
  const r6 = g6();
  const snap6 = await campaignRef.get();
  const count6 = snap6.data().nameEntryCount || 0;
  const pass6 = r6.statusCode === 400 && r6.responseData.success === false && count6 === count5;
  console.log(`6. Cooldown Rejection (Mobile ${testMobile1}) → Status: ${r6.statusCode}, Count: ${count6} (Delta: ${count6 - count5}) → ${pass6 ? "PASS" : "FAIL"}`);
  if (!pass6) throw new Error("Test 6 Failed");

  // Test 7: Campaign Disabled -> Must return 400 and NOT increment counter
  await campaignRef.update({ enabled: false });
  const testMobile3 = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req7, res: res7, getResult: g7 } = createMockReqRes({ name: "Vikram Kumar", mobile: testMobile3 });
  await handler(req7, res7);
  const r7 = g7();
  const snap7 = await campaignRef.get();
  const count7 = snap7.data().nameEntryCount || 0;
  const pass7 = r7.statusCode === 400 && r7.responseData.success === false && count7 === count6;
  console.log(`7. Campaign Disabled Rejection → Status: ${r7.statusCode}, Count: ${count7} (Delta: ${count7 - count6}) → ${pass7 ? "PASS" : "FAIL"}`);
  if (!pass7) throw new Error("Test 7 Failed");

  // Restore campaign enabled status
  await campaignRef.update({ enabled: true });

  // Test 8: Public API Response Security Check -> Ensure nameEntryCount is NEVER exposed to client
  const testMobile4 = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req8, res: res8, getResult: g8 } = createMockReqRes({ name: "Ananya Roy", mobile: testMobile4 });
  await handler(req8, res8);
  const r8 = g8();
  const pass8 = r8.statusCode === 200 && r8.responseData.nameEntryCount === undefined;
  console.log(`8. Response Payload Privacy Check → nameEntryCount Exposed in Response: ${r8.responseData.nameEntryCount !== undefined ? "YES (FAIL)" : "NO (PASS)"}`);
  if (!pass8) throw new Error("Test 8 Failed");

  // Test 9: Concurrent Requests -> 3 simultaneous valid spin requests
  const mobA = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const mobB = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const mobC = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const snapBeforeConcurrent = await campaignRef.get();
  const countBeforeConcurrent = snapBeforeConcurrent.data().nameEntryCount || 0;

  const { req: reqA, res: resA, getResult: gA } = createMockReqRes({ name: "User A", mobile: mobA });
  const { req: reqB, res: resB, getResult: gB } = createMockReqRes({ name: "User B", mobile: mobB });
  const { req: reqC, res: resC, getResult: gC } = createMockReqRes({ name: "User C", mobile: mobC });

  await Promise.all([handler(reqA, resA), handler(reqB, resB), handler(reqC, resC)]);

  const snapAfterConcurrent = await campaignRef.get();
  const countAfterConcurrent = snapAfterConcurrent.data().nameEntryCount || 0;
  const concurrentDelta = countAfterConcurrent - countBeforeConcurrent;
  const pass9 = concurrentDelta === 3;
  console.log(`9. Concurrent 3 Valid Requests → Initial: ${countBeforeConcurrent}, Final: ${countAfterConcurrent} (Delta: +${concurrentDelta}) → ${pass9 ? "PASS" : "FAIL"}`);
  if (!pass9) throw new Error("Test 9 Failed");

  console.log("\n====================================================================");
  console.log(`✅ ALL 9 ANALYTICS COUNTER INTEGRITY TESTS PASSED SUCCESSFULLY!`);
  console.log(`🏆 Final Firestore nameEntryCount: ${countAfterConcurrent}`);
}

runNameEntryCounterTests().catch((err) => {
  console.error("❌ nameEntryCount Test Failure:", err.message);
  process.exit(1);
});
