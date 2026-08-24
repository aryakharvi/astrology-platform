import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.error("User data error:", error);
    user = null;
  }

  // User is not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin page
  if (adminOnly) {
    if (user?.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;