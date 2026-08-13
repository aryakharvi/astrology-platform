import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Astrologer from "./pages/Astrologer";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Kundli from "./pages/kundli";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Services */}
        <Route path="/services" element={<Services />} />

        {/* Astrologer */}
        <Route path="/astrologer" element={<Astrologer />} />

        {/* Booking */}
        <Route path="/booking" element={<Booking />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Register */}
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Kundli */}
        <Route path="/kundli" element={<Kundli />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;