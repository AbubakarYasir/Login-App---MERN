import React, { useState, useEffect } from "react";

const Home = ({ user }) => {
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/protected-route", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Network response was not ok");
          }
          return res.json();
        })
        .then((data) => {
          if (data.message) {
            setUserName(data.message.split(",")[1].trim());
          }
        })
        .catch((err) => console.error("Fetch error: ", err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div>
      <h1>Home Page</h1>
      {userName ? (
        <div>
          <p>Welcome, {userName}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <a href="/login">Login</a>
      )}
    </div>
  );
};

export default Home;
