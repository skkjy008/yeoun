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
  /** 정가 */
  price: number;
  /** 테마 특가가 반영된 실제 판매가 (특가가 없으면 price와 같음) */
  salePrice: number;
  /** 테마 특가 할인율(%), 없으면 0 */
  saleRate: number;
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

/* ───────── 2단계: 장바구니 · 주문 · 쿠폰 · 마이페이지 · 커미션 ───────── */

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  category: string;
  typeLabel: string;
  volume: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  stock: number;
  soldOut: boolean;
  available: boolean;
  /** 정가 (unitPrice는 테마 특가가 반영된 판매가) */
  listPrice: number;
  saleRate: number;
}

export interface Cart {
  items: CartItem[];
  itemsAmount: number;
  shippingFee: number;
  freeShippingThreshold: number;
}

export interface Coupon {
  id: number;
  name: string;
  discountAmount: number;
  /** 정률(%) 쿠폰이면 할인율, 정액 쿠폰은 null */
  discountRate: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  expiresAt: string;
  usedAt: string | null;
  usable: boolean;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_FAILED' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'TRANSFER' | 'EASY_PAY';

export interface OrderItem {
  productId: number;
  name: string;
  typeLabel: string;
  volume: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  firstItemName: string;
  firstItemImage: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  cancellable: boolean;
  memberName: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderDetail {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  cancellable: boolean;
  ordererName: string;
  ordererPhone: string;
  ordererEmail: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  deliveryMemo: string | null;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  paymentProvider: string | null;
  paymentApprovalNo: string;
  itemsAmount: number;
  couponDiscount: number;
  couponName: string | null;
  pointUsed: number;
  shippingFee: number;
  totalAmount: number;
  earnedPoint: number;
  createdAt: string;
  paidAt: string;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface OrderLine {
  productId: number;
  quantity: number;
}

export interface OrderCreateRequest {
  items: OrderLine[];
  fromCart: boolean;
  orderer: { name: string; phone: string; email: string };
  shipping: {
    recipientName: string;
    recipientPhone: string;
    zipCode: string;
    address1: string;
    address2?: string;
    memo?: string;
  };
  saveAsDefaultAddress: boolean;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  couponId?: number | null;
  usePoint: number;
  agreed: boolean;
}

export interface Address {
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2?: string | null;
}

export interface GradeTier {
  code: string;
  label: string;
  threshold: number;
}

export interface MyPageSummary {
  member: Member;
  marketingAgreed: boolean;
  point: number;
  usableCoupons: number;
  wishlistCount: number;
  commissionCount: number;
  grade: {
    grade: string;
    gradeLabel: string;
    nextGrade: string | null;
    nextGradeLabel: string | null;
    totalSpent: number;
    currentThreshold: number;
    nextThreshold: number | null;
    remaining: number;
    tiers: GradeTier[];
  };
  orderStatusCounts: Record<OrderStatus, number>;
  recentOrder: OrderSummary | null;
  address: Address | null;
}

export type CommissionStatus = 'OPEN' | 'PAID' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface CommissionSummary {
  id: number;
  title: string;
  incCd: string | null;
  categoryLabel: string;
  moods: string[];
  budget: number;
  desiredDate: string | null;
  status: CommissionStatus;
  statusLabel: string;
  requesterName: string;
  proposalCount: number;
  perfumerName: string | null;
  createdAt: string;
}

export interface PerfumerCard {
  memberId: number;
  name: string;
  studioName: string;
  careerYears: number;
  ratingAverage: number;
  completedCount: number;
}

export interface CommissionProposal {
  id: number;
  perfumer: PerfumerCard;
  price: number;
  workingDays: number;
  message: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface CommissionDetail {
  summary: CommissionSummary;
  description: string;
  referenceImages: string[];
  perfumer: PerfumerCard | null;
  agreedPrice: number | null;
  paymentMethodLabel: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  startedAt: string | null;
  deliveryNote: string | null;
  deliveredAt: string | null;
  autoConfirmAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundAmount: number | null;
  review: { scentRating: number; perfumerRating: number; content: string; reviewedAt: string } | null;
  settlement: Settlement | null;
  proposals: CommissionProposal[];
  viewer: {
    requester: boolean;
    perfumer: boolean;
    assignedPerfumer: boolean;
    canPropose: boolean;
    proposed: boolean;
    canStart: boolean;
    canDeliver: boolean;
    canConfirm: boolean;
    canReview: boolean;
    canCancel: boolean;
    cancelRefundAmount: number | null;
  };
}

export interface Settlement {
  id: number;
  commissionId: number;
  commissionTitle: string;
  perfumerName: string;
  reason: 'CONFIRMED' | 'PARTIAL_CANCEL';
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
  paidAt: string | null;
}

export interface SettlementSummary {
  pendingAmount: number;
  paidAmount: number;
  feeRate: number;
  items: Settlement[];
}

export interface CommissionCreateRequest {
  title: string;
  incCd: string;
  moods: string;
  description: string;
  budget: number;
  desiredDate?: string | null;
  referenceImages?: string[];
}

/* ───────── 3단계: 결제 · 테마 · 업로드 ───────── */

export interface PaymentConfig {
  provider: 'TOSS' | 'MOCK';
  clientKey: string | null;
  customerKey: string | null;
}

export interface PaymentRequest {
  provider: 'TOSS' | 'MOCK';
  clientKey: string | null;
  customerKey: string;
  orderKey: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  targetType: 'ORDER' | 'COMMISSION';
  targetId: number;
}

export interface PaymentResult {
  orderKey: string;
  status: string;
  targetType: 'ORDER' | 'COMMISSION';
  targetId: number;
  amount: number;
  methodLabel: string | null;
  receiptUrl: string | null;
  approvedAt: string | null;
}

export interface CheckoutResponse {
  order: OrderDetail;
  payment: PaymentRequest | null;
}

export interface AcceptResponse {
  commission: CommissionDetail;
  payment: PaymentRequest;
}

export interface ThemeSummary {
  id: number;
  slug: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  heroImageUrl: string;
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
  published: boolean;
  sortOrder: number;
  productCount: number;
  previewImages: string[];
}

export interface ThemeDetail {
  summary: ThemeSummary;
  story: string | null;
  items: { product: ProductSummary; note: string | null }[];
  others: ThemeSummary[];
}

export interface ThemeRequest {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  story: string;
  heroImageUrl: string;
  startsOn: string | null;
  endsOn: string | null;
  sortOrder: number;
  published: boolean;
  items: { productId: number; note: string }[];
}

export type UploadPurpose = 'PRODUCT' | 'THEME' | 'COMMISSION';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

/* ───────── 이벤트 ───────── */

export type EventKind = 'THEME_SALE' | 'ROULETTE' | 'WELCOME_COUPON';

export interface EventSummary {
  id: number;
  slug: string;
  kind: EventKind;
  title: string;
  summary: string;
  thumbnailUrl: string;
  startsOn: string | null;
  endsOn: string | null;
  status: 'ONGOING' | 'UPCOMING' | 'ENDED';
}

export interface EventDetail {
  summary: EventSummary;
  body: string | null;
  themeSlug: string | null;
  discountRate: number | null;
}

export interface RoulettePrizeInfo {
  code: 'MISS' | 'OFF_10' | 'OFF_20' | 'OFF_50';
  label: string;
  rate: number;
  maxDiscount: number;
  probability: number;
}

export interface RouletteStatus {
  spunToday: boolean;
  todayPrize: RoulettePrizeInfo['code'] | null;
  todayPrizeLabel: string | null;
  nextAvailableAt: string;
  eventActive: boolean;
  prizes: RoulettePrizeInfo[];
}

export interface SpinResult {
  prize: RoulettePrizeInfo['code'];
  label: string;
  rate: number;
  coupon: Coupon | null;
  message: string;
  nextAvailableAt: string;
}
