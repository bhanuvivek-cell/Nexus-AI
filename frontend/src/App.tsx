import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { FloatingAssistantButton } from './components/assistant/FloatingAssistantButton';

// Critical pages loaded eagerly (auth + landing)
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Heavy pages lazy-loaded on demand (reduces initial bundle by ~60%)
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })));
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage').then(m => ({ default: m.OpportunityDetailPage })));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })));
const SkillRoadmapPage = lazy(() => import('./pages/SkillRoadmapPage').then(m => ({ default: m.SkillRoadmapPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })));

// Minimal fallback spinner shown during lazy chunk load
const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-4 border-saffron-500 border-t-transparent animate-spin" />
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-saffron-100 selection:text-saffron-800">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public routes — eagerly loaded */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Public routes — lazy loaded */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />

                {/* Onboarding wizard route */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute allowIncompleteOnboarding={true}>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected student routes — lazy loaded */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications"
                  element={
                    <ProtectedRoute>
                      <ApplicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <ProtectedRoute>
                      <SkillRoadmapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <FloatingAssistantButton />
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
