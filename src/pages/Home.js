import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, signInWithGoogle, logOut } from '../firebase';
import { Container, Row, Col, Button, Card, Form, Modal } from 'react-bootstrap';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [readMore, setReadMore] = useState({});

  const fetchProductsWithReviews = async () => {
    try {
      const productSnapshot = await getDocs(collection(db, 'products'));
      const productList = await Promise.all(productSnapshot.docs.map(async (productDoc) => {
        const productData = productDoc.data();
        const reviewsSnapshot = await getDocs(collection(db, 'products', productDoc.id, 'reviews'));

        const reviewsList = reviewsSnapshot.docs.map((reviewDoc) => ({
          id: reviewDoc.id,
          ...reviewDoc.data(),
        }));

        return {
          id: productDoc.id,
          ...productData,
          reviews: reviewsList,
        };
      }));

      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products and reviews:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    fetchProductsWithReviews();
    return () => unsubscribe();
  }, []);

  const handleAddReviewClick = (product) => {
    setSelectedProduct(product);
    setReviewText('');
    setRating(0);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditReviewClick = (product, review) => {
    setSelectedProduct(product);
    setSelectedReview(review);
    setReviewText(review.reviewText);
    setRating(review.rating);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewText || rating <= 0) {
      alert('Please provide a review and rating.');
      return;
    }

    try {
      if (editMode) {
        const reviewRef = doc(db, 'products', selectedProduct.id, 'reviews', selectedReview.id);
        await updateDoc(reviewRef, {
          reviewText,
          rating,
        });
        alert('Review updated successfully!');
      } else {
        const review = {
          userId: user.uid,
          reviewText,
          rating,
          productId: selectedProduct.id,
        };

        await addDoc(collection(db, 'products', selectedProduct.id, 'reviews'), review);
        alert('Review added successfully!');
      }

      setShowModal(false);
      setReviewText('');
      setRating(0);
      fetchProductsWithReviews();
    } catch (error) {
      console.error('Error adding/editing review:', error);
      alert('Error adding/editing review.');
    }
  };

  const handleDeleteReview = async (productId, reviewId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this review?');
    
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'products', productId, 'reviews', reviewId));
      alert('Review deleted successfully!');
      fetchProductsWithReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review.');
    }
  };

  const toggleReadMore = (productId) => {
    setReadMore((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <Container>
      <h1 className="my-4 text-center">Attractions</h1>
      <Row>
        {products.map((product) => (
          <Col md={4} key={product.id} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Img
                variant="top"
                src={product.image}
                alt={product.attraction}
                className="img-fluid img-thumbnail"
                style={{ height: '150px', width: 'auto', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{product.attraction}</Card.Title>
                <Card.Text>{product.location}</Card.Text>

                {user ? (
                  <Button variant="primary" onClick={() => handleAddReviewClick(product)}>
                    Add Review
                  </Button>
                ) : (
                  <Button variant="primary" onClick={signInWithGoogle}>
                    Login to Add Review
                  </Button>
                )}

                <div className="mt-3">
                  {product.reviews?.map((review) => (
                    <div key={review.id} className="mb-2">
                      <p><strong>Rating:</strong> {review.rating} ⭐</p>
                      <p>
                        {review.reviewText.length > 100 && !readMore[product.id] ? (
                          <>
                            {review.reviewText.substring(0, 100)}...
                            <Button variant="link" onClick={() => toggleReadMore(product.id)}>
                              Read More
                            </Button>
                          </>
                        ) : (
                          <>
                            {review.reviewText}
                            {review.reviewText.length > 100 && (
                              <Button variant="link" onClick={() => toggleReadMore(product.id)}>
                                Show Less
                              </Button>
                            )}
                          </>
                        )}
                      </p>

                      {user && user.uid === review.userId && (
                        <>
                          <Button
                            variant="warning"
                            className="me-2"
                            onClick={() => handleEditReviewClick(product, review)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteReview(product.id, review.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Review' : 'Add Review'} for {selectedProduct?.attraction}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="reviewText">
            <Form.Label>Review</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="rating" className="mt-3">
            <Form.Label>Rating</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmitReview}>
            {editMode ? 'Update Review' : 'Submit Review'}
          </Button>
        </Modal.Footer>
      </Modal>

      {user && (
        <div className="text-center mt-4">
          <Button variant="danger" onClick={logOut}>
            Logout
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Home;
