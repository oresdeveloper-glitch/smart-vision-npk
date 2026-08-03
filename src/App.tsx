import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ScanProvider } from './contexts/ScanContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import LoginScreen from './pages/LoginScreen';

const RegisterScreen = lazy(() => import('./pages/RegisterScreen'));
const ForgotPasswordScreen = lazy(() => import('./pages/ForgotPasswordScreen'));
const HomeDashboard = lazy(() => import('./pages/HomeDashboard'));
const ScanScreen = lazy(() => import('./pages/ScanScreen'));
const ResultScreen = lazy(() => import('./pages/ResultScreen'));
const HistoryScreen = lazy(() => import('./pages/HistoryScreen'));
const ReportsScreen = lazy(() => import('./pages/ReportsScreen'));
const AnalyticsScreen = lazy(() => import('./pages/AnalyticsScreen'));
const EducationScreen = lazy(() => import('./pages/EducationScreen'));
const HelpSupportScreen = lazy(() => import('./pages/HelpSupportScreen'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      {/* Protected - With Bottom Navigation */}
      <Route path="/home" element={<ProtectedRoute><Layout><HomeDashboard /></Layout></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><Layout><ScanScreen /></Layout></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Layout><ResultScreen /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><HistoryScreen /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><ReportsScreen /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsScreen /></Layout></ProtectedRoute>} />
      <Route path="/education" element={<ProtectedRoute><Layout><EducationScreen /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><HelpSupportScreen /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfileScreen /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsScreen /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminPanel /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-green-500/30 border-t-green-500 animate-spin" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ScanProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <AppRoutes />
                </Suspense>
              </ScanProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
