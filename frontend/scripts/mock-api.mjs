/**
 * 프론트엔드 단독 개발용 Mock API 서버.
 * 백엔드(Spring Boot)와 같은 엔드포인트·응답 형태를 흉내 내며, 데이터는 backend/src/main/resources/seed/*.json 을 그대로 사용합니다.
 *   npm run dev:mock  →  http://localhost:5173 (프록시 → mock :8080)
 * 실제 서비스에는 사용하지 않습니다.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = resolve(here, '../../backend/src/main/resources/seed');
const read = (name) => JSON.parse(readFileSync(resolve(seedDir, name), 'utf8'));

const categories = read('categories.json');
const SLUG = { '001': 'diffuser', '002': 'incense', '003': 'perfume', '004': 'candle' };
const LABEL = { '001': '방향제', '002': '인센스', '003': '향수', '004': '캔들' };
const CODE = Object.fromEntries(Object.entries(SLUG).map(([k, v]) => [v, k]));
const TAG_LABELS = { WOODY: '우디', GREEN: '그린', CITRUS: '시트러스', MUSK: '머스크', FLORAL: '플로럴', TEA: '티', AMBER: '앰버', AQUATIC: '아쿠아틱', EARTHY: '어시', POWDERY: '파우더리', SWEET: '스위트', HERBAL: '허벌', SMOKY: '스모키' };

const now = () => new Date().toISOString();

const products = read('products.json').map((p, i) => {
  const d = categories[p.incCd];
  return {
    id: i + 1,
    incCd: p.incCd,
    name: p.name,
    subtitle: p.subtitle,
    englishLine: p.englishLine ?? null,
    typeLabel: d.typeLabel,
    volume: d.volume,
    price: p.price,
    stock: p.stock,
    imageUrl: p.image,
    thumbnailUrl: p.thumbnail ?? null,
    artworkUrl: p.artwork ?? null,
    artworkCaption: p.artworkCaption ?? null,
    scentFamily: p.scentFamily ?? null,
    feeling: p.feeling ?? null,
    scene: p.scene ?? null,
    bestPlace: p.bestPlace ?? null,
    composition: d.composition,
    storyTitle: p.storyTitle ?? null,
    storyBody: p.storyBody ?? null,
    safetyNotice: d.safetyNotice,
    playlistTitle: p.playlistTitle ?? d.playlistTitle,
    intensity: p.intensity ?? 2,
    popularity: p.popularity ?? 0,
    newArrival: !!p.newArrival,
    notes: (p.notes ?? []).map(([name, description]) => ({ name, description })),
    ritualSteps: d.ritualSteps,
    poemLines: p.poem ?? d.poem,
    tracks: (p.tracks ? p.tracks.map(([title, artist]) => ({ title, artist })) : d.tracks).map((t) => ({ ...t, youtubeVideoId: null })),
    tags: p.tags ?? [],
    active: true,
  };
});

const summary = (p) => ({
  id: p.id, incCd: p.incCd, category: LABEL[p.incCd], categorySlug: SLUG[p.incCd], name: p.name, subtitle: p.subtitle,
  typeLabel: p.typeLabel, volume: p.volume, price: p.price, soldOut: p.stock <= 0, newArrival: p.newArrival,
  imageUrl: p.imageUrl, thumbnailUrl: p.thumbnailUrl ?? p.imageUrl,
});

const questions = read('questions.json').map((q) => ({
  questionNo: q.no, stepLabel: q.step, englishLabel: q.english, title: q.title, guide: q.guide, layout: q.layout,
  options: q.options.map((o, i) => ({ optionNo: i + 1, label: o.label, imageUrl: o.image, tags: o.tags ?? '', category: o.category ?? '', intensity: o.intensity ?? null })),
}));

const posts = read('posts.json').map((p, i) => ({
  id: i + 1, type: 'BANNER', eyebrow: p.eyebrow, title: p.title, body: p.body, ctaLabel: p.ctaLabel, ctaLink: p.ctaLink,
  imageUrl: p.image, caption: p.caption, footnote: p.footnote, sortOrder: i + 1, published: true, createdAt: now(),
}));

let memberSeq = 10;
const members = [
  { id: 1, email: 'admin@yeoun.example', password: 'admin1234!', name: '여운 운영자', phone: '010-0000-0000', role: 'ADMIN', grade: 'DIAMOND' },
  { id: 2, email: 'yeon@yeoun.example', password: 'yeoun1234!', name: '김여연', phone: '010-1234-5678', role: 'USER', grade: 'GOLD' },
  { id: 3, email: 'seowoo@yeoun.example', password: 'yeoun1234!', name: '박서우', phone: '010-1234-5678', role: 'USER', grade: 'SILVER' },
  { id: 4, email: 'haseo@yeoun.example', password: 'yeoun1234!', name: '이하서', phone: '010-1234-5678', role: 'USER', grade: 'PLATINUM' },
  { id: 5, email: 'walk@yeoun.example', password: 'yeoun1234!', name: '산책하는이', phone: '010-1234-5678', role: 'USER', grade: 'BRONZE' },
  { id: 6, email: 'newnose@yeoun.example', password: 'yeoun1234!', name: '한지향', phone: '010-1234-5678', role: 'USER', grade: 'BRONZE' },
  { id: 7, email: 'atelier@yeoun.example', password: 'yeoun1234!', name: '정소향', phone: '010-1234-5678', role: 'PERFUMER', grade: 'GOLD' },
].map((m) => ({ marketingAgreed: true, createdAt: now(), ...m }));
const GRADE_LABEL = { BRONZE: '브론즈', SILVER: '실버', GOLD: '골드', PLATINUM: '플래티넘', DIAMOND: '다이아' };

let appSeq = 3;
const applications = [
  { id: 2, memberId: 7, studioName: '아틀리에 소향', careerYears: 7, certification: '조향사 자격증 (예시)', portfolioUrl: 'https://example.com/sohyang', introduction: '비 오는 날의 숲과 오래된 서재의 향을 즐겨 만듭니다.', status: 'APPROVED', rejectReason: null, createdAt: now(), reviewedAt: now() },
  { id: 1, memberId: 6, studioName: '지향 랩', careerYears: 2, certification: '향료 아카데미 수료 (예시)', portfolioUrl: 'https://example.com/jihyang', introduction: '판타지 세계관 속 장소를 향으로 옮기는 작업을 하고 있어요.', status: 'PENDING', rejectReason: null, createdAt: now(), reviewedAt: null },
];
let notiSeq = 2;
const notifications = [{ id: 1, recipientId: 1, type: 'PERFUMER_APPLICATION', message: '한지향 님이 조향사 인증을 요청했습니다.', link: '/admin/perfumers', read: false, createdAt: now() }];

const mask = (n) => (n.length < 2 ? n : n.length === 2 ? `${n[0]}*` : n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]);
let reviewSeq = 5;
const reviews = [
  { id: 4, productId: 1, memberId: 2, rating: 5, headline: '집에 돌아오는 순간이\n조금 더 기다려져요.', content: '현관에 두었는데 문을 열 때마다 숲을 만난 기분이에요. 과하지 않아 더 좋아요.', featured: true, createdAt: now() },
  { id: 3, productId: 10, memberId: 3, rating: 5, headline: '하루를 마무리하는\n가장 조용한 방법.', content: '잠들기 전 한 개비를 태우는 시간이 생겼어요. 나에게 집중하는 작은 습관이에요.', featured: true, createdAt: now() },
  { id: 2, productId: 19, memberId: 4, rating: 5, headline: '향이 아니라,\n제 분위기가 된 것 같아요.', content: '포근하고 깨끗한 잔향이 오래 남아요. 매일 손이 가는 저만의 향이 되었어요.', featured: true, createdAt: now() },
  { id: 1, productId: 1, memberId: 5, rating: 4, headline: null, content: '젖은 이끼 아트워크를 보니 비 오는 날 창문을 조금 열어 둔 서재가 떠올라요.', featured: false, createdAt: now() },
];
const reviewDto = (r) => {
  const m = members.find((x) => x.id === r.memberId);
  const p = products.find((x) => x.id === r.productId);
  return { id: r.id, productId: r.productId, productName: p.name, authorName: mask(m.name), authorId: m.id, rating: r.rating, headline: r.headline, content: r.content, createdAt: r.createdAt };
};

const preferences = new Map(); // memberId -> {questionNo: optionNo}

const memberDto = (m) => {
  const app = applications.find((a) => a.memberId === m.id);
  return { id: m.id, email: m.email, name: m.name, phone: m.phone, role: m.role, grade: m.grade, gradeLabel: GRADE_LABEL[m.grade], perfumerStatus: app?.status ?? null };
};

function recommend(memberId) {
  const answers = preferences.get(memberId);
  if (!answers) return null;
  const weights = {};
  const cats = new Set();
  let intensity = null;
  const answerDtos = [];
  for (const q of questions) {
    const o = q.options.find((x) => x.optionNo === answers[q.questionNo]);
    if (!o) continue;
    answerDtos.push({ questionNo: q.questionNo, stepLabel: q.stepLabel, optionNo: o.optionNo, label: o.label });
    o.tags.split(',').filter(Boolean).forEach((t) => (weights[t] = (weights[t] ?? 0) + 1));
    o.category.split(',').filter(Boolean).forEach((c) => cats.add(c));
    if (o.intensity) intensity = o.intensity;
  }
  const score = (p) => p.tags.reduce((s, t) => s + (weights[t] ?? 0) * 3, 0) + (cats.has(p.incCd) ? 6 : 0) + (intensity ? (2 - Math.abs(intensity - p.intensity)) * 2 : 0);
  const ranked = products.filter((p) => p.active).sort((a, b) => score(b) - score(a) || b.popularity - a.popularity || a.id - b.id).slice(0, 4);
  const keywords = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => TAG_LABELS[t] ?? t);
  const intensityLabel = intensity === 1 ? '가볍고 은은한' : intensity === 3 ? '묵직하고 깊은' : '기분 좋게 감도는';
  return {
    headline: `${keywords.join(' · ')}의 결을 닮은, ${intensityLabel} 여운`,
    summary: `'${answerDtos[0]?.label}'처럼, 당신은 ${keywords.join(', ')} 결이 느껴지는 향에 오래 머무는 사람이에요. ${intensityLabel} 잔향을 좋아하는 당신에게 「${ranked[0].name}」부터 천천히 만나보길 권해요.`,
    keywords, aiGenerated: false, answers: answerDtos, products: ranked.map(summary),
  };
}

const page = (list, pageNo, size) => ({
  content: list.slice(pageNo * size, pageNo * size + size), page: pageNo, size, totalElements: list.length, totalPages: Math.ceil(list.length / size),
});

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const fail = (res, status, code, message) => send(res, status, { code, message });

async function readBody(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}


/* ───────── 2단계: 장바구니 · 주문 · 쿠폰 · 찜 · 마이페이지 · 커미션 ───────── */
members.forEach((x) => {
  x.point = 0;
  x.address = null;
});
const STATUS_LABEL = { PENDING_PAYMENT: '결제 대기', PAYMENT_FAILED: '결제 실패', PAID: '결제 완료', PREPARING: '상품 준비 중', SHIPPING: '배송 중', DELIVERED: '배송 완료', CANCELLED: '주문 취소' };
const NEXT_STATUS = { PAID: 'PREPARING', PREPARING: 'SHIPPING', SHIPPING: 'DELIVERED' };
const METHOD_LABEL = { CARD: '신용 / 체크카드', TRANSFER: '계좌이체', EASY_PAY: '간편결제' };
const GRADES = [['BRONZE', 0], ['SILVER', 100000], ['GOLD', 300000], ['PLATINUM', 600000], ['DIAMOND', 1000000]];
const shippingFor = (amount) => (amount === 0 || amount >= 50000 ? 0 : 3000);
const daysFromNow = (d) => new Date(Date.now() + d * 86400000).toISOString();

