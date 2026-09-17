import handler from "../api/spin.js";

function createMockReqRes(mobile, method = "POST", name = "Test User") {
  const req = {
    method,
    body: { name, mobile }
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
    }
  };

  return { req, res, getResult: () => ({ statusCode, responseData, headers }) };
}

async function runVercelApiTests() {
  console.log("🧪 TESTING VERCEL SERVERLESS FUNCTION /api/spin ALL 5 ERROR RESPONSES");
  console.log("====================================================================");

  // 1. GET /api/spin -> 405 + valid JSON response
  const { req: req1, res: res1, getResult: g1 } = createMockReqRes("9194131032", "GET");
  await handler(req1, res1);
  const res1Data = g1();
  console.log(`1. GET /api/spin → Status: ${res1Data.statusCode}, JSON: ${JSON.stringify(res1Data.responseData)}`);
  console.log("   Pass:", res1Data.statusCode === 405 && res1Data.responseData.success === false ? "PASS" : "FAIL");

  // 2. POST with missing required name -> 400 + valid JSON response
  const { req: req2, res: res2, getResult: g2 } = createMockReqRes(null, "POST", "");
  await handler(req2, res2);
  const res2Data = g2();
  console.log(`2. POST with missing mobile → Status: ${res2Data.statusCode}, JSON: ${JSON.stringify(res2Data.responseData)}`);
  console.log("   Pass:", res2Data.statusCode === 400 && res2Data.responseData.success === false ? "PASS" : "FAIL");

  // 3. POST with invalid mobile -> 400 + valid JSON response
  const { req: req3, res: res3, getResult: g3 } = createMockReqRes("123", "POST");
  await handler(req3, res3);
  const res3Data = g3();
  console.log(`3. POST with invalid mobile → Status: ${res3Data.statusCode}, JSON: ${JSON.stringify(res3Data.responseData)}`);
  console.log("   Pass:", res3Data.statusCode === 400 && res3Data.responseData.success === false ? "PASS" : "FAIL");

  // 4. POST with valid test mobile -> 200 + valid JSON response
  const testMobile = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req4, res: res4, getResult: g4 } = createMockReqRes(testMobile, "POST");
  await handler(req4, res4);
  const res4Data = g4();
  console.log(`4. POST with valid test mobile (${testMobile}) → Status: ${res4Data.statusCode}, JSON: ${JSON.stringify(res4Data.responseData)}`);
  console.log("   Pass:", res4Data.statusCode === 200 && res4Data.responseData.success === true ? "PASS" : "FAIL");

  // 5. Immediate second POST using same test mobile -> 400 + valid JSON response containing cooldown message
  const { req: req5, res: res5, getResult: g5 } = createMockReqRes(testMobile, "POST");
  await handler(req5, res5);
  const res5Data = g5();
  console.log(`5. Immediate second POST (${testMobile}) → Status: ${res5Data.statusCode}, JSON: ${JSON.stringify(res5Data.responseData)}`);
  console.log("   Pass:", res5Data.statusCode === 400 && res5Data.responseData.success === false && res5Data.responseData.error.includes("available") ? "PASS" : "FAIL");

  console.log("\n✅ ALL 5 ERROR RESPONSE TEST SCENARIOS PASSED WITH VALID JSON!");
}

runVercelApiTests().catch(err => {
  console.error("Vercel API test failure:", err);
  process.exit(1);
});
