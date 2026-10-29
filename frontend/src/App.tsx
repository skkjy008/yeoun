import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAdmin, RequireMember } from './auth/Guards';
import Header from './components/layout/Header';
import { ToastProvider } from './components/Toast';
import { ShopProvider } from './shop/ShopContext';
import AdminPage from './pages/admin/AdminPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ScentFinderPage from './pages/finder/ScentFinderPage';
import HomePage from './pages/home/HomePage';
import CommissionDetailPage from './pages/commission/CommissionDetailPage';
import CommissionListPage from './pages/commission/CommissionListPage';
import CommissionNewPage from './pages/commission/CommissionNewPage';
import MyAddress from './pages/mypage/MyAddress';
import MyCommissions from './pages/mypage/MyCommissions';
import MyCoupons from './pages/mypage/MyCoupons';
import MyHome from './pages/mypage/MyHome';
import { MyOrderDetail, MyOrders } from './pages/mypage/MyOrders';
import MyPageLayout from './pages/mypage/MyPageLayout';
import MyProfile from './pages/mypage/MyProfile';
import MyReviews from './pages/mypage/MyReviews';
import MySettlements from './pages/mypage/MySettlements';
import MyWishlist from './pages/mypage/MyWishlist';
import NotFoundPage from './pages/NotFoundPage';
import CartPage from './pages/order/CartPage';
import CheckoutPage from './pages/order/CheckoutPage';
import OrderCompletePage from './pages/order/OrderCompletePage';
import { PaymentFailPage, PaymentSuccessPage } from './pages/order/PaymentResultPage';
import { ThemeDetailPage, ThemeListPage } from './pages/theme/ThemePages';
import { EventDetailPage, EventListPage } from './pages/event/EventPages';
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
        <ShopProvider>
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
                  <MyPageLayout />
                </RequireMember>
              }
            >
              <Route index element={<MyHome />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="orders/:orderId" element={<MyOrderDetail />} />
              <Route path="coupons" element={<MyCoupons />} />
              <Route path="wishlist" element={<MyWishlist />} />
              <Route path="commissions" element={<MyCommissions />} />
              <Route path="reviews" element={<MyReviews />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="address" element={<MyAddress />} />
              <Route path="settlements" element={<MySettlements />} />
            </Route>
            <Route
              path="/cart"
              element={
                <RequireMember reason="장바구니는 회원만 이용할 수 있어요.">
                  <CartPage />
                </RequireMember>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireMember reason="상품 구매는 회원만 이용할 수 있어요.">
                  <CheckoutPage />
                </RequireMember>
              }
            />
            <Route
              path="/orders/:id/complete"
              element={
                <RequireMember>
                  <OrderCompletePage />
                </RequireMember>
              }
            />
            <Route path="/theme" element={<ThemeListPage />} />
            <Route path="/theme/:slug" element={<ThemeDetailPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route
              path="/payments/success"
              element={
                <RequireMember>
                  <PaymentSuccessPage />
                </RequireMember>
              }
            />
            <Route
              path="/payments/fail"
              element={
                <RequireMember>
                  <PaymentFailPage />
                </RequireMember>
              }
            />
            <Route path="/custom" element={<CommissionListPage />} />
            <Route
              path="/custom/new"
              element={
                <RequireMember reason="커미션 의뢰는 회원만 남길 수 있어요.">
                  <CommissionNewPage />
                </RequireMember>
              }
            />
            <Route
              path="/custom/:id"
              element={
                <RequireMember reason="의뢰 내용은 회원만 자세히 볼 수 있어요.">
                  <CommissionDetailPage />
                </RequireMember>
              }
            />
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
        </ShopProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
