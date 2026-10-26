import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { themeApi } from '../../api/endpoints';
import type { ThemeDetail, ThemeSummary } from '../../api/types';
import ProductCard from '../../components/ProductCard';
import { CompactFooter } from '../../components/layout/Footer';
import { formatDate } from '../../lib/format';
import NotFoundPage from '../NotFoundPage';
import OrderIntro from '../order/OrderIntro';
import styles from './Theme.module.css';

function periodLabel(t: ThemeSummary) {
  if (!t.startsOn && !t.endsOn) return '언제나';
  if (t.active) return t.endsOn ? `지금 · ${formatDate(t.endsOn).slice(5)}까지` : '지금 진행 중';
  if (t.startsOn && new Date(t.startsOn) > new Date()) return `${formatDate(t.startsOn).slice(5)}부터`;
  return '지난 테마';
}

function Period({ theme }: { theme: ThemeSummary }) {
  return <span className={`${styles.period} ${theme.active ? styles.periodActive : ''}`}>{periodLabel(theme)}</span>;
}

export function ThemeCard({ theme }: { theme: ThemeSummary }) {
  return (
    <Link to={`/theme/${theme.slug}`} className={styles.card}>
      <div className={styles.cardImage}>
        <img src={theme.heroImageUrl} alt="" loading="lazy" />
        <Period theme={theme} />
      </div>
      {theme.eyebrow && <p className="eyebrow">{theme.eyebrow}</p>}
      <h3 className={styles.cardTitle}>{theme.title}</h3>
      {theme.subtitle && <p className={styles.cardSub}>{theme.subtitle}</p>}
      {theme.previewImages.length > 0 && (
        <div className={styles.previews} aria-label={`향 ${theme.productCount}가지`}>
          {theme.previewImages.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" />
          ))}
        </div>
      )}
    </Link>
  );
}

export function ThemeListPage() {
  const [themes, setThemes] = useState<ThemeSummary[] | null>(null);

  useEffect(() => {
    themeApi.list().then(setThemes).catch(() => setThemes([]));
  }, []);

  const feature = themes?.find((t) => t.active && (t.startsOn || t.endsOn)) ?? themes?.[0];
  const rest = themes?.filter((t) => t.id !== feature?.id) ?? [];

  return (
    <>
      <OrderIntro crumbs={[{ label: '테마' }]} eyebrow="THEME CURATION" title="계절과 기념일, 장면으로 고른 향" />
      <div className="page px">
        {!themes && <div className="skeleton" style={{ height: 460, marginBottom: 64 }} />}
        {feature && (
          <Link to={`/theme/${feature.slug}`} className={styles.feature}>
            <img className={styles.featureImage} src={feature.heroImageUrl} alt="" />
            <div className={styles.featureCopy}>
              <Period theme={feature} />
              {feature.eyebrow && <p className="eyebrow">{feature.eyebrow}</p>}
              <h2 className={styles.featureTitle}>{feature.title}</h2>
              {feature.subtitle && <p>{feature.subtitle}</p>}
              <span className="btn btn-outline-light" style={{ alignSelf: 'flex-start' }}>
                향 {feature.productCount}가지 만나기 <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        )}
        {rest.length > 0 && (
          <>
            <div className={styles.listHead}>
              <h2>다른 장면들</h2>
              <span>테마 {themes?.length ?? 0}개</span>
            </div>
            <div className={styles.grid}>
              {rest.map((t) => (
                <ThemeCard key={t.id} theme={t} />
              ))}
            </div>
          </>
        )}
        {themes && themes.length === 0 && <p className="help" style={{ paddingBottom: 80 }}>준비 중인 테마가 있어요. 곧 만나요.</p>}
      </div>
      <CompactFooter />
    </>
  );
}

export function ThemeDetailPage() {
  const { slug } = useParams();
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setTheme(null);
    themeApi
      .detail(slug ?? '')
      .then(setTheme)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <NotFoundPage />;
  if (!theme) return <div className="skeleton" style={{ height: 560 }} />;
  const { summary } = theme;

  return (
    <>
      <section className={styles.hero}>
        <img src={summary.heroImageUrl} alt="" />
        <nav className={`page px ${styles.breadcrumb}`} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span>/</span>
          <Link to="/theme">테마</Link>
          <span>/</span>
          <span>{summary.title}</span>
        </nav>
        <div className={`page px ${styles.heroCopy}`}>
          <Period theme={summary} />
          {summary.eyebrow && <p className="eyebrow">{summary.eyebrow}</p>}
          <h1 className={styles.heroTitle}>{summary.title}</h1>
          {summary.subtitle && <p>{summary.subtitle}</p>}
        </div>
      </section>

      <div className="page px">
        {theme.story && (
          <section className={styles.story}>
            <h2>이 장면을 위해 고른 {theme.items.length}가지 향</h2>
            <p className={styles.storyText}>{theme.story}</p>
          </section>
        )}
        <div className={styles.items}>
          {theme.items.map(({ product, note }) => (
            <div key={product.id} className={styles.item}>
              <ProductCard product={product} />
              {note && <p className={styles.note}>{note}</p>}
            </div>
          ))}
        </div>
        {theme.others.length > 0 && (
          <section className={styles.others}>
            <div className={styles.listHead}>
              <h2>다른 장면도 둘러보세요</h2>
              <Link to="/theme" className="help">
                전체 테마 ↗
              </Link>
            </div>
            <div className={styles.grid}>
              {theme.others.map((t) => (
                <ThemeCard key={t.id} theme={t} />
              ))}
            </div>
          </section>
        )}
      </div>
      <CompactFooter />
    </>
  );
}
