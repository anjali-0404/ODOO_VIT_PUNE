import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { AuthProvider, useAuth, type Role } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Expenses } from './pages/Expenses';
import { CreateExpense } from './pages/CreateExpense';
import { ExpenseDetail } from './pages/ExpenseDetail';
import { Approvals } from './pages/Approvals';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Home } from './pages/Home';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

type AllowedRole = Exclude<Role, null>;

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/create" element={<CreateExpense />} />
            <Route path="/expenses/:id" element={<ExpenseDetail />} />
            <Route
              path="/approvals"
              element={(
                <RoleRoute allowedRoles={['Admin', 'Manager', 'CFO']}>
                  <Approvals />
                </RoleRoute>
              )}
            />
            <Route
              path="/users"
              element={(
                <RoleRoute allowedRoles={['Admin']}>
                  <Users />
                </RoleRoute>
              )}
            />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
