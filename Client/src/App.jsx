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
import Footer from "../components/Footer/Footer";
const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<Layout />}>

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/locations" element={<Location />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/turfs" element={<Turf />} />
           <Route path="/turf/:id" element={<TurfDetailsPage />} />


        </Route>


        {/* Authantication Routes  */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/reset" element={<Reset />} />

      </Routes>


    </BrowserRouter>
  );
};

export default App;