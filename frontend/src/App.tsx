import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import AppLayout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DiagnosisPage from './pages/DiagnosisPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DiagnosisPage />} />
          <Route path="result/:uid" element={<ResultPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
