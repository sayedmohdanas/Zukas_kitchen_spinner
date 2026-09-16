import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDqw_UkQTR1epTomT_-IQLE7M_1jc2_sb4",
  authDomain: "zukas-kitchen-spin-win.firebaseapp.com",
  projectId: "zukas-kitchen-spin-win",
  storageBucket: "zukas-kitchen-spin-win.firebasestorage.app",
  messagingSenderId: "203850913566",
  appId: "1:203850913566:web:86196521d40d4accf45b0f"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");

async function checkCloudFunction() {
  console.log("Checking spinWheel Cloud Function deployment...");
  try {
    const spinWheelFn = httpsCallable(functions, "spinWheel");
    // Call with a dummy test mobile number
    const result = await spinWheelFn({ mobile: "9876543210" });
    console.log("CALL_SUCCESS:", JSON.stringify(result.data));
  } catch (err) {
    console.log("CALL_RESPONSE_CODE:", err.code);
    console.log("CALL_RESPONSE_MSG:", err.message);
    console.log("CALL_RESPONSE_DETAILS:", err.details);
  }
}

checkCloudFunction();
