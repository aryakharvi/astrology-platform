import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Astrologer from "./pages/Astrologer";
import Booking from "./pages/Booking";
import Profile from "./pages/Profile";
import Kundli from "./pages/kundli";
import KundliResult from "./pages/KundliResult";
import MyKundlis from "./pages/MyKundlis";
import Admin from "./pages/Admin";
import ReaderDashboard from "./pages/ReaderDashboard";
import VideoCallPage from "./pages/VideoCall";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/services" element={<Services />} />

        <Route path="/astrologer" element={<Astrologer />} />

        <Route path="/booking" element={<Booking />} />


        {/* ================= USER PROTECTED ROUTES ================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kundli"
          element={
            <ProtectedRoute>
              <Kundli />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kundli/:id"
          element={
            <ProtectedRoute>
              <KundliResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-kundlis"
          element={
            <ProtectedRoute>
              <MyKundlis />
            </ProtectedRoute>
          }
        />


        {/* ================= ADMIN ROUTE ================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader-dashboard"
          element={
            <ProtectedRoute adminOnly>
              <ReaderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultation/:bookingId"
          element={
            <ProtectedRoute>
              <VideoCallPage />
            </ProtectedRoute>
          }
        />


        {/* ================= FALLBACK ================= */}

        <Route path="*" element={<Home />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;