const sseClients = new Map(); // memberId -> Set<res>
function notify(recipientId, type, message, link) {
  const n = { id: notiSeq++, recipientId, type, message, link, read: false, createdAt: now() };
  notifications.unshift(n);
  const { recipientId: _r, ...dto } = n;
  sseClients.get(recipientId)?.forEach((c) => c.write(`event:notification\ndata:${JSON.stringify(dto)}\n\n`));
}
function stream(req, res, me) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const unreadCount = notifications.filter((n) => n.recipientId === me.id && !n.read).length;
  res.write(`event:connected\ndata:${JSON.stringify({ unreadCount })}\n\n`);
  if (!sseClients.has(me.id)) sseClients.set(me.id, new Set());
  sseClients.get(me.id).add(res);
  const ping = setInterval(() => res.write(':ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(ping);
    sseClients.get(me.id)?.delete(res);
  });
  return undefined;
}

let couponSeq = 1;
const coupons = [];
function issueWelcome(member) {
  if (member.role === 'ADMIN') return;
  coupons.push({ id: couponSeq++, memberId: member.id, name: '첫 향을 위한 환영 쿠폰', discountAmount: 3000, minOrderAmount: 30000, expiresAt: daysFromNow(30), usedAt: null });
}
members.forEach(issueWelcome);
const couponDto = ({ memberId: _m, ...c }) => ({ ...c, usable: !c.usedAt && new Date(c.expiresAt) > new Date() });

let cartSeq = 1;
const carts = []; // {id, memberId, productId, quantity, createdAt}
const cartDto = (memberId) => {
  const items = carts
    .filter((c) => c.memberId === memberId)
    .sort((a, b) => b.id - a.id)
    .map((c) => {
      const p = products.find((x) => x.id === c.productId);
      const available = p.active && p.stock > 0 && p.stock >= c.quantity;
      return { id: c.id, productId: p.id, name: p.name, category: LABEL[p.incCd], typeLabel: p.typeLabel, volume: p.volume, imageUrl: p.imageUrl, unitPrice: p.price, quantity: c.quantity, lineAmount: p.price * c.quantity, stock: p.stock, soldOut: p.stock <= 0, available };
    });
  const itemsAmount = items.filter((i) => i.available).reduce((s, i) => s + i.lineAmount, 0);
  return { items, itemsAmount, shippingFee: shippingFor(itemsAmount), freeShippingThreshold: 50000 };
};

const wishes = []; // {memberId, productId, createdAt}

