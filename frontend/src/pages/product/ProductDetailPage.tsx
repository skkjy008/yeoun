import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../../api/endpoints';
import type { ProductDetail } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { formatPrice, lines } from '../../lib/format';
import { useShop } from '../../shop/ShopContext';
import NotFoundPage from '../NotFoundPage';
import Comments from './Comments';
import Playlist from './Playlist';
import styles from './ProductDetailPage.module.css';

const SECTIONS = [
  { id: 'scene', label: '01  향의 장면' },
  { id: 'ritual', label: '02  제품과 사용법' },
  { id: 'words', label: '03  글과 음악' },
  { id: 'purchase', label: '구매하기' },
  { id: 'comments', label: '의견 남기기' },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { requireMember } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [busy, setBusy] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setProduct(null);
    setError(false);
    setQuantity(1);
    if (!Number.isFinite(productId)) {
      setError(true);
      return;
    }
    productApi.detail(productId).then(setProduct).catch(() => setError(true));
  }, [productId]);

  if (error) return <NotFoundPage />;
  if (!product) {
    return (
      <div className={`page px ${styles.loading}`}>
        <div className={`${styles.loadingPhoto} skeleton`} />
        <div className={styles.loadingCopy}>
          <div className="skeleton" style={{ height: 24, width: '40%' }} />
          <div className="skeleton" style={{ height: 56, width: '70%' }} />
          <div className="skeleton" style={{ height: 80 }} />
        </div>
      </div>
    );
  }

  const maxQuantity = Math.max(1, Math.min(product.stock, 10));
  const purchase = async (kind: 'cart' | 'buy') => {
    if (!requireMember('상품 구매는 회원만 이용할 수 있어요.')) return;
    if (kind === 'buy') {
      navigate('/checkout', { state: { lines: [{ productId: product.id, quantity }], fromCart: false } });
      return;
    }
    setBusy(true);
    const ok = await addToCart(product.id, quantity);
    setBusy(false);
    if (ok) toast(`${product.name} ${quantity}개를 장바구니에 담았어요.`);
  };

  return (
    <>
      <section className={`page px ${styles.intro}`}>
        <nav className={styles.breadcrumb} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to={`/shop/${product.categorySlug}`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <div className={styles.identity}>
          <div className={styles.photo}>
            <img src={product.imageUrl} alt={`${product.name} ${product.typeLabel}`} />
            {product.soldOut && <span className={styles.soldOutBadge}>SOLD OUT</span>}
          </div>
          <div className={styles.introCopy}>
            {product.englishLine && <p className="eyebrow">{product.englishLine}</p>}
            <div className={styles.nameBlock}>
              <h1 className="serif">{product.name}</h1>
              <p>{product.subtitle}</p>
            </div>
            <p className={styles.summary}>
              {product.scentFamily && <span>{product.scentFamily}의 결을 담아, 일상의 한 장면을 향으로 남깁니다.</span>}
              <span>
                {product.typeLabel} · {product.volume}
              </span>
            </p>
            <div className={styles.priceRow}>
              {product.saleRate > 0 ? (
                <div>
                  <p className={styles.listPrice}>
                    <s>{formatPrice(product.price)}</s> <span>테마 특가 {product.saleRate}%</span>
                  </p>
                  <p className={styles.price}>{formatPrice(product.salePrice)}</p>
                </div>
              ) : (
                <p className={styles.price}>{formatPrice(product.price)}</p>
              )}
              {product.soldOut ? (
                <p className={styles.soldOutText}>일시 품절 · 재입고 예정</p>
              ) : (
                <p className={styles.priceHint}>단품 · 수량 1개 기준</p>
              )}
            </div>
            {product.reviewCount > 0 && (
              <a href="#comments" className={styles.rating}>
                ★ {product.averageRating.toFixed(1)} · 의견 {product.reviewCount}개
              </a>
            )}
            <p className={styles.hint}>향의 장면부터 사용법, 음악과 짧은 글까지 천천히 만나보세요. ↓</p>
          </div>
        </div>
      </section>

      <nav className={styles.detailNav} aria-label="상세 페이지 섹션">
        <div className="page px">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="scene" className={`page px ${styles.landscape}`}>
        <div className={styles.artworkRow}>
          <figure className={styles.artwork}>
            <img src={product.artworkUrl ?? product.imageUrl} alt="향을 시각화한 아트워크" loading="lazy" />
            <figcaption>
              <span className="latin">{product.artworkCaption ?? `SCENT STUDY — ${product.englishLine?.split(' — ')[0] ?? product.name}`}</span>
              <span>향을 시각화한 아트워크</span>
            </figcaption>
          </figure>
          <div className={styles.story}>
            <div className={styles.storyHeading}>
              <p className="eyebrow">01 / THE SCENT LANDSCAPE</p>
              <h2 className="serif">
                {lines(product.storyTitle).map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </h2>
            </div>
            <p className={styles.storyBody}>{product.storyBody}</p>
            <div className={styles.character}>
              <p>
                <span>향의 계열</span>
                {product.scentFamily}
              </p>
              <p>
                <span>어울리는 곳</span>
                {product.bestPlace}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.notes}>
          {product.notes.map((n) => (
            <div key={n.name} className={styles.note}>
              <p className="serif">{n.name}</p>
              <p>{n.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ritual" className={styles.ritualSection}>
        <div className={`page px ${styles.ritual}`}>
          <div className={styles.specs}>
            <div className={styles.storyHeading}>
              <p className="eyebrow">02 / OBJECT &amp; RITUAL</p>
              <h2 className="serif">향을 곁에 두는 방법</h2>
            </div>
            <dl className={styles.table}>
              <div>
                <dt>제품명</dt>
                <dd>{product.name}</dd>
              </div>
              <div>
                <dt>제품 유형 / 용량</dt>
                <dd>
                  {product.typeLabel} / {product.volume}
                </dd>
              </div>
              <div>
                <dt>구성</dt>
                <dd>{product.composition}</dd>
              </div>
              <div>
                <dt>판매가</dt>
                <dd>
                  {formatPrice(product.salePrice)}
                  {product.saleRate > 0 && ` (정가 ${formatPrice(product.price)}, 테마 특가 ${product.saleRate}%)`}
                </dd>
              </div>
            </dl>
            <p className="help">구성 표기는 디자인 예시입니다. 실제 구매 전 제품 표시사항과 동봉된 안내를 확인해 주세요.</p>
          </div>
          <div className={styles.guide}>
            <p className={styles.guideTitle}>일상 속 작은 사용 가이드</p>
            {product.ritualSteps.map((step, i) => (
              <div key={step} className={styles.step}>
                <span className="latin">{String(i + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </div>
            ))}
            {product.safetyNotice && (
              <div className={styles.safety}>
                <p>사용 전 꼭 읽어주세요</p>
                <p>{product.safetyNotice}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="words" className={`page px ${styles.words}`}>
        <div className={styles.storyHeading}>
          <p className="eyebrow">03 / WORDS &amp; SOUNDS</p>
          <h2 className="serif">향이 머무는 동안, 함께할 이야기</h2>
        </div>
        <div className={styles.curation}>
          <div className={styles.poem}>
            <p className="latin">A SHORT STORY IN THREE LINES</p>
            <p className={`serif ${styles.poemLines}`}>
              {product.poemLines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </p>
            <p>여운이 쓴 세 줄 · {product.name}</p>
          </div>
          <Playlist title={product.playlistTitle ?? '여운의 플레이리스트'} tracks={product.tracks} />
        </div>
      </section>

      <section id="purchase" className={styles.purchase}>
        <div className={`page px ${styles.purchaseInner}`}>
          <div className={styles.summaryRow}>
            <div>
              <p className={`serif ${styles.purchaseName}`}>{product.name}</p>
              <p className={styles.purchaseMeta}>
                {product.typeLabel} · {product.volume} / 단가 {formatPrice(product.salePrice)}
              </p>
            </div>
            <div className={styles.totalRow}>
              <div className={styles.quantity} aria-label="수량 선택">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={product.soldOut || quantity <= 1} aria-label="수량 줄이기">
                  −
                </button>
                <span aria-live="polite">{product.soldOut ? 0 : quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={product.soldOut || quantity >= maxQuantity}
                  aria-label="수량 늘리기"
                >
                  ＋
                </button>
              </div>
              <p className={styles.total}>{formatPrice(product.soldOut ? 0 : product.salePrice * quantity)}</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button className="btn btn-ghost" disabled={product.soldOut || busy} onClick={() => void purchase('cart')}>
              장바구니 담기
            </button>
            <button className="btn btn-primary" disabled={product.soldOut} onClick={() => void purchase('buy')}>
              {product.soldOut ? 'SOLD OUT' : '구매하기'}
            </button>
          </div>
        </div>
      </section>

      <Comments productId={product.id} />
      <CompactFooter />
    </>
  );
}
