import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Entry from "./pages/Entry.jsx";
import About from "./pages/About.jsx";
import UnitLogin from "./pages/UnitLogin.jsx";
import TenantDashboard from "./pages/TenantDashboard.jsx";
import NewComplaint from "./pages/NewComplaint.jsx";
import ManagementLogin from "./pages/ManagementLogin.jsx";
import ManagementDashboard from "./pages/ManagementDashboard.jsx";
import ComplaintDetail from "./pages/ComplaintDetail.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/about" element={<About />} />
        <Route path="/unit/:unit/login" element={<UnitLogin />} />
        <Route path="/management/login" element={<ManagementLogin />} />

        <Route element={<ProtectedRoute role="tenant" />}>
          <Route path="/tenant" element={<TenantDashboard />} />
          <Route path="/tenant/new" element={<NewComplaint />} />
          <Route path="/tenant/complaints/:id" element={<ComplaintDetail />} />
        </Route>

        <Route element={<ProtectedRoute role="management" />}>
          <Route path="/management" element={<ManagementDashboard />} />
          <Route
            path="/management/complaints/:id"
            element={<ComplaintDetail />}
          />
          <Route path="/management/history" element={<History />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