let orderSeq = 1;
const orders = [];
const itemDto = (i) => ({ ...i });
const orderSummary = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, statusLabel: STATUS_LABEL[o.status], firstItemName: o.items[0]?.name, firstItemImage: o.items[0]?.imageUrl,
  itemCount: o.items.length, totalQuantity: o.items.reduce((s, i) => s + i.quantity, 0), totalAmount: o.totalAmount, cancellable: o.status === 'PAID',
  memberName: members.find((x) => x.id === o.memberId)?.name, createdAt: o.createdAt, items: o.items.map(itemDto),
});
const orderDetail = (o) => ({
  ...o, statusLabel: STATUS_LABEL[o.status], cancellable: o.status === 'PAID', paymentMethodLabel: METHOD_LABEL[o.paymentMethod],
  couponName: o.couponId ? coupons.find((c) => c.id === o.couponId)?.name : null, items: o.items.map(itemDto),
});
function releaseOrder(o) {
  o.items.forEach((i) => (products.find((p) => p.id === i.productId).stock += i.quantity));
  if (o.couponId) coupons.find((c) => c.id === o.couponId).usedAt = null;
  members.find((x) => x.id === o.memberId).point += o.pointUsed;
}
function cancelOrder(o) {
  const pay = payments.find((x) => x.targetType === 'ORDER' && x.targetId === o.id && x.status === 'DONE');
  if (pay) Object.assign(pay, { status: 'CANCELED', canceledAmount: pay.amount });
  o.status = 'CANCELLED';
  o.cancelledAt = now();
  o.items.forEach((i) => (products.find((p) => p.id === i.productId).stock += i.quantity));
  if (o.couponId) coupons.find((c) => c.id === o.couponId).usedAt = null;
  members.find((x) => x.id === o.memberId).point += o.pointUsed;
}
function createOrder(memberId, body, status = 'PENDING_PAYMENT', createdAt = now(), number = null) {
  const items = body.items.map(({ productId, quantity }) => {
    const p = products.find((x) => x.id === productId && x.active);
    if (!p) throw Object.assign(new Error('주문할 수 없는 상품이 포함되어 있습니다.'), { status: 404 });
    if (quantity > p.stock) throw Object.assign(new Error(p.stock === 0 ? `'${p.name}'은(는) 품절되었어요.` : `'${p.name}'의 남은 재고는 ${p.stock}개입니다.`), { status: 409 });
    return { productId: p.id, name: p.name, typeLabel: p.typeLabel, volume: p.volume, imageUrl: p.imageUrl, unitPrice: p.price, quantity, lineAmount: p.price * quantity };
  });
  const itemsAmount = items.reduce((s, i) => s + i.lineAmount, 0);
  let couponDiscount = 0;
  if (body.couponId) {
    const c = coupons.find((x) => x.id === body.couponId && x.memberId === memberId);
    if (!c || c.usedAt) throw Object.assign(new Error('이미 사용했거나 기간이 지난 쿠폰입니다.'), { status: 400 });
    if (itemsAmount < c.minOrderAmount) throw Object.assign(new Error('쿠폰 최소 주문 금액을 확인해 주세요.'), { status: 400 });
    c.usedAt = now();
    couponDiscount = Math.min(c.discountAmount, itemsAmount);
  }
  const member = members.find((x) => x.id === memberId);
  const pointUsed = body.usePoint ?? 0;
  if (pointUsed > member.point || pointUsed > itemsAmount - couponDiscount) throw Object.assign(new Error('사용할 수 있는 적립금을 초과했습니다.'), { status: 400 });
  member.point -= pointUsed;
  items.forEach((i) => (products.find((p) => p.id === i.productId).stock -= i.quantity));
  const shippingFee = shippingFor(itemsAmount);
  const date = createdAt.slice(0, 10).replace(/-/g, '');
  const o = {
    id: orderSeq++, memberId, orderNumber: number ?? `YN-${date}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`, status,
    ordererName: body.orderer.name, ordererPhone: body.orderer.phone, ordererEmail: body.orderer.email,
    recipientName: body.shipping.recipientName, recipientPhone: body.shipping.recipientPhone, zipCode: body.shipping.zipCode,
    address1: body.shipping.address1, address2: body.shipping.address2 ?? null, deliveryMemo: body.shipping.memo || null,
    paymentMethod: body.paymentMethod, paymentProvider: body.paymentProvider ?? null, fromCart: Boolean(body.fromCart),
    paymentApprovalNo: status === 'PENDING_PAYMENT' ? null : `MOCK-SEED-${orderSeq}`,
    couponId: body.couponId ?? null, itemsAmount, couponDiscount, pointUsed, shippingFee, totalAmount: itemsAmount - couponDiscount - pointUsed + shippingFee,
    earnedPoint: 0, createdAt, paidAt: status === 'PENDING_PAYMENT' ? null : createdAt, cancelledAt: null, items,
  };
  orders.push(o);
  if (body.saveAsDefaultAddress) member.address = { recipientName: o.recipientName, recipientPhone: o.recipientPhone, zipCode: o.zipCode, address1: o.address1, address2: o.address2 };
  return o;
}
// 데모 회원(김여연) 주문: 배송 완료 1건, 배송 중 1건
{
  const yeonAddress = { recipientName: '김여연', recipientPhone: '010-1234-5678', zipCode: '04524', address1: '서울특별시 중구 세종대로 110', address2: '여운빌 302호', memo: '문 앞에 놓아 주세요.' };
  const base = { orderer: { name: '김여연', phone: '010-1234-5678', email: 'yeon@yeoun.example' }, shipping: yeonAddress, paymentMethod: 'CARD', paymentProvider: '여운카드(예시)', saveAsDefaultAddress: true };
  const delivered = createOrder(2, { ...base, items: [{ productId: 1, quantity: 1 }, { productId: 10, quantity: 2 }] }, 'DELIVERED', daysFromNow(-8), 'YN-20261012-0417');
  delivered.earnedPoint = Math.floor(delivered.itemsAmount / 100);
  members[1].point += delivered.earnedPoint;
  createOrder(2, { ...base, items: [{ productId: 19, quantity: 1 }, { productId: 28, quantity: 1 }] }, 'SHIPPING', daysFromNow(-2), 'YN-20261018-2731');
  wishes.push({ memberId: 2, productId: 2, createdAt: now() }, { memberId: 2, productId: 21, createdAt: now() });
}

