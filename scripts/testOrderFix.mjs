import { getWhatsAppPizzaOrderLink } from "../src/utils/whatsapp.js";
import { calculateOfferDiscount } from "../src/utils/offers.js";

console.log("=== RUNNING ORDER FIX TESTS ===\n");

// Test 1: User's exact scenario: 2x Pizza Paneer Tikka (Medium, 199), No coupon
{
  const items = [
    {
      id: "item-1",
      name: "Pizza Paneer Tikka",
      category: "pizza",
      size: "medium",
      basePrice: 199,
      hasExtraCheese: false,
      quantity: 2,
    },
  ];

  const link = getWhatsAppPizzaOrderLink({ items });
  const urlObj = new URL(link);
  const text = urlObj.searchParams.get("text");

  console.log("--- TEST 1: 2x Medium Pizza Paneer Tikka (No Offer) ---");
  console.log(text);
  console.log("-------------------------------------------------------\n");

  if (!text.includes("Quantity: 2 × ₹199 = ₹398")) {
    throw new Error("Test 1 Failed: Expected 'Quantity: 2 × ₹199 = ₹398'");
  }
  if (!text.includes("💰 *Total Bill:* ₹398")) {
    throw new Error("Test 1 Failed: Expected 'Total Bill: ₹398'");
  }
}

// Test 2: 2x Pizza Paneer Tikka (Medium, 199) WITH ₹25 OFF 2 Medium Pizza Coupon
{
  const items = [
    {
      id: "item-1",
      name: "Pizza Paneer Tikka",
      category: "pizza",
      size: "medium",
      basePrice: 199,
      hasExtraCheese: false,
      quantity: 2,
    },
  ];

  const activeOffer = {
    prizeId: "25-off-2-medium-pizza",
    prizeName: "₹25 OFF ON ORDER 2 MEDIUM (8 inch) PIZZA",
    couponCode: "ZUKAS-SAVE25",
  };

  const link = getWhatsAppPizzaOrderLink({ items, activeOffer });
  const urlObj = new URL(link);
  const text = urlObj.searchParams.get("text");

  console.log("--- TEST 2: 2x Medium Pizza Paneer Tikka with ₹25 OFF Coupon ---");
  console.log(text);
  console.log("-----------------------------------------------------------------\n");

  if (!text.includes("Quantity: 2 × ₹199 = ₹398")) {
    throw new Error("Test 2 Failed: Expected 'Quantity: 2 × ₹199 = ₹398'");
  }
  if (!text.includes("📦 *Items Subtotal:* ₹398")) {
    throw new Error("Test 2 Failed: Expected 'Items Subtotal: ₹398'");
  }
  if (!text.includes("✨ *Discount Applied:* -₹25")) {
    throw new Error("Test 2 Failed: Expected 'Discount Applied: -₹25'");
  }
  if (!text.includes("💰 *Total Bill:* ₹373")) {
    throw new Error("Test 2 Failed: Expected 'Total Bill: ₹373'");
  }
}

// Test 3: 2x Medium Pizza Paneer Tikka with Extra Cheese (25 each)
{
  const items = [
    {
      id: "item-1",
      name: "Pizza Paneer Tikka",
      category: "pizza",
      size: "medium",
      basePrice: 199,
      hasExtraCheese: true,
      quantity: 2,
    },
  ];

  const link = getWhatsAppPizzaOrderLink({ items });
  const urlObj = new URL(link);
  const text = urlObj.searchParams.get("text");

  console.log("--- TEST 3: 2x Medium Pizza Paneer Tikka with Extra Cheese ---");
  console.log(text);
  console.log("--------------------------------------------------------------\n");

  if (!text.includes("Quantity: 2 × ₹199 = ₹398")) {
    throw new Error("Test 3 Failed: Expected 'Quantity: 2 × ₹199 = ₹398'");
  }
  if (!text.includes("🧀 Extra Cheese: Yes (+₹25 × 2 = +₹50)")) {
    throw new Error("Test 3 Failed: Expected 'Extra Cheese: Yes (+₹25 × 2 = +₹50)'");
  }
  if (!text.includes("💵 Item Subtotal: ₹448")) {
    throw new Error("Test 3 Failed: Expected 'Item Subtotal: ₹448'");
  }
  if (!text.includes("💰 *Total Bill:* ₹448")) {
    throw new Error("Test 3 Failed: Expected 'Total Bill: ₹448'");
  }
}

