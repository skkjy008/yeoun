export const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

/** "첫 줄\n둘째 줄" 형태의 문자열을 줄 단위 배열로 */
export const lines = (text: string | null | undefined) => (text ? text.split('\n') : []);

export const CATEGORY_META: Record<
  string,
  { label: string; tagline: string; english: string; title: string; description: string; line: string; image: string; sceneLabel: string; cardCopy: string }
> = {
  diffuser: {
    label: '방향제',
    tagline: 'FOR THE HOME',
    english: 'FOR THE HOME — HOME FRAGRANCE',
    title: '당신만의 향으로 당신의 방에 여운을 채워보세요',
    description: '문을 여는 순간의 숲, 햇살이 머무는 창가. 좋아하는 장면을 당신의 공간에 들여보세요.',
    line: '방향제 컬렉션  /  공간에 천천히 스며드는 향',
    image: '/images/category/diffuser.jpg',
    sceneLabel: '놓을 공간',
    cardCopy: '방에 남길 당신만의 향을 찾아보세요',
  },
  incense: {
    label: '인센스',
    tagline: 'FOR THE MOMENT',
    english: 'FOR THE MOMENT — INCENSE',
    title: '번뇌는 연기와 함께, 잠시 쉬어가세요',
    description: '한 가닥 피어오르는 향에 복잡한 마음을 내려놓고, 오롯이 나를 위한 시간을 만나보세요.',
    line: '인센스 컬렉션  /  잠시 멈추는 나만의 의식',
    image: '/images/category/incense.jpg',
    sceneLabel: '함께할 순간',
    cardCopy: '번뇌를 연기와 함께 날려보세요',
  },
  perfume: {
    label: '향수',
    tagline: 'FOR YOURSELF',
    english: 'FOR YOURSELF — EAU DE PARFUM',
    title: '일상에 당신만의 자취를 남겨보세요',
    description: '살결 위의 포근함부터 바람에 스친 꽃까지. 말보다 먼저 나를 전하는 향을 만나보세요.',
    line: '향수 컬렉션  /  나의 분위기가 되는 향',
    image: '/images/category/perfume.jpg',
    sceneLabel: '함께할 일상',
    cardCopy: '일상 속에 나의 자취를 남겨보세요',
  },
  candle: {
    label: '캔들',
    tagline: 'FOR THE EVENING',
    english: 'FOR THE EVENING — SCENTED CANDLE',
    title: '향과 온기로, 따뜻한 쉼을 켜보세요',
    description: '천천히 흐르는 오후, 담요를 덮은 저녁. 작은 불빛과 향으로 하루에 포근한 여백을 더해보세요.',
    line: '캔들 컬렉션  /  향과 함께하는 따뜻한 힐링',
    image: '/images/category/candle.jpg',
    sceneLabel: '켜두고 싶은 때',
    cardCopy: '향과 함께하는 따뜻한 힐링을 만드세요',
  },
};

export const CATEGORY_ORDER = ['diffuser', 'incense', 'perfume', 'candle'] as const;

/** 배송비 정책 (백엔드 ShippingPolicy와 같은 값) */
export const FREE_SHIPPING = 50_000;
export const SHIPPING_FEE = 3_000;
export const shippingFor = (amount: number) => (amount === 0 || amount >= FREE_SHIPPING ? 0 : SHIPPING_FEE);

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 쿠폰을 이 주문 금액에 적용했을 때의 할인 금액 (백엔드 Coupon.discountFor와 같은 계산) */
export function couponDiscount(
  coupon: { discountAmount: number; discountRate: number | null; maxDiscountAmount: number | null; minOrderAmount: number },
  amount: number,
) {
  if (amount < coupon.minOrderAmount) return 0;
  if (!coupon.discountRate) return Math.min(coupon.discountAmount, amount);
  let discount = Math.floor((amount * coupon.discountRate) / 100 / 10) * 10;
  if (coupon.maxDiscountAmount != null) discount = Math.min(discount, coupon.maxDiscountAmount);
  return Math.min(discount, amount);
}

/** 쿠폰 혜택 한 줄: "3,000원" 또는 "10% (최대 10,000원)" */
export function couponBenefit(coupon: { discountAmount: number; discountRate: number | null; maxDiscountAmount: number | null }) {
  if (!coupon.discountRate) return formatPrice(coupon.discountAmount);
  return `${coupon.discountRate}%${coupon.maxDiscountAmount ? ` (최대 ${formatPrice(coupon.maxDiscountAmount)})` : ''}`;
}

/** 이벤트·테마 기간 표시: "2026.10.01 ~ 2026.11.02" / 기간이 없으면 "상시 진행" */
export function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return '상시 진행';
  return `${start ? formatDate(start) : ''} ~ ${end ? formatDate(end) : ''}`.trim();
}
