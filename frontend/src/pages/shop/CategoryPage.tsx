import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productApi } from '../../api/endpoints';
import type { FilterOptions, PageResponse, ProductSummary } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import Dropdown from '../../components/Dropdown';
import ProductCard from '../../components/ProductCard';
import { Footer } from '../../components/layout/Footer';
import { CATEGORY_META } from '../../lib/format';
import NotFoundPage from '../NotFoundPage';
import styles from './CategoryPage.module.css';

const PAGE_SIZE = 9;

const PRICE_OPTIONS = [
  { value: '', label: '전체' },
  { value: '0-30000', label: '3만원 이하' },
  { value: '30000-50000', label: '3만~5만원' },
  { value: '50000-', label: '5만원 이상' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: '여운 추천순' },
  { value: 'newest', label: '신상품순' },
  { value: 'priceAsc', label: '낮은 가격순' },
  { value: 'priceDesc', label: '높은 가격순' },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { requireMember } = useAuth();
  const meta = slug ? CATEGORY_META[slug] : undefined;
  const isSearch = !slug;

  const keyword = params.get('keyword') ?? '';
  const feeling = params.get('feeling') ?? '';
  const scene = params.get('scene') ?? '';
  const price = params.get('price') ?? '';
  const sort = params.get('sort') ?? 'popular';
  const page = Number(params.get('page') ?? '0');

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [result, setResult] = useState<PageResponse<ProductSummary> | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ feelings: [], scenes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => setKeywordInput(keyword), [keyword]);

  useEffect(() => {
    if (!slug || !meta) return;
    productApi.filters(slug).then(setFilters).catch(() => setFilters({ feelings: [], scenes: [] }));
  }, [slug, meta]);

  useEffect(() => {
    if (slug && !meta) return;
    const [min, max] = price.split('-');
    setLoading(true);
    productApi
      .search({
        category: slug,
        keyword: keyword || undefined,
        feeling: feeling || undefined,
        scene: scene || undefined,
        minPrice: min ? Number(min) : undefined,
        maxPrice: max ? Number(max) : undefined,
        sort,
        page,
        size: PAGE_SIZE,
      })
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [slug, meta, keyword, feeling, scene, price, sort, page]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update('keyword', keywordInput.trim());
  };

  const filterSummary = useMemo(() => {
    const active = [keyword && `'${keyword}'`, feeling, scene, PRICE_OPTIONS.find((o) => o.value === price && o.value)?.label]
      .filter(Boolean)
      .join(' · ');
    return active ? `${active} 향을 보고 있어요` : '모든 향을 보고 있어요';
  }, [keyword, feeling, scene, price]);

  if (slug && !meta) return <NotFoundPage />;

  const totalPages = result?.totalPages ?? 0;
  const pageNumbers = Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i);

  return (
    <>
      <section className={`page px ${styles.intro}`}>
        <nav className={styles.breadcrumb} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span>/</span>
          <span className={styles.current}>{meta ? meta.label : '전체 향'}</span>
        </nav>
        {meta ? (
          <div className={styles.editorial}>
            <div className={styles.story}>
              <p className="eyebrow">{meta.english}</p>
              <div className={styles.headline}>
                <h1 className="serif">{meta.title}</h1>
                <p>{meta.description}</p>
              </div>
              <p className={styles.line}>{meta.line}</p>
            </div>
            <div className={styles.photo}>
              <img src={meta.image} alt="" />
            </div>
          </div>
        ) : (
          <div className={styles.searchHeader}>
            <p className="eyebrow">ALL SCENTS — SEARCH</p>
            <h1 className="serif">떠오르는 장면으로 향을 찾아보세요</h1>
          </div>
        )}
      </section>

      <section className={`page px ${styles.collection}`}>
        <div className={styles.toolbarTop}>
          <p className={styles.question}>어떤 향을 찾고 계신가요?</p>
          <form className={styles.search} onSubmit={onSearch} role="search">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="상품명이나 떠오르는 장면을 검색하세요"
              aria-label="향 검색"
            />
            <button type="submit" aria-label="검색">
              <Search size={18} strokeWidth={1.4} />
            </button>
          </form>
        </div>

        <div className={styles.filters}>
          <SlidersHorizontal size={18} strokeWidth={1.4} />
          <span className={styles.filterLabel}>필터</span>
          {!isSearch && (
            <>
              <Dropdown
                label="향의 느낌"
                value={feeling}
                options={[{ value: '', label: '전체' }, ...filters.feelings.map((f) => ({ value: f, label: f }))]}
                onChange={(v) => update('feeling', v)}
              />
              <Dropdown
                label={meta?.sceneLabel ?? '장면'}
                value={scene}
                options={[{ value: '', label: '전체' }, ...filters.scenes.map((s) => ({ value: s, label: s }))]}
                onChange={(v) => update('scene', v)}
              />
            </>
          )}
          <Dropdown label="가격" value={price} options={PRICE_OPTIONS} onChange={(v) => update('price', v)} />
          <span className={styles.filterSummary}>{filterSummary}</span>
        </div>

        <div className={styles.results}>
          <p className={styles.count}>
            <span className="serif">{meta ? meta.label : '전체 향'}</span>
            <span>전체 {result?.totalElements ?? 0}개</span>
          </p>
          <Dropdown bare value={sort} options={SORT_OPTIONS} onChange={(v) => update('sort', v)} />
        </div>

        {loading && !result ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`${styles.placeholder} skeleton`} />
            ))}
          </div>
        ) : result && result.content.length > 0 ? (
          <div className={`${styles.grid} ${loading ? styles.dim : ''}`}>
            {result.content.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className="serif">찾는 향이 아직 없어요.</p>
            <p>다른 장면이나 단어로 다시 찾아보거나, 나만의 향 찾기로 취향을 알아보세요.</p>
          </div>
        )}

        {result && (
          <div className={styles.end}>
            <div className={styles.pagination}>
              <button disabled={page <= 0} onClick={() => update('page', String(page - 1))}>
                이전
              </button>
              {pageNumbers.map((n) => (
                <button key={n} className={n === page ? styles.currentPage : ''} onClick={() => update('page', String(n))}>
                  {n + 1}
                </button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => update('page', String(page + 1))}>
                다음
              </button>
            </div>
            {page >= totalPages - 1 && result.totalElements > 0 && (
              <p className={styles.endText}>{result.totalElements}개의 향을 모두 만나보셨어요.</p>
            )}
          </div>
        )}
      </section>

      <section className={styles.invite}>
        <div className={`page px ${styles.inviteInner}`}>
          <div>
            <p className={styles.inviteEyebrow}>YOUR SCENT, YOUR STORY</p>
            <p className={`serif ${styles.inviteTitle}`}>아직 어떤 향이 좋을지 모르겠다면</p>
            <p className={styles.inviteBody}>좋아하는 장면과 기분을 따라, 당신에게 어울리는 여운을 발견해 보세요.</p>
          </div>
          <button
            className={`btn btn-outline-light ${styles.inviteButton}`}
            onClick={() => {
              if (requireMember('나만의 향 찾기는 회원만 이용할 수 있어요.')) navigate('/scent-finder');
            }}
          >
            <span>나만의 향 찾기</span>
            <span className={styles.inviteArrow}>↗</span>
          </button>
        </div>
      </section>

      <Footer />
    </>
  );
}
