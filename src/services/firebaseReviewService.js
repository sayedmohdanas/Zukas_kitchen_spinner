import { db } from "../firebase/firebase.js";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

/**
 * Fetches all reviews from Firestore, ordered by most recent first.
 * If the collection doesn't exist or is empty, returns an empty array.
 */
export const fetchReviews = async () => {
  try {
    const reviewsRef = collection(db, "reviews");
    // Order by createdAt descending (newest first)
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Format the date locally for display
      let displayDate = "Just now";
      if (data.createdAt) {
        // If it's a Firestore Timestamp, convert to Date
        const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date();
        displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      reviews.push({
        id: doc.id,
        name: data.name || "Anonymous",
        village: data.village || "",
        rating: data.rating || 5,
        text: data.text || "",
        date: displayDate,
      });
    });
    
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews from Firestore:", error);
    return [];
  }
};

/**
 * Adds a new review to Firestore.
 */
export const addReview = async (reviewData) => {
  try {
    const reviewsRef = collection(db, "reviews");
    await addDoc(reviewsRef, {
      name: reviewData.name,
      village: reviewData.village || "",
      rating: reviewData.rating,
      text: reviewData.text,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding review:", error);
    return { success: false, error: error.message };
  }
};
