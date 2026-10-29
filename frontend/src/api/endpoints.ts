import { api } from './client';
import type {
  EventDetail,
  EventSummary,
  RouletteStatus,
  SpinResult,
  AcceptResponse,
  CheckoutResponse,
  PaymentConfig,
  PaymentResult,
  SettlementSummary,
  Settlement,
  ThemeDetail,
  ThemeRequest,
  ThemeSummary,
  UploadPurpose,
  UploadResult,
  Address,
  Cart,
  CommissionCreateRequest,
  CommissionDetail,
  CommissionStatus,
  CommissionSummary,
  Coupon,
  FilterOptions,
  Member,
  MemberRow,
  NotificationItem,
  PageResponse,
  PerfumerApplicationRow,
  Post,
  ProductDetail,
  ProductRequest,
  ProductSummary,
  QuizQuestion,
  Recommendation,
  Review,
  SignupRequest,
  TokenResponse,
  YoutubeResult,
  MyPageSummary,
  OrderCreateRequest,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  PaymentMethod,
} from './types';

export interface ProductQuery {
  category?: string;
  keyword?: string;
  feeling?: string;
  scene?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  size?: number;
}

export const productApi = {
  search: (query: ProductQuery) => api.get<PageResponse<ProductSummary>>('/api/products', { ...query }),
  popular: () => api.get<ProductSummary[]>('/api/products/popular'),
  newArrivals: () => api.get<ProductSummary[]>('/api/products/new'),
  detail: (id: number) => api.get<ProductDetail>(`/api/products/${id}`),
  filters: (slug: string) => api.get<FilterOptions>(`/api/categories/${slug}/filters`),
};

export const reviewApi = {
  byProduct: (productId: number, page = 0) =>
    api.get<PageResponse<Review>>(`/api/products/${productId}/reviews`, { page, size: 10 }),
  featured: () => api.get<Review[]>('/api/reviews/featured'),
  create: (productId: number, body: { rating: number; content: string }) =>
    api.post<Review>(`/api/products/${productId}/reviews`, body),
  remove: (reviewId: number) => api.delete<void>(`/api/reviews/${reviewId}`),
  mine: () => api.get<Review[]>('/api/reviews/me'),
};

export const postApi = {
  banners: () => api.get<Post[]>('/api/posts', { type: 'BANNER' }),
};

export const authApi = {
  login: (email: string, password: string) => api.post<TokenResponse>('/api/auth/login', { email, password }),
  signup: (body: SignupRequest) => api.post<TokenResponse>('/api/auth/signup', body),
  me: () => api.get<Member>('/api/members/me'),
};

export const memberApi = {
  summary: () => api.get<MyPageSummary>('/api/members/me/summary'),
  updateProfile: (body: { name: string; phone: string; marketingAgreed: boolean }) =>
    api.put<Member>('/api/members/me', body),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<void>('/api/members/me/password', { currentPassword, newPassword }),
  changeAddress: (body: Address) => api.put<Address>('/api/members/me/address', body),
};

export const cartApi = {
  get: () => api.get<Cart>('/api/cart'),
  count: () => api.get<{ count: number }>('/api/cart/count'),
  add: (productId: number, quantity: number) => api.post<Cart>('/api/cart/items', { productId, quantity }),
  changeQuantity: (cartItemId: number, quantity: number) =>
    api.patch<Cart>(`/api/cart/items/${cartItemId}`, { quantity }),
  remove: (ids: number[]) => api.delete<Cart>(`/api/cart/items?ids=${ids.join(',')}`),
};

export const wishlistApi = {
  list: () => api.get<ProductSummary[]>('/api/wishlist'),
  ids: () => api.get<number[]>('/api/wishlist/ids'),
  add: (productId: number) => api.put<void>(`/api/wishlist/${productId}`),
  remove: (productId: number) => api.delete<void>(`/api/wishlist/${productId}`),
};

export const couponApi = {
  mine: () => api.get<Coupon[]>('/api/coupons/me'),
};

export const orderApi = {
  create: (body: OrderCreateRequest) => api.post<CheckoutResponse>('/api/orders', body),
  mine: (status?: OrderStatus, page = 0) =>
    api.get<PageResponse<OrderSummary>>('/api/orders', { status, page, size: 10 }),
  detail: (id: number) => api.get<OrderDetail>(`/api/orders/${id}`),
  cancel: (id: number) => api.post<OrderDetail>(`/api/orders/${id}/cancel`),
};

