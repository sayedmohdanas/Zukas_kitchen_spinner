import handler from "../api/spin.js";

function createMockReqRes(mobile, method = "POST") {
  const req = {
    method,
    body: { mobile }
  };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader() {},
    json(data) {
      responseData = data;
      return { statusCode, data: responseData };
    }
  };

  return { req, res, getResult: () => ({ statusCode, responseData }) };
}

async function runVercelApiTests() {
  console.log("🧪 TESTING VERCEL SERVERLESS FUNCTION /api/spin HANDLER");
  console.log("========================================================");

  // 1. Invalid method check
  const { req: req1, res: res1, getResult: g1 } = createMockReqRes("9194131032", "GET");
  await handler(req1, res1);
  console.log("1. GET Request (Should fail 405):", g1().statusCode === 405 ? "PASS" : "FAIL");

  // 2. Valid Spin Request (using local serviceAccountKey.json fallback)
  const testMobile = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const { req: req2, res: res2, getResult: g2 } = createMockReqRes(testMobile, "POST");
  await handler(req2, res2);
  const resData2 = g2();
  console.log(`2. First Spin Request (${testMobile}):`, resData2.statusCode === 200 && resData2.responseData.success ? "PASS" : "FAIL");
  if (resData2.responseData && resData2.responseData.success) {
    console.log("   Prize Selected:", resData2.responseData.prize.label);
    console.log("   Coupon Code:", resData2.responseData.couponCode || "No Coupon (Better Luck)");
    console.log("   Server Timestamp:", resData2.responseData.timestamp);
  }

  // 3. Immediate Second Spin Request (Should be blocked by server cooldown)
  const { req: req3, res: res3, getResult: g3 } = createMockReqRes(testMobile, "POST");
  await handler(req3, res3);
  const resData3 = g3();
  console.log(`3. Immediate Second Spin Request (${testMobile}):`, resData3.statusCode === 400 && !resData3.responseData.success ? "PASS (BLOCK)" : "FAIL");
  console.log("   Server Rejection Message:", resData3.responseData.error);

  console.log("\n✅ VERCEL SERVERLESS FUNCTION HANDLER LOCAL VERIFICATION COMPLETED!");
}

runVercelApiTests().catch(err => {
  console.error("Vercel API test failure:", err);
  process.exit(1);
});
