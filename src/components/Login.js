import React from "react";
import { auth, googleProvider } from "../firebase";

const Login = () => {
  const handleGoogleLogin = () => {
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        console.log("User signed in:", result.user);
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      });
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
    </div>
  );
};

export default Login;