let commissionSeq = 1;
let proposalSeq = 1;
const commissions = [];
const proposals = [];
const perfumerCard = (memberId) => {
  const mem = members.find((x) => x.id === memberId);
  const app = applications.find((a) => a.memberId === memberId);
  const rated = commissions.filter((c) => c.perfumerId === memberId && c.perfumerRating);
  return {
    memberId, name: mem.name, studioName: app?.studioName ?? mem.name, careerYears: app?.careerYears ?? 0,
    ratingAverage: rated.length ? Math.round((rated.reduce((s, c) => s + c.perfumerRating, 0) / rated.length) * 10) / 10 : 0,
    completedCount: commissions.filter((c) => c.perfumerId === memberId && c.status === 'COMPLETED').length,
  };
};
const C_LABEL = { OPEN: '제안 받는 중', PAID: '결제 완료 · 제작 대기', IN_PROGRESS: '제작 중', DELIVERED: '전달 완료', COMPLETED: '구매 확정', CANCELLED: '의뢰 취소' };
const commissionSummary = (c) => ({
  id: c.id, title: c.title, incCd: c.incCd, categoryLabel: c.incCd ? LABEL[c.incCd] : '조향사 제안에 맡김', moods: (c.moods ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  budget: c.budget, desiredDate: c.desiredDate, status: c.status, statusLabel: C_LABEL[c.status], requesterName: mask(members.find((x) => x.id === c.requesterId).name),
  proposalCount: proposals.filter((p) => p.commissionId === c.id).length, perfumerName: c.perfumerId ? members.find((x) => x.id === c.perfumerId).name : null, createdAt: c.createdAt,
});
const commissionDetail = (c, me) => {
  const isRequester = c.requesterId === me.id;
  const assigned = c.perfumerId === me.id;
  const own = proposals.filter((p) => p.commissionId === c.id);
  const proposed = own.some((p) => p.perfumerId === me.id);
  const showPrivate = isRequester || assigned || me.role === 'ADMIN';
  const canCancel = (isRequester && ['OPEN', 'PAID', 'IN_PROGRESS'].includes(c.status)) || (assigned && c.status === 'PAID');
  const st = settlements.find((x) => x.commissionId === c.id);
  return {
    summary: commissionSummary(c), description: c.description, referenceImages: c.referenceImages ?? [],
    perfumer: c.perfumerId ? perfumerCard(c.perfumerId) : null, agreedPrice: c.agreedPrice ?? null,
    paymentMethodLabel: showPrivate && c.paidAt ? '모의 결제' : null, receiptUrl: null, paidAt: c.paidAt ?? null, startedAt: c.startedAt ?? null,
    deliveryNote: showPrivate ? c.deliveryNote ?? null : null, deliveredAt: c.deliveredAt ?? null,
    autoConfirmAt: c.status === 'DELIVERED' ? new Date(new Date(c.deliveredAt).getTime() + 7 * 86400000).toISOString() : null,
    confirmedAt: c.confirmedAt ?? null, cancelledAt: c.cancelledAt ?? null, cancelReason: showPrivate ? c.cancelReason ?? null : null,
    refundAmount: showPrivate ? c.refundAmount ?? null : null,
    review: c.reviewedAt ? { scentRating: c.scentRating, perfumerRating: c.perfumerRating, content: c.reviewContent, reviewedAt: c.reviewedAt } : null,
    settlement: st && (assigned || me.role === 'ADMIN') ? settlementDto(st) : null,
    proposals: own.filter((p) => isRequester || me.role === 'ADMIN' || p.perfumerId === me.id).map((p) => ({ id: p.id, perfumer: perfumerCard(p.perfumerId), price: p.price, workingDays: p.workingDays, message: p.message, status: p.status, createdAt: p.createdAt })),
    viewer: {
      requester: isRequester, perfumer: me.role === 'PERFUMER', assignedPerfumer: assigned,
      canPropose: me.role === 'PERFUMER' && !isRequester && !proposed && c.status === 'OPEN', proposed,
      canStart: assigned && c.status === 'PAID', canDeliver: assigned && c.status === 'IN_PROGRESS',
      canConfirm: isRequester && c.status === 'DELIVERED',
      canReview: isRequester && !c.reviewedAt && ['DELIVERED', 'COMPLETED'].includes(c.status),
      canCancel, cancelRefundAmount: canCancel && c.status !== 'OPEN' ? refundFor(c) : null,
    },
  };
};
{
  const done = { id: commissionSeq++, requesterId: 4, title: '할머니 댁 마당의 무화과나무', incCd: '003', moods: '여름 오후, 무화과 잎, 햇볕에 데워진 돌담', description: '어릴 때 여름방학마다 가던 할머니 댁 마당에 큰 무화과나무가 있었어요. 잎을 문지르면 나던 풋풋하고 달큰한 냄새, 햇볕에 데워진 돌담 냄새를 향수로 간직하고 싶어요.', budget: 180000, desiredDate: daysFromNow(10).slice(0, 10), status: 'COMPLETED', perfumerId: 7, agreedPrice: 170000, paymentMethod: 'CARD', paidAt: daysFromNow(-12), deliveryNote: '50ml 향수 1병과 시향지 3장을 보내 드렸어요. 첫 향은 잎, 30분 뒤에는 돌담의 온기가 남아요.', deliveredAt: daysFromNow(-3), startedAt: daysFromNow(-11), confirmedAt: daysFromNow(-1), scentRating: 5, perfumerRating: 5, reviewContent: '정말 그 마당에 서 있는 기분이었어요. 상담할 때 기억을 하나하나 물어봐 주셔서 감동했어요.', reviewedAt: daysFromNow(-1), createdAt: daysFromNow(-14) };
  commissions.push(done);
  proposals.push({ id: proposalSeq++, commissionId: done.id, perfumerId: 7, price: 170000, workingDays: 14, message: '무화과 잎과 우유 같은 무화과 과육을 중심에 두고, 따뜻한 미네랄 노트로 돌담을 표현해 볼게요.', status: 'ACCEPTED', createdAt: daysFromNow(-13) });
  const open = { id: commissionSeq++, requesterId: 3, title: '비 오는 날의 오래된 서재', incCd: '001', moods: '비, 오래된 책, 나무 책장', description: '비가 오는 날 창문을 조금 열어 둔 서재의 공기를 방에 두고 싶어요. 종이와 나무 냄새, 젖은 흙냄새가 은은하게 섞였으면 좋겠어요. 너무 달지 않게요.', budget: 90000, desiredDate: daysFromNow(21).slice(0, 10), status: 'OPEN', createdAt: daysFromNow(-2) };
  commissions.push(open);
  proposals.push({ id: proposalSeq++, commissionId: open.id, perfumerId: 7, price: 85000, workingDays: 10, message: '시더우드와 파피루스로 책장을, 페트리코 어코드로 비 냄새를 표현한 디퓨저를 제안드려요.', status: 'PROPOSED', createdAt: daysFromNow(-1) });
  commissions.push({ id: commissionSeq++, requesterId: 5, title: '새벽 등산로의 첫 공기', incCd: null, moods: '새벽, 솔잎, 차가운 공기', description: '해 뜨기 전 산에 오를 때 처음 들이마시는 차갑고 맑은 공기를 향으로 만들고 싶어요. 향 종류는 조향사님 제안에 맡길게요.', budget: 60000, desiredDate: daysFromNow(30).slice(0, 10), status: 'OPEN', createdAt: daysFromNow(-1) });
}

async function shopRoutes({ method, path, q, me, req, res }) {
  let m;
  const err = (e) => fail(res, e.status ?? 400, 'BAD_REQUEST', e.message);
  // 장바구니
  if (method === 'GET' && path === '/api/cart') return send(res, 200, cartDto(me.id));
  if (method === 'GET' && path === '/api/cart/count') return send(res, 200, { count: carts.filter((c) => c.memberId === me.id).length });
  if (method === 'POST' && path === '/api/cart/items') {
    const body = await readBody(req);
    const p = products.find((x) => x.id === body.productId && x.active);
    if (!p) return fail(res, 404, 'NOT_FOUND', '상품을 찾을 수 없습니다.');
    if (p.stock <= 0) return fail(res, 400, 'BAD_REQUEST', '품절된 상품은 담을 수 없어요.');
    const existing = carts.find((c) => c.memberId === me.id && c.productId === p.id);
    if (existing) existing.quantity = Math.min(10, existing.quantity + body.quantity);
    else carts.push({ id: cartSeq++, memberId: me.id, productId: p.id, quantity: body.quantity, createdAt: now() });
    return send(res, 200, cartDto(me.id));
  }
  if (method === 'PATCH' && (m = path.match(/^\/api\/cart\/items\/(\d+)$/))) {
    const item = carts.find((c) => c.id === Number(m[1]) && c.memberId === me.id);
    if (!item) return fail(res, 404, 'NOT_FOUND', '장바구니 상품을 찾을 수 없습니다.');
    item.quantity = Math.max(1, Math.min(10, (await readBody(req)).quantity));
    return send(res, 200, cartDto(me.id));
  }
  if (method === 'DELETE' && path === '/api/cart/items') {
    const ids = (q.ids ?? '').split(',').map(Number);
    for (let i = carts.length - 1; i >= 0; i--) if (carts[i].memberId === me.id && ids.includes(carts[i].id)) carts.splice(i, 1);
    return send(res, 200, cartDto(me.id));
  }
  // 찜
  if (method === 'GET' && path === '/api/wishlist') return send(res, 200, wishes.filter((w) => w.memberId === me.id).map((w) => summary(products.find((p) => p.id === w.productId))));
  if (method === 'GET' && path === '/api/wishlist/ids') return send(res, 200, wishes.filter((w) => w.memberId === me.id).map((w) => w.productId));
  if ((m = path.match(/^\/api\/wishlist\/(\d+)$/))) {
    const productId = Number(m[1]);
    const idx = wishes.findIndex((w) => w.memberId === me.id && w.productId === productId);
    if (method === 'PUT' && idx < 0) wishes.unshift({ memberId: me.id, productId, createdAt: now() });
    if (method === 'DELETE' && idx >= 0) wishes.splice(idx, 1);
    return send(res, 204);
  }
  // 쿠폰
  if (method === 'GET' && path === '/api/coupons/me') return send(res, 200, coupons.filter((c) => c.memberId === me.id).map(couponDto));
  // 주문
  if (method === 'POST' && path === '/api/orders') {
    const body = await readBody(req);
    if (!body.agreed) return fail(res, 400, 'BAD_REQUEST', '주문 내용 확인 및 결제 진행에 동의해 주세요.');
    try {
      const o = createOrder(me.id, body);
      const orderName = o.items.length > 1 ? `${o.items[0].name} 외 ${o.items.length - 1}건` : o.items[0].name;
      const payment = preparePayment(me, 'ORDER', o.id, null, o.orderNumber, orderName, o.totalAmount);
      return send(res, 201, { order: orderDetail(o), payment });
    } catch (e) {
      return err(e);
    }
  }
  if (method === 'GET' && path === '/api/orders') {
    const visible = ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    const list = orders.filter((o) => o.memberId === me.id && visible.includes(o.status) && (!q.status || o.status === q.status)).sort((a, b) => b.id - a.id);
    return send(res, 200, page(list.map(orderSummary), Number(q.page ?? 0), Number(q.size ?? 10)));
  }
  if ((m = path.match(/^\/api\/orders\/(\d+)(\/cancel)?$/))) {
    const o = orders.find((x) => x.id === Number(m[1]));
    if (!o) return fail(res, 404, 'NOT_FOUND', '주문을 찾을 수 없습니다.');
    if (o.memberId !== me.id && me.role !== 'ADMIN') return fail(res, 403, 'FORBIDDEN', '본인의 주문만 조회할 수 있습니다.');
    if (method === 'POST' && m[2]) {
      if (o.status !== 'PAID') return fail(res, 400, 'BAD_REQUEST', '결제 완료 상태에서만 바로 취소할 수 있어요.');
      cancelOrder(o);
    }
    return send(res, 200, orderDetail(o));
  }
  // 마이페이지
  if (method === 'GET' && path === '/api/members/me/summary') {
    const mine = orders.filter((o) => o.memberId === me.id);
    const counts = Object.fromEntries(Object.keys(STATUS_LABEL).map((s) => [s, mine.filter((o) => o.status === s).length]));
    const totalSpent = mine.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.totalAmount, 0);
    const gi = GRADES.findIndex(([g]) => g === me.grade);
    const next = GRADES[gi + 1];
    const recent = [...mine].filter((o) => ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(o.status)).sort((a, b) => b.id - a.id)[0];
    return send(res, 200, {
      member: memberDto(me), marketingAgreed: me.marketingAgreed, point: me.point, usableCoupons: coupons.filter((c) => c.memberId === me.id).map(couponDto).filter((c) => c.usable).length,
      wishlistCount: wishes.filter((w) => w.memberId === me.id).length, commissionCount: commissions.filter((c) => c.requesterId === me.id).length,
      grade: { grade: me.grade, gradeLabel: GRADE_LABEL[me.grade], nextGrade: next?.[0] ?? null, nextGradeLabel: next ? GRADE_LABEL[next[0]] : null, totalSpent, currentThreshold: GRADES[gi][1], nextThreshold: next?.[1] ?? null, remaining: next ? Math.max(0, next[1] - totalSpent) : 0, tiers: GRADES.map(([code, threshold]) => ({ code, label: GRADE_LABEL[code], threshold })) },
      orderStatusCounts: counts, recentOrder: recent ? orderSummary(recent) : null, address: me.address,
    });
  }
  if (method === 'PUT' && path === '/api/members/me') {
    Object.assign(me, await readBody(req));
    return send(res, 200, memberDto(me));
  }
  if (method === 'PATCH' && path === '/api/members/me/password') {
    const body = await readBody(req);
    if (body.currentPassword !== me.password) return fail(res, 400, 'BAD_REQUEST', '현재 비밀번호가 일치하지 않습니다.');
    me.password = body.newPassword;
    return send(res, 204);
  }
  if (method === 'PUT' && path === '/api/members/me/address') {
    me.address = await readBody(req);
    return send(res, 200, me.address);
  }
  if (method === 'GET' && path === '/api/reviews/me') return send(res, 200, reviews.filter((r) => r.memberId === me.id).map(reviewDto));
  // 커미션
  if (method === 'GET' && path === '/api/commissions/me') return send(res, 200, commissions.filter((c) => c.requesterId === me.id).sort((a, b) => b.id - a.id).map(commissionSummary));
  if (method === 'GET' && path === '/api/commissions/proposed') return send(res, 200, proposals.filter((p) => p.perfumerId === me.id).map((p) => commissionSummary(commissions.find((c) => c.id === p.commissionId))));
  if (method === 'POST' && path === '/api/commissions') {
    const body = await readBody(req);
    if (!body.title || (body.description ?? '').length < 20) return fail(res, 400, 'BAD_REQUEST', '원하는 향을 20자 이상 들려주세요.');
    const c = { id: commissionSeq++, requesterId: me.id, title: body.title, incCd: body.incCd || null, moods: body.moods, description: body.description, budget: body.budget, desiredDate: body.desiredDate ?? null, referenceImages: body.referenceImages ?? [], status: 'OPEN', createdAt: now() };
    commissions.push(c);
    members.filter((x) => x.role === 'PERFUMER' && x.id !== me.id).forEach((x) => notify(x.id, 'COMMISSION_REQUEST', `새 커미션 의뢰 '${c.title}' · 예산 ${c.budget.toLocaleString()}원`, `/custom/${c.id}`));
    return send(res, 201, commissionDetail(c, me));
  }
  if ((m = path.match(/^\/api\/commissions\/(\d+)(?:\/(proposals|deliver|review|cancel|start|confirm)(?:\/(\d+)\/accept)?)?$/))) {
    const c = commissions.find((x) => x.id === Number(m[1]));
    if (!c) return fail(res, 404, 'NOT_FOUND', '의뢰를 찾을 수 없습니다.');
    const action = m[2];
    if (method === 'GET' && !action) return send(res, 200, commissionDetail(c, me));
    const body = await readBody(req);
    if (action === 'proposals' && !m[3]) {
      if (me.role !== 'PERFUMER') return fail(res, 403, 'FORBIDDEN', '인증된 조향사만 제안할 수 있어요.');
      if (proposals.some((p) => p.commissionId === c.id && p.perfumerId === me.id)) return fail(res, 409, 'CONFLICT', '이미 제안을 보낸 의뢰입니다.');
      proposals.push({ id: proposalSeq++, commissionId: c.id, perfumerId: me.id, price: body.price, workingDays: body.workingDays, message: body.message, status: 'PROPOSED', createdAt: now() });
      notify(c.requesterId, 'COMMISSION_PROPOSAL', `'${c.title}' 의뢰에 새 제안이 도착했어요.`, `/custom/${c.id}`);
      return send(res, 201, commissionDetail(c, me));
    }
    if (action === 'proposals' && m[3]) {
      if (c.requesterId !== me.id) return fail(res, 403, 'FORBIDDEN', '의뢰자만 할 수 있어요.');
      if (c.status !== 'OPEN') return fail(res, 400, 'BAD_REQUEST', '제안을 받는 중인 의뢰만 조향사를 선택할 수 있어요.');
      const chosen = proposals.find((p) => p.id === Number(m[3]) && p.commissionId === c.id && p.status === 'PROPOSED');
      if (!chosen) return fail(res, 404, 'NOT_FOUND', '선택할 수 있는 제안을 찾을 수 없습니다.');
      const payment = preparePayment(me, 'COMMISSION', c.id, chosen.id, `CM-${c.id}-${Math.random().toString(16).slice(2, 10)}`, `커미션 · ${c.title}`, chosen.price);
      return send(res, 200, { commission: commissionDetail(c, me), payment });
    }
    if (action === 'start') {
      if (c.perfumerId !== me.id || c.status !== 'PAID') return fail(res, 400, 'BAD_REQUEST', '결제가 끝난 의뢰만 제작을 시작할 수 있어요.');
      Object.assign(c, { status: 'IN_PROGRESS', startedAt: now() });
      notify(c.requesterId, 'COMMISSION_ACCEPTED', `'${c.title}' 제작이 시작되었어요.`, `/custom/${c.id}`);
      return send(res, 200, commissionDetail(c, me));
    }
    if (action === 'deliver') {
      if (c.perfumerId !== me.id || c.status !== 'IN_PROGRESS') return fail(res, 400, 'BAD_REQUEST', '제작 중인 의뢰만 전달할 수 있어요.');
      Object.assign(c, { status: 'DELIVERED', deliveryNote: body.note, deliveredAt: now() });
      notify(c.requesterId, 'COMMISSION_DELIVERED', `'${c.title}' 향이 완성되어 전달되었어요. 7일 안에 구매 확정 또는 후기를 남겨 주세요.`, `/custom/${c.id}`);
      return send(res, 200, commissionDetail(c, me));
    }
    if (action === 'confirm') {
      if (c.requesterId !== me.id || c.status !== 'DELIVERED') return fail(res, 400, 'BAD_REQUEST', '전달받은 의뢰만 구매 확정할 수 있어요.');
      confirmCommission(c);
      return send(res, 200, commissionDetail(c, me));
    }
    if (action === 'review') {
      if (c.requesterId !== me.id || c.reviewedAt || !['DELIVERED', 'COMPLETED'].includes(c.status)) return fail(res, 400, 'BAD_REQUEST', '향을 전달받은 뒤에 후기를 한 번 남길 수 있어요.');
      Object.assign(c, { scentRating: body.scentRating, perfumerRating: body.perfumerRating, reviewContent: body.content, reviewedAt: now() });
      if (c.status === 'DELIVERED') confirmCommission(c);
      notify(c.perfumerId, 'COMMISSION_REVIEWED', `'${c.title}' 의뢰에 후기가 남겨졌어요.`, `/custom/${c.id}`);
      return send(res, 200, commissionDetail(c, me));
    }
    if (action === 'cancel') {
      const byPerfumer = c.perfumerId === me.id && c.status === 'PAID';
      if (c.requesterId !== me.id && !byPerfumer) return fail(res, 403, 'FORBIDDEN', '의뢰인만 취소할 수 있어요.');
      if (!['OPEN', 'PAID', 'IN_PROGRESS'].includes(c.status)) return fail(res, 400, 'BAD_REQUEST', '향이 전달된 뒤에는 의뢰를 취소할 수 없어요.');
      const refund = refundFor(c);
      if (refund > 0) {
        const pay = payments.find((x) => x.targetType === 'COMMISSION' && x.targetId === c.id && x.status === 'DONE');
        if (pay) Object.assign(pay, { status: refund === pay.amount ? 'CANCELED' : 'PARTIAL_CANCELED', canceledAmount: refund });
      }
      if (c.status === 'IN_PROGRESS') settlements.push(newSettlement(c, 'PARTIAL_CANCEL', c.agreedPrice - refund));
      Object.assign(c, { status: 'CANCELLED', cancelledAt: now(), cancelReason: body.reason || (byPerfumer ? '조향사가 의뢰를 사양했어요.' : '의뢰인이 취소했어요.'), refundAmount: c.agreedPrice ? refund : null });
      proposals.filter((p) => p.commissionId === c.id && p.status === 'PROPOSED').forEach((p) => (p.status = 'DECLINED'));
      return send(res, 200, commissionDetail(c, me));
    }
  }
  // 결제
  if (method === 'POST' && path === '/api/payments/confirm') {
    const body = await readBody(req);
    const pay = payments.find((x) => x.orderKey === body.orderId);
    if (!pay) return fail(res, 404, 'NOT_FOUND', '결제 정보를 찾을 수 없습니다.');
    if (pay.status === 'DONE') return send(res, 200, paymentResult(pay));
    if (pay.status !== 'READY') return fail(res, 409, 'CONFLICT', '이미 처리되었거나 만료된 결제입니다.');
    if (pay.amount !== body.amount) {
      failPayment(pay, 'AMOUNT_MISMATCH');
      return fail(res, 400, 'BAD_REQUEST', '결제 금액이 주문 금액과 다릅니다.');
    }
    Object.assign(pay, { status: 'DONE', paymentKey: body.paymentKey, methodLabel: '모의 결제', approvedAt: now() });
    if (pay.targetType === 'ORDER') {
      const o = orders.find((x) => x.id === pay.targetId);
      Object.assign(o, { status: 'PAID', paidAt: now(), paymentApprovalNo: body.paymentKey });
      if (o.fromCart) for (let i = carts.length - 1; i >= 0; i--) if (carts[i].memberId === o.memberId && o.items.some((it) => it.productId === carts[i].productId)) carts.splice(i, 1);
      notify(o.memberId, 'ORDER_STATUS', `주문 ${o.orderNumber} 결제가 완료되었어요. 향을 정성껏 준비할게요.`, `/mypage/orders/${o.id}`);
    } else {
      const c = commissions.find((x) => x.id === pay.targetId);
      const chosen = proposals.find((p) => p.id === pay.targetRef);
      proposals.filter((p) => p.commissionId === c.id).forEach((p) => (p.status = p === chosen ? 'ACCEPTED' : 'DECLINED'));
      Object.assign(c, { status: 'PAID', perfumerId: chosen.perfumerId, agreedPrice: chosen.price, paidAt: now() });
      notify(chosen.perfumerId, 'COMMISSION_ACCEPTED', `'${c.title}' 의뢰가 선결제되었어요. 준비가 되면 '제작 시작'을 눌러 주세요.`, `/custom/${c.id}`);
    }
    return send(res, 200, paymentResult(pay));
  }
  if (method === 'POST' && path === '/api/payments/fail') {
    const body = await readBody(req);
    const pay = payments.find((x) => x.orderKey === body.orderId && x.memberId === me.id);
    if (pay) failPayment(pay, body.code);
    return send(res, 204);
  }
  // 정산
  if (method === 'GET' && path === '/api/settlements/me') return send(res, 200, settlementSummary(settlements.filter((x) => x.perfumerId === me.id)));
  // 업로드 (메모리에 보관)
  if (method === 'POST' && path === '/api/uploads') {
    const purpose = q.purpose ?? 'COMMISSION';
    if (purpose !== 'COMMISSION' && me.role !== 'ADMIN') return fail(res, 403, 'FORBIDDEN', '이 이미지는 운영자만 올릴 수 있어요.');
    const file = await readMultipartFile(req);
    if (!file) return fail(res, 400, 'BAD_REQUEST', 'JPG, PNG, WEBP 이미지만 올릴 수 있어요.');
    const id = `${uploadSeq++}.${file.ext}`;
    uploads.set(id, file);
    return send(res, 201, { url: `/api/mock-uploads/${id}`, key: id, size: file.data.length, contentType: file.type });
  }
  return false;
}

