import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth, signInWithGoogle, logOut } from '../firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button, Form, Container, ProgressBar, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [attraction, setAttraction] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageURL, setImageURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false); 
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate(); 
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'ibsaa.adam1@gmail.com';

  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      console.log('Current user:', currentUser);

      if (currentUser && currentUser.email === adminEmail) {
        setIsAdmin(true);
        console.log("Admin logged in");
      } else {
        setIsAdmin(false);
        console.log("Non-admin logged in");
      }
    });

    return () => unsubscribe();
  }, [adminEmail]);

  const handleImageUpload = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }

    try {
      const storageRef = ref(storage, `images/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      setIsUploading(true);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error('Error during image upload:', error.message);
          setError(`Upload failed: ${error.message}`);
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImageURL(downloadURL);
          setIsUploading(false);
          console.log('Image uploaded successfully:', downloadURL);
        }
      );
    } catch (error) {
      console.error('Unexpected error during image upload:', error.message);
      setError(`Unexpected error: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handleAddAttraction = async () => {
    if (!attraction || !location || !imageURL) {
      setError('Please fill out all fields, including the image upload');
      return;
    }

    try {
      if (isAdmin) {
        await addDoc(collection(db, 'products'), {
          attraction: attraction,
          location: location,
          image: imageURL,
        });

        setAttraction('');
        setLocation('');
        setImage(null);
        setImageURL('');
        setError(null);
        setSuccess(true);
        console.log('Attraction added successfully!');
      } else {
        setError('You do not have permission to add an attraction.');
      }
    } catch (error) {
      console.error('Error adding attraction:', error);
      setError('Failed to add attraction. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Container>
      <h1 className="text-center my-4">Admin - Add New Attraction</h1>

      {user ? (
        isAdmin ? (
          <>
            {success ? (
              <div className="text-center">
                <Alert variant="success">Attraction added successfully!</Alert>
                <Button onClick={() => navigate('/')} variant="primary">Back to Home</Button>
              </div>
            ) : (
              <>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form>
                  <Form.Group controlId="attraction">
                    <Form.Label>Attraction</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter attraction"
                      value={attraction}
                      onChange={(e) => setAttraction(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group controlId="location">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group controlId="image" className="mb-3">
                    <Form.Label>Select Image</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                  </Form.Group>

                  {isUploading && (
                    <ProgressBar
                      now={uploadProgress}
                      label={`${Math.round(uploadProgress)}%`}
                      className="mb-3"
                    />
                  )}

                  <div className="d-flex justify-content-between">
                    <Button variant="primary" onClick={handleImageUpload} disabled={isUploading}>
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>

                    <Button
                      variant="success"
                      onClick={handleAddAttraction}
                      disabled={!imageURL || isUploading}
                    >
                      Add Attraction
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <p>You are logged in, but not as an admin.</p>
            <Button onClick={handleLogout} variant="danger">Logout</Button>
          </div>
        )
      ) : (
        <div className="text-center">
          <p>Please log in to access the admin panel.</p>
          <Button onClick={handleGoogleLogin} variant="primary">Login with Google</Button>
        </div>
      )}
    </Container>
  );
};

export default Admin;
