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
].map((m) => ({ marketingAgreed: true, createdAt: now(), ...m }));
const GRADE_LABEL = { BRONZE: '브론즈', SILVER: '실버', GOLD: '골드', PLATINUM: '플래티넘', DIAMOND: '다이아' };

let appSeq = 2;
const applications = [
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
      const member = { id: memberSeq++, email: body.email, password: body.password, name: body.name, phone: body.phone, role: 'USER', grade: 'BRONZE', marketingAgreed: body.marketingAgreed, createdAt: now() };
      members.push(member);
      if (body.perfumer) {
        applications.push({ id: appSeq++, memberId: member.id, ...body.perfumerApplication, status: 'PENDING', rejectReason: null, createdAt: now(), reviewedAt: null });
        notifications.unshift({ id: notiSeq++, recipientId: 1, type: 'PERFUMER_APPLICATION', message: `${member.name} 님이 조향사 인증을 요청했습니다.`, link: '/admin/perfumers', read: false, createdAt: now() });
      }
      return send(res, 201, { accessToken: `mock-${member.id}`, expiresIn: 7200, member: memberDto(member) });
    }
    if (method === 'GET' && path === '/api/music/youtube') {
      return send(res, 200, { query: q.q, videoId: null, embedUrl: null, searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q.q)}` });
    }

    if (!me) return fail(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
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
