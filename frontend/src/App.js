import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import { AuthProvider, useAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductForm from "@/pages/ProductForm";
import ProductDetail from "@/pages/ProductDetail";
import Movements from "@/pages/Movements";
import MovementForm from "@/pages/MovementForm";
import Scanner from "@/pages/Scanner";
import Categories from "@/pages/Categories";
import Brands from "@/pages/Brands";
import Locations from "@/pages/Locations";
import Suppliers from "@/pages/Suppliers";
import Users from "@/pages/Users";
import Alerts from "@/pages/Alerts";
import Audit from "@/pages/Audit";
import Reports from "@/pages/Reports";
import ImportProducts from "@/pages/ImportProducts";
import Counts from "@/pages/Counts";
import CountSession from "@/pages/CountSession";
import Settings from "@/pages/Settings";

function Boot() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="font-mono text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/movements" element={<Movements />} />
        <Route path="/movements/entry" element={<MovementForm type="entry" />} />
        <Route path="/movements/exit" element={<MovementForm type="exit" />} />
        <Route path="/movements/adjustment" element={<MovementForm type="adjustment" />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/users" element={<Users />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/import" element={<ImportProducts />} />
        <Route path="/counts" element={<Counts />} />
        <Route path="/counts/:id" element={<CountSession />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    document.title = "IT Inventory · Stockroom OS";
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Boot />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
