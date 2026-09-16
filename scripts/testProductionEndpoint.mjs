import fetch from "node-fetch";

// Production Vercel URL
const PRODUCTION_URL = "https://zukas-kitchen-spinner.vercel.app/api/spin";

async function testProductionEndpoint() {
  console.log("🌐 TESTING LIVE PRODUCTION VERCEL ENDPOINT:", PRODUCTION_URL);
  console.log("===============================================================");

  const testMobile = `+919999${Math.floor(100000 + Math.random() * 900000)}`;

  // Test 1: GET /api/spin (Should return 405 Method Not Allowed)
  try {
    const getRes = await fetch(PRODUCTION_URL, { method: "GET" });
    const getBody = await getRes.text();
    console.log("\n1. GET Request Test:");
    console.log("   Status:", getRes.status);
    console.log("   Headers:", getRes.headers.get("content-type"));
    console.log("   Body:", getBody);
  } catch (err) {
    console.error("   GET Request Error:", err.message);
  }

  // Test 2: POST /api/spin First Spin (Dedicated Test Mobile)
  try {
    console.log(`\n2. First Spin Request (${testMobile}):`);
    const postRes1 = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: testMobile }),
    });

    const postBody1 = await postRes1.text();
    console.log("   Status:", postRes1.status);
    console.log("   Headers:", postRes1.headers.get("content-type"));
    console.log("   Body:", postBody1);

    if (postRes1.status === 200) {
      console.log("   ✅ FIRST SPIN SUCCESSFUL!");
    } else {
      console.log("   ❌ FIRST SPIN FAILED:", postRes1.status);
    }

    // Test 3: Immediate Second Spin Request (Same Test Mobile)
    console.log(`\n3. Immediate Second Spin Request (${testMobile}):`);
    const postRes2 = await fetch(PRODUCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: testMobile }),
    });

    const postBody2 = await postRes2.text();
    console.log("   Status:", postRes2.status);
    console.log("   Headers:", postRes2.headers.get("content-type"));
    console.log("   Body:", postBody2);

    if (postRes2.status === 400 && postBody2.includes("available")) {
      console.log("   ✅ COOLDOWN BLOCK SUCCESSFUL!");
    } else {
      console.log("   ❌ COOLDOWN BLOCK UNEXPECTED RESPONSE:", postRes2.status);
    }

  } catch (err) {
    console.error("   POST Request Error:", err.message);
  }
}

testProductionEndpoint();