export const commissionApi = {
  list: (status?: CommissionStatus, page = 0) =>
    api.get<PageResponse<CommissionSummary>>('/api/commissions', { status, page, size: 12 }),
  mine: () => api.get<CommissionSummary[]>('/api/commissions/me'),
  proposed: () => api.get<CommissionSummary[]>('/api/commissions/proposed'),
  detail: (id: number) => api.get<CommissionDetail>(`/api/commissions/${id}`),
  create: (body: CommissionCreateRequest) => api.post<CommissionDetail>('/api/commissions', body),
  propose: (id: number, body: { price: number; workingDays: number; message: string }) =>
    api.post<CommissionDetail>(`/api/commissions/${id}/proposals`, body),
  accept: (id: number, proposalId: number, paymentMethod: PaymentMethod) =>
    api.post<AcceptResponse>(`/api/commissions/${id}/proposals/${proposalId}/accept`, { paymentMethod }),
  start: (id: number) => api.post<CommissionDetail>(`/api/commissions/${id}/start`),
  confirm: (id: number) => api.post<CommissionDetail>(`/api/commissions/${id}/confirm`),
  deliver: (id: number, note: string) => api.post<CommissionDetail>(`/api/commissions/${id}/deliver`, { note }),
  review: (id: number, body: { scentRating: number; perfumerRating: number; content: string }) =>
    api.post<CommissionDetail>(`/api/commissions/${id}/review`, body),
  cancel: (id: number, reason?: string) => api.post<CommissionDetail>(`/api/commissions/${id}/cancel`, { reason }),
};

export const settlementApi = {
  mine: () => api.get<SettlementSummary>('/api/settlements/me'),
};

export const paymentApi = {
  config: () => api.get<PaymentConfig>('/api/payments/config'),
  confirm: (paymentKey: string, orderId: string, amount: number) =>
    api.post<PaymentResult>('/api/payments/confirm', { paymentKey, orderId, amount }),
  fail: (orderId: string, code?: string, message?: string) =>
    api.post<void>('/api/payments/fail', { orderId, code, message }),
};

export const themeApi = {
  list: () => api.get<ThemeSummary[]>('/api/themes'),
  detail: (slug: string) => api.get<ThemeDetail>(`/api/themes/${slug}`),
};

export const uploadApi = {
  image: (file: File, purpose: UploadPurpose) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<UploadResult>('/api/uploads', form, { purpose });
  },
};

export const preferenceApi = {
  questions: () => api.get<QuizQuestion[]>('/api/preferences/questions'),
  submit: (answers: { questionNo: number; optionNo: number }[]) =>
    api.post<Recommendation>('/api/preferences', { answers }),
  mine: (ai = false) => api.get<Recommendation | undefined>('/api/preferences/me', { ai }),
};

export const notificationApi = {
  list: () => api.get<NotificationItem[]>('/api/notifications'),
  unreadCount: () => api.get<{ count: number }>('/api/notifications/unread-count'),
  read: (id: number) => api.patch<void>(`/api/notifications/${id}/read`),
  readAll: () => api.patch<void>('/api/notifications/read-all'),
};

export const musicApi = {
  youtube: (q: string) => api.get<YoutubeResult>('/api/music/youtube', { q }),
};

export const adminApi = {
  products: () => api.get<PageResponse<ProductDetail>>('/api/admin/products', { size: 100 }),
  createProduct: (body: ProductRequest) => api.post<ProductDetail>('/api/admin/products', body),
  updateProduct: (id: number, body: ProductRequest) => api.put<ProductDetail>(`/api/admin/products/${id}`, body),
  updateStock: (id: number, stock: number) => api.patch<void>(`/api/admin/products/${id}/stock`, { stock }),
  deleteProduct: (id: number) => api.delete<void>(`/api/admin/products/${id}`),
  members: (keyword?: string) => api.get<PageResponse<MemberRow>>('/api/admin/members', { keyword, size: 50 }),
  updateMember: (id: number, body: { role?: string; grade?: string }) =>
    api.patch<MemberRow>(`/api/admin/members/${id}`, body),
  applications: (status?: string) =>
    api.get<PerfumerApplicationRow[]>('/api/admin/perfumer-applications', { status }),
  approve: (id: number) => api.post<PerfumerApplicationRow>(`/api/admin/perfumer-applications/${id}/approve`),
  orders: (status?: OrderStatus) => api.get<PageResponse<OrderSummary>>('/api/admin/orders', { status, size: 50 }),
  changeOrderStatus: (id: number, status: OrderStatus) =>
    api.patch<OrderDetail>(`/api/admin/orders/${id}/status`, { status }),
  themes: () => api.get<ThemeSummary[]>('/api/admin/themes'),
  theme: (slug: string) => api.get<ThemeDetail>(`/api/admin/themes/${slug}`),
  createTheme: (body: ThemeRequest) => api.post<ThemeDetail>('/api/admin/themes', body),
  updateTheme: (id: number, body: ThemeRequest) => api.put<ThemeDetail>(`/api/admin/themes/${id}`, body),
  deleteTheme: (id: number) => api.delete<void>(`/api/admin/themes/${id}`),
  settlements: (status?: string) => api.get<SettlementSummary>('/api/admin/settlements', { status }),
  paySettlement: (id: number) => api.post<Settlement>(`/api/admin/settlements/${id}/pay`),
  reject: (id: number, reason: string) =>
    api.post<PerfumerApplicationRow>(`/api/admin/perfumer-applications/${id}/reject`, { reason }),
};

export const eventApi = {
  list: () => api.get<EventSummary[]>('/api/events'),
  detail: (slug: string) => api.get<EventDetail>(`/api/events/${slug}`),
  rouletteStatus: () => api.get<RouletteStatus>('/api/events/roulette/status'),
  spin: () => api.post<SpinResult>('/api/events/roulette/spin'),
  claimWelcome: () => api.post<Coupon>('/api/events/welcome-coupon'),
};
