import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute component

function App() {
  const [user, setUser] = useState(null); // To track the logged-in user

  useEffect(() => {
    // You can fetch the backend to check if the user is logged in
    fetch("http://localhost:5000")
      .then((response) => response.json()) // Ensure that data is parsed as JSON
      .then((data) => {
        // Assuming that the backend returns the logged-in user if authenticated
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((error) => console.log(error));
  }, []);

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        {user ? (
          <>
            <span>Welcome, {user.name}</span>
            <button onClick={() => setUser(null)}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>

      <Routes>
        {/* Protect the home route */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <Home user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<SignUp setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
