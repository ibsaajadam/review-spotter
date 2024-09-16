import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState({});
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then((response) => {
      setProduct(response.data);
    });
  }, [id]);

  const addReview = () => {
    axios.post(`/api/products/${id}/reviews`, {
      userId: "user1",
      reviewText,
      rating
    }).then((response) => {
      setProduct(response.data);
      setReviewText('');
    });
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      <h2>Reviews</h2>
      {product.reviews && product.reviews.map((review) => (
        <div key={review._id}>
          <p>{review.reviewText}</p>
          <p>Rating: {review.rating}</p>
        </div>
      ))}

      <div>
        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
        <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} />
        <button onClick={addReview}>Submit Review</button>
      </div>
    </div>
  );
};

export default ProductPage;
