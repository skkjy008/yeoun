import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { postApi, preferenceApi, productApi, reviewApi } from '../../api/endpoints';
import type { Post, ProductSummary, Recommendation, Review } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import ProductCard from '../../components/ProductCard';
import SectionHeading from '../../components/SectionHeading';
import { Footer } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { CATEGORY_META, CATEGORY_ORDER, lines } from '../../lib/format';
import HeroCarousel from './HeroCarousel';
import styles from './HomePage.module.css';

const MOODS = [
  {
    image: '/images/mood/woodland.jpg',
    label: '01 / CALM & EARTHY',
    title: '고요한 숲의 여운',
    notes: '비 내린 숲 · 밤에 켜둔 나무 향 · 비 내린 아침 풀',
    to: '/search?keyword=숲',
  },
  {
    image: '/images/mood/afternoon.jpg',
    label: '02 / WARM & SOFT',
    title: '느린 오후의 여운',
    notes: '오후의 차와 무화과 · 따뜻한 피부 향 · 저녁 캔들의 달콤함',
    to: '/search?keyword=오후',
  },
];

export default function HomePage() {
  const { member } = useAuth();
  const toast = useToast();
  const [banners, setBanners] = useState<Post[]>([]);
  const [popular, setPopular] = useState<ProductSummary[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [forYou, setForYou] = useState<Recommendation | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    postApi.banners().then(setBanners).catch(() => setBanners([]));
    productApi.popular().then(setPopular).catch(() => setPopular([]));
    productApi.newArrivals().then(setNewArrivals).catch(() => setNewArrivals([]));
    reviewApi.featured().then(setReviews).catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    if (!member) {
      setForYou(null);
      return;
    }
    preferenceApi
      .mine(false)
      .then((r) => setForYou(r ?? null))
      .catch(() => setForYou(null));
  }, [member]);

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast('이메일 주소를 확인해 주세요.');
      return;
    }
    setEmail('');
    toast('향의 편지를 신청했어요. (데모 화면)');
  };

  const picks = forYou?.products ?? popular;

  return (
    <>
      <HeroCarousel slides={banners} />

      {/* 취향 기반 추천: 나만의 향 찾기 결과가 있으면 메인 상단에 노출 */}
      {forYou && member && (
        <section className={`page px ${styles.forYou}`}>
          <SectionHeading
            eyebrow="FOR YOU — BASED ON YOUR SCENT"
            title={`${member.name} 님의 취향을 따라 추천하는 여운`}
            description={forYou.headline}
            linkLabel="다시 찾아보기"
            linkTo="/scent-finder"
          />
          <div className={styles.grid4}>
            {forYou.products.map((p) => (
              <ProductCard key={p.id} product={p} variant="home" badge="FOR YOU" />
            ))}
          </div>
        </section>
      )}

      <section className={`page px ${styles.categories}`}>
        <SectionHeading
          eyebrow="DISCOVER YOUR SCENT"
          title="당신의 취향에 맞는 향을 찾아보세요"
          linkLabel="취향별 둘러보기"
          linkTo="/search"
        />
        <div className={styles.grid4}>
          {CATEGORY_ORDER.map((slug) => {
            const meta = CATEGORY_META[slug];
            return (
              <Link key={slug} to={`/shop/${slug}`} className={styles.category}>
                <div className={styles.categoryImage}>
                  <img src={meta.image} alt={meta.label} loading="lazy" />
                </div>
                <div className={styles.categoryTitle}>
                  <span className="serif">{meta.label}</span>
                  <ArrowUpRight size={20} strokeWidth={1.3} />
                </div>
                <p className={styles.categoryTag}>{meta.tagline}</p>
                <p className={styles.categoryCopy}>{meta.cardCopy}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {!forYou && (
        <section className={`page px ${styles.products} ${styles.popular}`}>
          <SectionHeading
            eyebrow="POPULAR PICKS"
            title="취향을 따라 추천하는 여운"
            description="많은 사람이 좋아하는 향을 먼저 만나고, 나만의 취향을 찾아보세요."
            linkLabel="인기 상품 더 보기"
            linkTo="/search?sort=popular"
          />
          <div className={styles.grid4}>
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} variant="home" badge="PICK" />
            ))}
          </div>
        </section>
      )}

      <section className={styles.mood}>
        <div className={`page px ${styles.moodInner}`}>
          <SectionHeading eyebrow="SCENT & MOOD" title="기분에 맞는 향을 찾아보세요" linkLabel="기분별 둘러보기" linkTo="/theme" />
          <div className={styles.moodGrid}>
            {MOODS.map((mood) => (
              <Link key={mood.title} to={mood.to} className={styles.theme}>
                <div className={styles.themeImage}>
                  <img src={mood.image} alt="" loading="lazy" />
                </div>
                <div className={styles.themeInfo}>
                  <div>
                    <p className={styles.themeLabel}>{mood.label}</p>
                    <p className={styles.themeTitle}>{mood.title}</p>
                    <p className={styles.themeNotes}>{mood.notes}</p>
                  </div>
                  <span className={styles.themeArrow}>↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`page px ${styles.products} ${styles.newArrivals}`}>
        <SectionHeading
          eyebrow="NEW ARRIVALS"
          title="새로운 향을 만나는 순간"
          description="새로운 노트와 장면을 따라 새로운 향을 만나보세요."
          linkLabel="신제품 더 보기"
          linkTo="/search?sort=newest"
        />
        <div className={styles.grid4}>
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} variant="home" badge="NEW" />
          ))}
        </div>
      </section>

      {forYou && popular.length > 0 && (
        <section className={`page px ${styles.products}`}>
          <SectionHeading
            eyebrow="POPULAR PICKS"
            title="많은 사람이 오래 머문 향"
            description="많은 사람이 좋아하는 향도 함께 만나보세요."
            linkLabel="인기 상품 더 보기"
            linkTo="/search?sort=popular"
          />
          <div className={styles.grid4}>
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} variant="home" badge="PICK" />
            ))}
          </div>
        </section>
      )}

      <section className={styles.bespoke}>
        <div className={`page ${styles.bespokeInner}`}>
          <div className={styles.bespokeImage}>
            <img src="/images/common/atelier.jpg" alt="조향사의 작업대" loading="lazy" />
          </div>
          <div className={styles.bespokeCopy}>
            <p className={styles.bespokeEyebrow}>YOUR SCENT, YOUR STORY</p>
            <h2>
              당신의 취향을 담아,
              <br />
              나만의 향을 완성하세요.
            </h2>
            <p>
              좋아하는 노트를 선택하고, 취향에 맞게 조합해 보세요.
              <br />
              나만의 향을 만드는 작은 여정.
            </p>
            <Link to="/custom" className="btn btn-outline-light">
              나만의 향 만들기　↗
            </Link>
          </div>
        </div>
      </section>

      <section className={`page px ${styles.stories}`}>
        <SectionHeading eyebrow="CUSTOMER STORIES" title="나만의 향을 발견한 이야기" linkLabel="스토리 더 보기" linkTo="/search" />
        <div className={styles.reviewGrid}>
          {reviews.map((r) => (
            <Link key={r.id} to={`/products/${r.productId}`} className={styles.review}>
              <p className={styles.stars} aria-label={`별점 ${r.rating}점`}>
                {'★'.repeat(r.rating)}
                {'☆'.repeat(5 - r.rating)}
              </p>
              <p className={styles.reviewHeadline}>
                {lines(r.headline).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
              <p className={styles.reviewBody}>{r.content}</p>
              <p className={styles.reviewAuthor}>
                {r.productName}　/　{r.authorName} 님
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.letter}>
        <div className={`page px ${styles.letterInner}`}>
          <div className={styles.invitation}>
            <h2 className="serif">당신의 취향에 맞는 향을 먼저 만나보세요.</h2>
            <p>새로운 향과 취향별 추천을 이메일로 받아보세요.</p>
          </div>
          <form className={styles.signup} onSubmit={subscribe}>
            <label className={styles.emailField}>
              <span className="sr-only">이메일 주소</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력해 주세요"
              />
              <button type="submit">구독하기　↗</button>
            </label>
            <p className={styles.consent}>구독 신청 시 개인정보 수집 및 이용에 동의합니다.</p>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
