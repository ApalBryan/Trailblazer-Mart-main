import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-root">

      {/* Background decoration */}
      <div className="home-bg-blob home-bg-blob--1" />
      <div className="home-bg-blob home-bg-blob--2" />

      <div className="home-container">

        {/* Eyebrow label */}
        <p className="home-eyebrow">
          <span className="home-eyebrow-dot" />
          Gear up. Trade on. Trailblaze.
        </p>

        {/* Hero heading */}
        <h1 className="home-title">
          Trade with Purpose,  <br />
          <em>Lead</em> with Pride.
        </h1>

        <p className="home-subtitle">
          Trade your campus style with confidence —<br className="home-br" />  quality university merchandise, <br className="home-br" />
          peer-to-peer deals, and student-friendly prices.
        </p>

        {/* CTA row */}
        <div className="home-cta-row">
          <Link to="/products" className="home-btn-primary">
            Browse Products
            <span className="home-btn-arrow">→</span>
          </Link>
          <Link to="/orders" className="home-btn-secondary">
            My Orders
          </Link>
        </div>

        {/* Feature pills */}
        <div className="home-pills">
          {["Verified", "Accessible", "Sustainable"].map((label) => (
            <span key={label} className="home-pill">{label}</span>
          ))}
        </div>

      </div>

      {/* Floating product mockup card */}
    </div>
  );
}

export default Home;