import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CreateInvoice from "./pages/CreateInvoice";
import AddClient from "./pages/AddClient";
import NotFound from "./pages/NotFound";
import InvoiceDetails from "./pages/InvoiceDetails";
import EditClient from "./pages/EditClient";
import ClientInvoices from "./pages/ClientInvoices";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from './pages/CompleteProfile';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
          <Route path="/invoices" element={<RequireAuth><Layout><Invoices /></Layout></RequireAuth>} />
          <Route path="/invoices/:invoiceId" element={<RequireAuth><Layout><InvoiceDetails /></Layout></RequireAuth>} />
          <Route path="/create-invoice" element={<RequireAuth><Layout><CreateInvoice /></Layout></RequireAuth>} />
          <Route path="/clients" element={<RequireAuth><Layout><Clients /></Layout></RequireAuth>} />
          <Route path="/clients/:clientId/edit" element={<RequireAuth><Layout><EditClient /></Layout></RequireAuth>} />
          <Route path="/add-client" element={<RequireAuth><Layout><AddClient /></Layout></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />
          <Route path="/clients/:clientName/:clientEmail/invoices" element={<RequireAuth><Layout><ClientInvoices /></Layout></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
