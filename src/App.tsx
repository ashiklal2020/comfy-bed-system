
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { SupabaseProtectedRoute } from "@/components/SupabaseProtectedRoute";
import SupabaseLayout from "@/components/SupabaseLayout";
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import AdminDashboard from "@/pages/admin/Dashboard";
import StudentManagement from "@/pages/admin/StudentManagement";
import RequestManagement from "@/pages/admin/RequestManagement";
import StudentProfile from "@/pages/student/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SupabaseAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Protected Routes with Layout */}
            <Route
              path="/*"
              element={
                <SupabaseProtectedRoute>
                  <SupabaseLayout />
                </SupabaseProtectedRoute>
              }
            >
              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <SupabaseProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </SupabaseProtectedRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <SupabaseProtectedRoute allowedRoles={['admin']}>
                    <StudentManagement />
                  </SupabaseProtectedRoute>
                }
              />
              <Route
                path="admin/requests"
                element={
                  <SupabaseProtectedRoute allowedRoles={['admin']}>
                    <RequestManagement />
                  </SupabaseProtectedRoute>
                }
              />
              
              {/* Student Routes */}
              <Route
                path="student/profile"
                element={
                  <SupabaseProtectedRoute allowedRoles={['student']}>
                    <StudentProfile />
                  </SupabaseProtectedRoute>
                }
              />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
