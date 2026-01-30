import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import LoginCallback from './pages/LoginCallback';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Forms from './pages/Forms';
import FormBuilder from './pages/FormBuilder';
import FormResponses from './pages/FormResponses';
import AIGenerator from './pages/AIGenerator';
import PublicForm from './pages/PublicForm';

// Store
import { useAuthStore } from './stores/authStore';

import { Toaster } from 'react-hot-toast';

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();

  // Fetch user on app load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<LoginCallback />} />

        {/* Public Form (No Auth Required) */}
        <Route path="/f/:slug" element={<PublicForm />} />

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/forms/:id" element={<FormResponses />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/forms/:id/responses" element={<FormResponses />} />
          <Route path="/forms/new" element={<FormBuilder />} />
          <Route path="/ai" element={<AIGenerator />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
