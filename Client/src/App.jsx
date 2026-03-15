import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../components/Layout/Layout";

import Home from "../pages/Home";
import About from "../pages/About";
import Location from "../pages/Location";
import Sports from "../pages/Sports";
import Turf from "../pages/Turf";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Forgot from "../pages/Auth/Forgot";
import Otp from "../pages/Auth/OtpVerification";
import Reset from "../pages/Auth/ResetPassword";
import TurfDetailsPage from "../pages/TurfDetailsPage";
import VerifyPending from "../pages/Auth/VerifyPending";
import VerifyEmail from "../pages/Auth/Verifyemail";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import BookingPage from "../pages/BookingPage";
import MyBookingsPage from "../pages/MyBookingsPage";
import BookingDetailsPage from "../pages/BookingDetailsPage";


const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />  {/* ← Routes ke bahar, BrowserRouter ke andar */}
      <Routes>

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/locations" element={<Location />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/turfs" element={<Turf />} />
          <Route path="/turf/:id" element={<TurfDetailsPage />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/reset-password/:token" element={<Reset />} />
        <Route path="/verify-pending" element={<VerifyPending />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />


      </Routes>
    </BrowserRouter>
  );
};

export default App;