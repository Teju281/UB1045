import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import BedTracking from "./pages/BedTracking";
import AppointmentBooking from "./pages/AppointmentBooking";
import SymptomChecker from "./pages/SymptomChecker";
import EmergencySOS from "./pages/EmergencySOS";
import AdminDashboard from "./pages/AdminDashboard";
import StaffPortal from "./pages/StaffPortal";
import HealthRecords from "./pages/HealthRecords";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/beds" element={<BedTracking />} />
              <Route path="/appointments" element={<AppointmentBooking />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/emergency" element={<EmergencySOS />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/staff" element={<StaffPortal />} />
              <Route path="/health-records" element={<HealthRecords />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
