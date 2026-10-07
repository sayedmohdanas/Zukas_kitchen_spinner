import React, { useState, useEffect } from "react";
import { Star, MessageCircleHeart, PlusCircle, Loader2 } from "lucide-react";
import { fetchReviews } from "../services/firebaseReviewService";
import AddReviewModal from "./AddReviewModal";

const fallbackReviews = [
  {
    id: "fallback-1",
    name: "Aman S.",
    village: "Khankah",
    date: "2 days ago",
    rating: 5,
    text: "Absolutely the best pizza in town! The crust is so fresh and the cheese is perfectly melted. Fast delivery too!",
  },
  {
    id: "fallback-2",
    name: "Rahul M.",
    village: "Dewabindwal",
    date: "1 week ago",
    rating: 5,
    text: "Loved the Zukas Special! The Spin & Win coupon worked flawlessly. Will definitely be ordering again for our next party.",
  },
  {
    id: "fallback-3",
    name: "Mohd Tauseef",
    village: "Bindwal",
    date: "1 weeks ago",
    rating: 5,
    text: "Super hot when it arrived. The extra cheese option is totally worth it. Highly recommend trying their paneer pizza!",
  }
];

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    const fetchedReviews = await fetchReviews();
    if (fetchedReviews.length > 0) {
      setReviews(fetchedReviews);
    } else {
      setReviews(fallbackReviews);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();

    // Check if the user visited via a direct review link
    if (window.location.search.includes("review=true") || window.location.hash.includes("review")) {
      // Use an interval to repeatedly check for the element until it renders properly (useful for slow mobile webviews)
      let attempts = 0;
      const scrollInterval = setInterval(() => {
        const section = document.getElementById("review");
        if (section) {
          // Calculate exact position and jump to it instantly (most reliable method for iOS/WhatsApp browsers)
          const yOffset = -50; // offset slightly above the section
          const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: "auto" });
          
          setIsModalOpen(true);
          window.history.replaceState({}, document.title, window.location.pathname);
          clearInterval(scrollInterval);
        }
        
        attempts++;
        if (attempts > 10) {
          clearInterval(scrollInterval); // give up after 5 seconds
          setIsModalOpen(true);
        }
      }, 500);
    }
  }, []);

  return (
    <section id="review" className="reviews-section">
      <div className="reviews-header">
        <div className="section-badge reviews-badge">
          <MessageCircleHeart size={16} className="badge-icon" />
          <span>WHAT OUR CUSTOMERS SAY</span>
        </div>
        <h2 className="reviews-title">Loved by Pizza Fans</h2>
        <p className="reviews-subtitle">Real reviews from our happy customers.</p>
        <button className="add-review-btn" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={18} />
          <span>Leave a Review</span>
        </button>
      </div>

      {loading ? (
        <div className="reviews-loading">
          <Loader2 size={32} className="spinner" />
          <p>Loading reviews...</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
            <div className="review-card-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {review.name.charAt(0)}
                </div>
                <div className="reviewer-details">
                  <h4>{review.name}</h4>
                  <span>{review.date}{review.village ? ` • ${review.village}` : ""}</span>
                </div>
              </div>
              <div className="review-rating">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={14} className="star-icon" fill="currentColor" />
                ))}
              </div>
            </div>
            <p className="review-text">"{review.text}"</p>
          </div>
        ))}
      </div>
      )}

      <AddReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onReviewAdded={loadReviews}
      />
    </section>
  );
};

export default ReviewsSection;