/* ───────── 3단계 mock: 결제 · 정산 · 테마 · 업로드 ───────── */
let paymentSeq = 1;
const payments = [];
function preparePayment(member, targetType, targetId, targetRef, orderKey, orderName, amount) {
  const pay = { id: paymentSeq++, memberId: member.id, targetType, targetId, targetRef, orderKey, orderName, amount, status: 'READY', createdAt: now() };
  payments.push(pay);
  return { provider: 'MOCK', clientKey: null, customerKey: `YN_mock-${member.id}`, orderKey, orderName, amount, customerName: member.name, customerEmail: member.email, targetType, targetId };
}
const paymentResult = (p) => ({ orderKey: p.orderKey, status: p.status, targetType: p.targetType, targetId: p.targetId, amount: p.amount, methodLabel: p.methodLabel ?? null, receiptUrl: null, approvedAt: p.approvedAt ?? null });
function failPayment(pay, code) {
  if (pay.status !== 'READY') return;
  Object.assign(pay, { status: 'ABORTED', failureCode: code ?? 'USER_CANCEL' });
  if (pay.targetType === 'ORDER') {
    const o = orders.find((x) => x.id === pay.targetId);
    if (o?.status === 'PENDING_PAYMENT') {
      Object.assign(o, { status: 'PAYMENT_FAILED', cancelledAt: now() });
      releaseOrder(o);
    }
  }
}

