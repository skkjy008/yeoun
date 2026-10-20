import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAdmin, RequireMember } from './auth/Guards';
import Header from './components/layout/Header';
import { ToastProvider } from './components/Toast';
import AdminPage from './pages/admin/AdminPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ComingSoonPage from './pages/ComingSoonPage';
import ScentFinderPage from './pages/finder/ScentFinderPage';
import HomePage from './pages/home/HomePage';
import MyPage from './pages/MyPage';
import NotFoundPage from './pages/NotFoundPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import CategoryPage from './pages/shop/CategoryPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<CategoryPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route
              path="/scent-finder"
              element={
                <RequireMember reason="나만의 향 찾기는 회원만 이용할 수 있어요.">
                  <ScentFinderPage />
                </RequireMember>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/mypage"
              element={
                <RequireMember>
                  <MyPage />
                </RequireMember>
              }
            />
            <Route path="/theme" element={<ComingSoonPage kind="theme" />} />
            <Route path="/custom" element={<ComingSoonPage kind="custom" />} />
            <Route
              path="/admin/:tab?"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </ToastProvider>
  );
}
