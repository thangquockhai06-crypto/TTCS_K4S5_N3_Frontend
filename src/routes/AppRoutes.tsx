import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { ActivitiesPage } from '../pages/ActivitiesPage';
import { CreateCustomerPage } from '../pages/CreateCustomerPage';
import { CustomerDetailPage } from '../pages/CustomerDetailPage';
import { CustomerListPage } from '../pages/CustomerListPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DealPipelinePage } from '../pages/DealPipelinePage';
import { ErrorPage } from '../pages/ErrorPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { ProductsPage } from '../pages/ProductsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { ProfilePage } from '../pages/ProfilePage';

interface IProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ForgotPasswordPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/new" element={<CreateCustomerPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="deals" element={<DealPipelinePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/forbidden" element={<ErrorPage code={403} />} />
      <Route path="/not-found" element={<ErrorPage code={404} />} />
      <Route path="/server-error" element={<ErrorPage code={500} />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  );
};
