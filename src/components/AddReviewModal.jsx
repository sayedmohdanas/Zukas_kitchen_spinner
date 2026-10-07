import React, { useState } from "react";
import { X, Star, Loader2, MessageSquareHeart } from "lucide-react";
import { addReview } from "../services/firebaseReviewService";

const AddReviewModal = ({ isOpen, onClose, onReviewAdded }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [village, setVillage] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      setError("Please provide your name and review text.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await addReview({ name: name.trim(), rating, village: village.trim(), text: text.trim() });
    
    setIsSubmitting(false);

    if (result.success) {
      setName("");
      setText("");
      setRating(5);
      setVillage("");
      onReviewAdded(); // Notify parent to refresh reviews
      onClose();
    } else {
      setError("Failed to submit review. Please try again later.");
    }
  };

  return (
    <div className="pizza-order-modal-overlay">
      <div className="pizza-order-modal-content" style={{ padding: "32px", overflowY: "auto" }}>
        <button className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
          <X size={24} />
        </button>

        <div className="review-form-header">
          <MessageSquareHeart size={32} className="review-form-icon" />
          <h2>Write a Review</h2>
          <p>We'd love to hear about your experience with Zukas Kitchen!</p>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {error && <div className="form-error-message">⚠️ {error}</div>}

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul M."
              disabled={isSubmitting}
              maxLength={30}
              required
            />
          </div>

          <div className="form-group">
            <label>Your Village</label>
            <input
              type="text"
              list="review-villages-list"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="Select or type your village/area..."
              disabled={isSubmitting}
              maxLength={40}
            />
            <datalist id="review-villages-list">
              <option value="Khankah" />
              <option value="Bindwal" />
              <option value="Dewabindwal" />
              <option value="Jairajpur" />
              <option value="Jagmalpur" />
              <option value="Hari Pur" />
              <option value="Naseer Pur" />
              <option value="Gulwa Gauri" />
              <option value="Alauddin Patti" />
            </datalist>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={`interactive-star ${star <= rating ? "active" : ""}`}
                  fill={star <= rating ? "currentColor" : "none"}
                  onClick={() => !isSubmitting && setRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Your Review</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you like about our pizza?"
              disabled={isSubmitting}
              rows={4}
              maxLength={200}
              required
            />
            <span className="char-count">{text.length}/200</span>
          </div>

          <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>SUBMITTING...</span>
              </>
            ) : (
              <span>SUBMIT REVIEW</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddReviewModal;