let settlementSeq = 1;
const settlements = [];
const FEE_RATE = 0.1;
function newSettlement(c, reason, gross, paid = false) {
  const fee = Math.round(gross * FEE_RATE);
  return { id: settlementSeq++, commissionId: c.id, perfumerId: c.perfumerId, reason, grossAmount: gross, feeAmount: fee, netAmount: gross - fee, status: paid ? 'PAID' : 'PENDING', createdAt: now(), paidAt: paid ? now() : null };
}
const settlementDto = (x) => ({ ...x, commissionTitle: commissions.find((c) => c.id === x.commissionId).title, perfumerName: members.find((m) => m.id === x.perfumerId).name });
const settlementSummary = (list) => ({
  pendingAmount: list.filter((x) => x.status === 'PENDING').reduce((a, x) => a + x.netAmount, 0),
  paidAmount: list.filter((x) => x.status === 'PAID').reduce((a, x) => a + x.netAmount, 0),
  feeRate: FEE_RATE,
  items: [...list].sort((a, b) => b.id - a.id).map(settlementDto),
});
function refundFor(c) {
  if (c.status === 'PAID') return c.agreedPrice;
  if (c.status === 'IN_PROGRESS') return Math.floor((c.agreedPrice * 0.5) / 10) * 10;
  return 0;
}
function confirmCommission(c) {
  Object.assign(c, { status: 'COMPLETED', confirmedAt: now() });
  const st = newSettlement(c, 'CONFIRMED', c.agreedPrice);
  settlements.push(st);
  notify(c.perfumerId, 'SYSTEM', `구매가 확정되었어요. '${c.title}' 정산 예정 금액 ${st.netAmount.toLocaleString()}원`, `/custom/${c.id}`);
}
// 예시 데이터: 후기까지 끝난 무화과 의뢰는 정산 지급 완료
commissions.filter((c) => c.status === 'COMPLETED').forEach((c) => settlements.push(newSettlement(c, 'CONFIRMED', c.agreedPrice, true)));

let themeSeq = 1;
const year = new Date().getFullYear();
const themes = read('themes.json').map((t, i) => {
  const start = t.start ? `${year}-${t.start}` : null;
  let end = t.end ? `${year}-${t.end}` : null;
  if (start && end && end < start) end = `${year + 1}-${t.end}`;
  return {
    id: themeSeq++, slug: t.slug, eyebrow: t.eyebrow, title: t.title, subtitle: t.subtitle, story: t.story, heroImageUrl: t.heroImage,
    startsOn: start, endsOn: end, sortOrder: t.sortOrder ?? i, published: true,
    items: t.products.map(([name, note]) => ({ productId: products.find((p) => p.name === name)?.id, note })).filter((x) => x.productId),
  };
});
const today = () => new Date().toISOString().slice(0, 10);
const isActive = (t) => (!t.startsOn || t.startsOn <= today()) && (!t.endsOn || t.endsOn >= today());
const themeSummary = (t) => ({
  id: t.id, slug: t.slug, eyebrow: t.eyebrow, title: t.title, subtitle: t.subtitle, heroImageUrl: t.heroImageUrl, startsOn: t.startsOn, endsOn: t.endsOn,
  active: isActive(t), published: t.published, sortOrder: t.sortOrder, productCount: t.items.length,
  previewImages: t.items.slice(0, 3).map((i) => products.find((p) => p.id === i.productId).imageUrl),
});
const publishedThemes = () => themes.filter((t) => t.published).sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || a.sortOrder - b.sortOrder).map(themeSummary);
const themeDetail = (t) => ({
  summary: themeSummary(t), story: t.story,
  items: t.items.map((i) => ({ product: summary(products.find((p) => p.id === i.productId)), note: i.note })),
  others: publishedThemes().filter((o) => o.slug !== t.slug).slice(0, 3),
});

