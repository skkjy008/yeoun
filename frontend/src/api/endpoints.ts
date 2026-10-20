import { api } from './client';
import type {
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
};

export const postApi = {
  banners: () => api.get<Post[]>('/api/posts', { type: 'BANNER' }),
};

export const authApi = {
  login: (email: string, password: string) => api.post<TokenResponse>('/api/auth/login', { email, password }),
  signup: (body: SignupRequest) => api.post<TokenResponse>('/api/auth/signup', body),
  me: () => api.get<Member>('/api/members/me'),
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
  reject: (id: number, reason: string) =>
    api.post<PerfumerApplicationRow>(`/api/admin/perfumer-applications/${id}/reject`, { reason }),
};
