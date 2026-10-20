export type CategorySlug = 'diffuser' | 'incense' | 'perfume' | 'candle';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductSummary {
  id: number;
  incCd: string;
  category: string;
  categorySlug: CategorySlug;
  name: string;
  subtitle: string;
  typeLabel: string;
  volume: string;
  price: number;
  soldOut: boolean;
  newArrival: boolean;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface ScentNote {
  name: string;
  description: string;
}

export interface Track {
  title: string;
  artist: string;
  youtubeVideoId: string | null;
}

export interface ProductDetail extends Omit<ProductSummary, 'thumbnailUrl'> {
  thumbnailUrl: string | null;
  englishLine: string | null;
  stock: number;
  artworkUrl: string | null;
  artworkCaption: string | null;
  scentFamily: string | null;
  feeling: string | null;
  scene: string | null;
  bestPlace: string | null;
  composition: string | null;
  storyTitle: string | null;
  storyBody: string | null;
  safetyNotice: string | null;
  playlistTitle: string | null;
  intensity: number;
  popularity: number;
  notes: ScentNote[];
  ritualSteps: string[];
  poemLines: string[];
  tracks: Track[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
}

export interface ProductRequest {
  incCd: string;
  name: string;
  subtitle: string;
  englishLine: string | null;
  typeLabel: string;
  volume: string;
  price: number;
  stock: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  artworkUrl: string | null;
  artworkCaption: string | null;
  scentFamily: string | null;
  feeling: string | null;
  scene: string | null;
  bestPlace: string | null;
  composition: string | null;
  storyTitle: string | null;
  storyBody: string | null;
  safetyNotice: string | null;
  playlistTitle: string | null;
  intensity: number;
  popularity: number;
  newArrival: boolean;
  notes: ScentNote[];
  ritualSteps: string[];
  poemLines: string[];
  tracks: Track[];
  tags: string[];
}

export interface FilterOptions {
  feelings: string[];
  scenes: string[];
}

export interface Review {
  id: number;
  productId: number;
  productName: string;
  authorName: string;
  authorId: number;
  rating: number;
  headline: string | null;
  content: string;
  createdAt: string;
}

export interface Post {
  id: number;
  type: 'BANNER' | 'NOTICE' | 'EVENT';
  eyebrow: string | null;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaLink: string | null;
  imageUrl: string | null;
  caption: string | null;
  footnote: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
}

export type Role = 'USER' | 'PERFUMER' | 'ADMIN';

export interface Member {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  grade: string;
  gradeLabel: string;
  perfumerStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  member: Member;
}

export interface PerfumerApplicationRequest {
  studioName: string;
  careerYears: number;
  certification: string;
  portfolioUrl: string;
  introduction: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  perfumer: boolean;
  perfumerApplication: PerfumerApplicationRequest | null;
}

export interface QuizOption {
  optionNo: number;
  label: string;
  imageUrl: string | null;
}

export interface QuizQuestion {
  questionNo: number;
  stepLabel: string;
  englishLabel: string;
  title: string;
  guide: string | null;
  layout: 'GRID' | 'LIST';
  options: QuizOption[];
}

export interface Recommendation {
  headline: string;
  summary: string;
  keywords: string[];
  aiGenerated: boolean;
  answers: { questionNo: number; stepLabel: string; optionNo: number; label: string }[];
  products: ProductSummary[];
}

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface MemberRow {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  grade: string;
  gradeLabel: string;
  marketingAgreed: boolean;
  createdAt: string;
}

export interface PerfumerApplicationRow {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  studioName: string | null;
  careerYears: number;
  certification: string | null;
  portfolioUrl: string | null;
  introduction: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface YoutubeResult {
  query: string;
  videoId: string | null;
  embedUrl: string | null;
  searchUrl: string;
}