let uploadSeq = 1;
const uploads = new Map();
async function readMultipartFile(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buf = Buffer.concat(chunks);
  const boundary = /boundary=(.+)$/.exec(req.headers['content-type'] ?? '')?.[1];
  if (!boundary) return null;
  const start = buf.indexOf('\r\n\r\n');
  const end = buf.lastIndexOf(Buffer.from(`\r\n--${boundary}`));
  if (start < 0 || end < 0) return null;
  const data = buf.subarray(start + 4, end);
  const sig = data.subarray(0, 12);
  if (sig[0] === 0xff && sig[1] === 0xd8) return { data, type: 'image/jpeg', ext: 'jpg' };
  if (sig[0] === 0x89 && sig.toString('latin1', 1, 4) === 'PNG') return { data, type: 'image/png', ext: 'png' };
  if (sig.toString('latin1', 0, 4) === 'RIFF' && sig.toString('latin1', 8, 12) === 'WEBP') return { data, type: 'image/webp', ext: 'webp' };
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const q = Object.fromEntries(url.searchParams);
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  const me = token.startsWith('mock-') ? members.find((m) => m.id === Number(token.slice(5))) : null;
  const method = req.method;
  let m;

  try {
    if (method === 'GET' && path === '/api/posts') return send(res, 200, posts);
    if (method === 'GET' && path === '/api/products/popular') return send(res, 200, [...products].filter((p) => p.active).sort((a, b) => b.popularity - a.popularity).slice(0, 4).map(summary));
    if (method === 'GET' && path === '/api/products/new') return send(res, 200, products.filter((p) => p.active && p.newArrival).slice(0, 4).map(summary));
    if (method === 'GET' && path === '/api/products') {
      let list = products.filter((p) => p.active);
      if (q.category) list = list.filter((p) => p.incCd === (CODE[q.category] ?? q.category));
      if (q.keyword) list = list.filter((p) => [p.name, p.subtitle, p.scentFamily].some((v) => v?.includes(q.keyword)));
      if (q.feeling) list = list.filter((p) => p.feeling === q.feeling);
      if (q.scene) list = list.filter((p) => p.scene === q.scene);
      if (q.minPrice) list = list.filter((p) => p.price >= Number(q.minPrice));
      if (q.maxPrice) list = list.filter((p) => p.price <= Number(q.maxPrice));
      const sorters = { priceAsc: (a, b) => a.price - b.price || a.id - b.id, priceDesc: (a, b) => b.price - a.price || a.id - b.id, newest: (a, b) => Number(b.newArrival) - Number(a.newArrival) || b.id - a.id };
      list = [...list].sort(sorters[q.sort] ?? ((a, b) => b.popularity - a.popularity || a.id - b.id));
      return send(res, 200, page(list.map(summary), Number(q.page ?? 0), Number(q.size ?? 9)));
    }
    if (method === 'GET' && (m = path.match(/^\/api\/categories\/(\w+)\/filters$/))) {
      const list = products.filter((p) => p.incCd === CODE[m[1]]);
      return send(res, 200, { feelings: [...new Set(list.map((p) => p.feeling))], scenes: [...new Set(list.map((p) => p.scene))] });
    }
    if ((m = path.match(/^\/api\/products\/(\d+)\/reviews$/))) {
      const productId = Number(m[1]);
      if (method === 'GET') return send(res, 200, page(reviews.filter((r) => r.productId === productId).map(reviewDto), 0, 10));
      if (!me) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
      const body = await readBody(req);
      const r = { id: reviewSeq++, productId, memberId: me.id, rating: body.rating, headline: null, content: body.content, featured: false, createdAt: now() };
      reviews.unshift(r);
      return send(res, 201, reviewDto(r));
    }
    if (method === 'GET' && (m = path.match(/^\/api\/products\/(\d+)$/))) {
      const p = products.find((x) => x.id === Number(m[1]) && x.active);
      if (!p) return fail(res, 404, 'NOT_FOUND', '상품을 찾을 수 없습니다.');
      const rs = reviews.filter((r) => r.productId === p.id);
      return send(res, 200, { ...summary(p), ...p, soldOut: p.stock <= 0, category: LABEL[p.incCd], categorySlug: SLUG[p.incCd], averageRating: rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0, reviewCount: rs.length });
    }
    if (method === 'GET' && path === '/api/reviews/featured') return send(res, 200, reviews.filter((r) => r.featured).map(reviewDto));
    if (method === 'DELETE' && (m = path.match(/^\/api\/reviews\/(\d+)$/))) {
      const idx = reviews.findIndex((r) => r.id === Number(m[1]));
      if (idx >= 0) reviews.splice(idx, 1);
      return send(res, 204);
    }
    if (method === 'GET' && path === '/api/preferences/questions') return send(res, 200, questions.map(({ options, ...rest }) => ({ ...rest, options: options.map(({ optionNo, label, imageUrl }) => ({ optionNo, label, imageUrl })) })));
    if (path.startsWith('/api/preferences')) {
      if (!me) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
      if (method === 'POST') {
        const body = await readBody(req);
        preferences.set(me.id, Object.fromEntries(body.answers.map((a) => [a.questionNo, a.optionNo])));
        return send(res, 200, recommend(me.id));
      }
      const r = recommend(me.id);
      return r ? send(res, 200, r) : send(res, 204);
    }
    if (method === 'POST' && path === '/api/auth/login') {
      const body = await readBody(req);
      const member = members.find((x) => x.email === body.email && x.password === body.password);
      if (!member) return fail(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
      return send(res, 200, { accessToken: `mock-${member.id}`, expiresIn: 7200, member: memberDto(member) });
    }
    if (method === 'POST' && path === '/api/auth/signup') {
      const body = await readBody(req);
      if (members.some((x) => x.email === body.email)) return fail(res, 409, 'CONFLICT', '이미 가입된 이메일입니다.');
      const member = { id: memberSeq++, email: body.email, password: body.password, name: body.name, phone: body.phone, role: 'USER', grade: 'BRONZE', marketingAgreed: body.marketingAgreed, createdAt: now(), point: 0, address: null };
      members.push(member);
      issueWelcome(member);
      if (body.perfumer) {
        applications.push({ id: appSeq++, memberId: member.id, ...body.perfumerApplication, status: 'PENDING', rejectReason: null, createdAt: now(), reviewedAt: null });
        notifications.unshift({ id: notiSeq++, recipientId: 1, type: 'PERFUMER_APPLICATION', message: `${member.name} 님이 조향사 인증을 요청했습니다.`, link: '/admin/perfumers', read: false, createdAt: now() });
      }
      return send(res, 201, { accessToken: `mock-${member.id}`, expiresIn: 7200, member: memberDto(member) });
    }
    if (method === 'GET' && path === '/api/music/youtube') {
      return send(res, 200, { query: q.q, videoId: null, embedUrl: null, searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q.q)}` });
    }

    if (method === 'GET' && path === '/api/themes') return send(res, 200, publishedThemes());
    if (method === 'GET' && (m = path.match(/^\/api\/themes\/([\w-]+)$/))) {
      const t = themes.find((x) => x.slug === m[1] && x.published);
      return t ? send(res, 200, themeDetail(t)) : fail(res, 404, 'NOT_FOUND', '테마를 찾을 수 없습니다.');
    }
    if (method === 'GET' && path === '/api/payments/config') return send(res, 200, { provider: 'MOCK', clientKey: null, customerKey: me ? `YN_mock-${me.id}` : null });
    if (method === 'GET' && (m = path.match(/^\/api\/mock-uploads\/(.+)$/))) {
      const file = uploads.get(m[1]);
      if (!file) return fail(res, 404, 'NOT_FOUND', '이미지가 없습니다.');
      res.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=3600' });
      return res.end(file.data);
    }
    if (method === 'GET' && path === '/api/commissions') {
      const list = commissions.filter((c) => !q.status || c.status === q.status).sort((a, b) => b.id - a.id);
      return send(res, 200, page(list.map(commissionSummary), Number(q.page ?? 0), Number(q.size ?? 12)));
    }
    if (!me) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    if (method === 'GET' && path === '/api/notifications/stream') return stream(req, res, me);
    const handled = await shopRoutes({ method, path, q, me, req, res });
    if (handled !== false) return handled;
    if (method === 'GET' && path === '/api/members/me') return send(res, 200, memberDto(me));
    if (method === 'GET' && path === '/api/notifications') return send(res, 200, notifications.filter((n) => n.recipientId === me.id));
    if (method === 'GET' && path === '/api/notifications/unread-count') return send(res, 200, { count: notifications.filter((n) => n.recipientId === me.id && !n.read).length });
    if (method === 'PATCH' && path === '/api/notifications/read-all') {
      notifications.filter((n) => n.recipientId === me.id).forEach((n) => (n.read = true));
      return send(res, 204);
    }
    if (method === 'PATCH' && (m = path.match(/^\/api\/notifications\/(\d+)\/read$/))) {
      const n = notifications.find((x) => x.id === Number(m[1]));
      if (n) n.read = true;
      return send(res, 204);
    }

    if (path.startsWith('/api/admin')) {
      if (me.role !== 'ADMIN') return fail(res, 403, 'FORBIDDEN', '접근 권한이 없습니다.');
      if (method === 'GET' && path === '/api/admin/products') return send(res, 200, page(products.filter((p) => p.active).map((p) => ({ ...p, ...summary(p), thumbnailUrl: p.thumbnailUrl, averageRating: 0, reviewCount: 0 })), 0, 100));
      if (method === 'PATCH' && (m = path.match(/^\/api\/admin\/products\/(\d+)\/stock$/))) {
        const body = await readBody(req);
        products.find((p) => p.id === Number(m[1])).stock = body.stock;
        return send(res, 204);
      }
      if (method === 'DELETE' && (m = path.match(/^\/api\/admin\/products\/(\d+)$/))) {
        products.find((p) => p.id === Number(m[1])).active = false;
        return send(res, 204);
      }
      if ((method === 'POST' && path === '/api/admin/products') || (method === 'PUT' && (m = path.match(/^\/api\/admin\/products\/(\d+)$/)))) {
        const body = await readBody(req);
        if (method === 'POST') {
          const p = { ...body, id: products.length + 1, active: true };
          products.push(p);
          return send(res, 201, p);
        }
        const p = products.find((x) => x.id === Number(m[1]));
        Object.assign(p, body);
        return send(res, 200, p);
      }
      if (method === 'GET' && path === '/api/admin/orders') {
        const list = orders.filter((o) => !q.status || o.status === q.status).sort((a, b) => b.id - a.id);
        return send(res, 200, page(list.map(orderSummary), 0, 50));
      }
      if (method === 'PATCH' && (m = path.match(/^\/api\/admin\/orders\/(\d+)\/status$/))) {
        const o = orders.find((x) => x.id === Number(m[1]));
        const body = await readBody(req);
        if (body.status === 'CANCELLED') {
          if (!['PAID', 'PREPARING'].includes(o.status)) return fail(res, 400, 'BAD_REQUEST', '배송이 시작된 주문은 취소할 수 없습니다.');
          cancelOrder(o);
        } else {
          if (NEXT_STATUS[o.status] !== body.status) return fail(res, 400, 'BAD_REQUEST', '단계를 건너뛸 수 없습니다.');
          o.status = body.status;
          if (o.status === 'DELIVERED') {
            o.earnedPoint = Math.floor((o.itemsAmount - o.couponDiscount) / 100);
            members.find((x) => x.id === o.memberId).point += o.earnedPoint;
          }
        }
        notify(o.memberId, 'ORDER_STATUS', `주문 ${o.orderNumber} 상태가 '${STATUS_LABEL[o.status]}'(으)로 바뀌었어요.`, `/mypage/orders/${o.id}`);
        return send(res, 200, orderDetail(o));
      }
      if (method === 'GET' && path === '/api/admin/themes') return send(res, 200, [...themes].sort((a, b) => a.sortOrder - b.sortOrder).map(themeSummary));
      if (method === 'GET' && (m = path.match(/^\/api\/admin\/themes\/([\w-]+)$/))) {
        const t = themes.find((x) => x.slug === m[1]);
        return t ? send(res, 200, themeDetail(t)) : fail(res, 404, 'NOT_FOUND', '테마를 찾을 수 없습니다.');
      }
      if ((method === 'POST' && path === '/api/admin/themes') || (method === 'PUT' && (m = path.match(/^\/api\/admin\/themes\/(\d+)$/)))) {
        const body = await readBody(req);
        const dup = themes.find((x) => x.slug === body.slug && (method === 'POST' || x.id !== Number(m[1])));
        if (dup) return fail(res, 409, 'CONFLICT', '이미 쓰고 있는 테마 주소입니다.');
        const data = { ...body, items: [...new Map((body.items ?? []).map((i) => [i.productId, i])).values()] };
        if (method === 'POST') {
          const t = { id: themeSeq++, ...data };
          themes.push(t);
          return send(res, 201, themeDetail(t));
        }
        const t = themes.find((x) => x.id === Number(m[1]));
        Object.assign(t, data);
        return send(res, 200, themeDetail(t));
      }
      if (method === 'DELETE' && (m = path.match(/^\/api\/admin\/themes\/(\d+)$/))) {
        themes.splice(themes.findIndex((x) => x.id === Number(m[1])), 1);
        return send(res, 204);
      }
      if (method === 'GET' && path === '/api/admin/settlements') return send(res, 200, settlementSummary(settlements.filter((x) => !q.status || x.status === q.status)));
      if (method === 'POST' && (m = path.match(/^\/api\/admin\/settlements\/(\d+)\/pay$/))) {
        const st = settlements.find((x) => x.id === Number(m[1]));
        if (st.status === 'PAID') return fail(res, 409, 'CONFLICT', '이미 지급 완료된 정산입니다.');
        Object.assign(st, { status: 'PAID', paidAt: now() });
        notify(st.perfumerId, 'SYSTEM', `정산금 ${st.netAmount.toLocaleString()}원이 지급되었어요.`, '/mypage/settlements');
        return send(res, 200, settlementDto(st));
      }
      if (method === 'GET' && path === '/api/admin/members') {
        const list = members.filter((x) => !q.keyword || x.email.includes(q.keyword) || x.name.includes(q.keyword));
        return send(res, 200, page(list.map((x) => ({ ...memberDto(x), marketingAgreed: x.marketingAgreed, createdAt: x.createdAt })), 0, 50));
      }
      if (method === 'PATCH' && (m = path.match(/^\/api\/admin\/members\/(\d+)$/))) {
        const body = await readBody(req);
        const target = members.find((x) => x.id === Number(m[1]));
        Object.assign(target, Object.fromEntries(Object.entries(body).filter(([, v]) => v)));
        return send(res, 200, { ...memberDto(target), marketingAgreed: target.marketingAgreed, createdAt: target.createdAt });
      }
      const appDto = (a) => {
        const mem = members.find((x) => x.id === a.memberId);
        return { ...a, memberName: mem.name, memberEmail: mem.email };
      };
      if (method === 'GET' && path === '/api/admin/perfumer-applications') return send(res, 200, applications.filter((a) => !q.status || a.status === q.status).map(appDto));
      if (method === 'POST' && (m = path.match(/^\/api\/admin\/perfumer-applications\/(\d+)\/(approve|reject)$/))) {
        const app = applications.find((a) => a.id === Number(m[1]));
        const body = m[2] === 'reject' ? await readBody(req) : {};
        app.status = m[2] === 'approve' ? 'APPROVED' : 'REJECTED';
        app.rejectReason = body.reason ?? null;
        app.reviewedAt = now();
        if (app.status === 'APPROVED') members.find((x) => x.id === app.memberId).role = 'PERFUMER';
        return send(res, 200, appDto(app));
      }
    }
    return fail(res, 404, 'NOT_FOUND', `${method} ${path}`);
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'INTERNAL_ERROR', String(e));
  }
});

const port = Number(process.env.MOCK_PORT ?? 8080);
server.listen(port, () => console.log(`[mock-api] http://localhost:${port}  (seed: ${seedDir})`));