// Test 4: Free Campa Offer on Pizza
{
  const items = [
    {
      id: "item-1",
      name: "Pizza Margherita",
      category: "pizza",
      size: "small",
      basePrice: 99,
      hasExtraCheese: false,
      quantity: 1,
    },
  ];

  const activeOffer = {
    prizeId: "free-campa-10",
    prizeName: "FREE CAMPA ON ANY PIZZA",
    couponCode: "ZUKAS-CAMPA",
  };

  const link = getWhatsAppPizzaOrderLink({ items, activeOffer });
  const urlObj = new URL(link);
  const text = urlObj.searchParams.get("text");

  console.log("--- TEST 4: Free Campa Offer ---");
  console.log(text);
  console.log("--------------------------------\n");

  if (!text.includes("🎁 *Free Reward:* Free 200ml Campa Drink included!")) {
    throw new Error("Test 4 Failed: Expected 'Free Reward'");
  }
  if (!text.includes("💰 *Total Bill:* ₹99")) {
    throw new Error("Test 4 Failed: Expected 'Total Bill: ₹99'");
  }
}

// Test 5: Burger only order with pizza coupon (should disallow coupon)
{
  const items = [
    {
      id: "item-1",
      name: "Chicken Zinger Burger",
      category: "burger",
      size: "regular",
      basePrice: 60,
      hasExtraCheese: false,
      quantity: 2,
    },
  ];

  const activeOffer = {
    prizeId: "10-off",
    prizeName: "₹10 OFF ON ANY PIZZA",
    couponCode: "ZUKAS-PIZZA10",
  };

  const link = getWhatsAppPizzaOrderLink({ items, activeOffer });
  const urlObj = new URL(link);
  const text = urlObj.searchParams.get("text");

  console.log("--- TEST 5: Burger only order with Pizza coupon ---");
  console.log(text);
  console.log("---------------------------------------------------\n");

  if (!text.includes("Quantity: 2 × ₹60 = ₹120")) {
    throw new Error("Test 5 Failed: Expected 'Quantity: 2 × ₹60 = ₹120'");
  }
  if (!text.includes("Coupons valid on Pizza orders only")) {
    throw new Error("Test 5 Failed: Expected restriction warning");
  }
  if (!text.includes("💰 *Total Bill:* ₹120")) {
    throw new Error("Test 5 Failed: Expected 'Total Bill: ₹120'");
  }
}

// Test 6: Delivery address as object and [object Object] prevention
{
  const link1 = getWhatsAppPizzaOrderLink({
    pizzaName: "Pizza Margherita",
    size: "medium",
    basePrice: 139,
    customerName: "Prince",
    contactNumber: "9277202580",
    deliveryAddress: { id: "v1", name: "Jairajpur" },
    landmark: "Jairajpur ambedkar park bank ke pichhe wala Mukkhu ke ghar lana hai",
  });
  const text1 = new URL(link1).searchParams.get("text");

  if (!text1.includes("Address: Jairajpur")) {
    throw new Error("Test 6 Failed: Expected 'Address: Jairajpur'");
  }
  if (text1.includes("[object Object]")) {
    throw new Error("Test 6 Failed: Contains [object Object]");
  }

  // If passed literal "[object Object]"
  const link2 = getWhatsAppPizzaOrderLink({
    pizzaName: "Pizza Margherita",
    size: "medium",
    basePrice: 139,
    customerName: "Prince",
    contactNumber: "9277202580",
    deliveryAddress: "[object Object]",
    landmark: "Jairajpur ambedkar park",
  });
  const text2 = new URL(link2).searchParams.get("text");
  if (text2.includes("[object Object]")) {
    throw new Error("Test 6b Failed: Should not display [object Object]");
  }
}

console.log("ALL TESTS PASSED SUCCESSFULLY! ✅");

