import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { DashboardPage } from '../pages/DashboardPage';
import { ErrorPage } from '../pages/ErrorPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { UserEditPage } from '../pages/UserEditPage';
import { ProductsPage } from '../pages/ProductsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OrgTreePage } from '../pages/OrgTreePage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { CustomFieldsPage } from '../pages/CustomFieldsPage';
import { PipelineConfigPage } from '../pages/PipelineConfigPage';
import { WinLossPage } from '../pages/WinLossPage';
import { CustomerListPage } from '../pages/CustomerListPage';
import { Customer360Dashboard } from '../pages/Customer360Dashboard';
import { StagnantCustomerList } from '../components/customer/StagnantCustomerList';
import { ForecastPage } from '../pages/ForecastPage';
import { StagnantDealsPage } from '../pages/StagnantDealsPage';
import { DealReassignmentPage } from '../pages/DealReassignmentPage';

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
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ForgotPasswordPage />} />

      {/* Authenticated Workspace */}
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
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="stagnant-deals" element={<StagnantDealsPage />} />
        <Route path="deal-reassignment" element={<DealReassignmentPage />} />

        {/* User Management & Dedicated Edit */}
        <Route path="users" element={<UserManagementPage />} />
        <Route path="users/:id/edit" element={<UserEditPage />} />

        {/* Customer Management */}
        <Route path="customers" element={<CustomerListPage />} />
        <Route path="customers/stagnant" element={<StagnantCustomerList />} />
        <Route path="customers/:id" element={<Customer360Dashboard />} />

        {/* Configuration & Administration Modules */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="organization" element={<OrgTreePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="pipeline" element={<PipelineConfigPage />} />
        <Route path="win-loss" element={<WinLossPage />} />
        <Route path="custom-fields" element={<CustomFieldsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Error Pages */}
      <Route path="/forbidden" element={<ErrorPage code={403} />} />
      <Route path="/not-found" element={<ErrorPage code={404} />} />
      <Route path="/server-error" element={<ErrorPage code={500} />} />
      <Route path="*" element={<ErrorPage code={404} />} />
    </Routes>
  );
};
