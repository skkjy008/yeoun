import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { adminApi } from '../../api/endpoints';
import type { ProductDetail, SettlementSummary, ThemeRequest, ThemeSummary } from '../../api/types';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/Toast';
import { formatDate, formatPrice } from '../../lib/format';
import styles from './AdminPage.module.css';

const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : '요청을 처리하지 못했어요.');

const EMPTY: ThemeRequest = {
  slug: '',
  eyebrow: '',
  title: '',
  subtitle: '',
  story: '',
  heroImageUrl: '',
  startsOn: null,
  endsOn: null,
  sortOrder: 10,
  published: true,
  items: [],
};

/** 테마 큐레이션 관리: 목록 → 편집(대표 이미지 업로드, 기간, 상품 묶기와 한 줄 소개) */
export function AdminThemes() {
  const toast = useToast();
  const [themes, setThemes] = useState<ThemeSummary[]>([]);
  const [editing, setEditing] = useState<{ id: number | null; form: ThemeRequest } | null>(null);
  const [products, setProducts] = useState<ProductDetail[]>([]);

  const load = useCallback(() => {
    adminApi.themes().then(setThemes).catch((err) => toast(errorMessage(err)));
  }, [toast]);
  useEffect(load, [load]);
  useEffect(() => {
    adminApi
      .products()
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]));
  }, []);

  const open = async (theme: ThemeSummary | null) => {
    if (!theme) {
      setEditing({ id: null, form: { ...EMPTY } });
      return;
    }
    try {
      const detail = await adminApi.theme(theme.slug);
      const s = detail.summary;
      setEditing({
        id: s.id,
        form: {
          slug: s.slug,
          eyebrow: s.eyebrow ?? '',
          title: s.title,
          subtitle: s.subtitle ?? '',
          story: detail.story ?? '',
          heroImageUrl: s.heroImageUrl,
          startsOn: s.startsOn,
          endsOn: s.endsOn,
          sortOrder: s.sortOrder,
          published: s.published,
          items: detail.items.map((i) => ({ productId: i.product.id, note: i.note ?? '' })),
        },
      });
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const remove = async (theme: ThemeSummary) => {
    if (!window.confirm(`'${theme.title}' 테마를 삭제할까요?`)) return;
    try {
      await adminApi.deleteTheme(theme.id);
      toast('테마를 삭제했어요.');
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <ThemeForm
        initial={editing.form}
        products={products}
        onCancel={() => setEditing(null)}
        onSubmit={async (form) => {
          try {
            if (editing.id) await adminApi.updateTheme(editing.id, form);
            else await adminApi.createTheme(form);
            toast('테마를 저장했어요.');
            setEditing(null);
            load();
          } catch (err) {
            toast(errorMessage(err));
          }
        }}
      />
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <h2 className="serif">테마 큐레이션</h2>
        <button className="btn btn-primary" onClick={() => void open(null)}>
          새 테마
        </button>
      </div>
      {themes.length === 0 ? (
        <p className={styles.empty}>아직 테마가 없어요.</p>
      ) : (
        <div className={styles.themeGrid}>
          {themes.map((t) => (
            <article key={t.id} className={styles.themeCard}>
              <img src={t.heroImageUrl} alt="" />
              <div>
                <strong>{t.title}</strong>
                <span className={styles.sub}>
                  /theme/{t.slug} · 향 {t.productCount}개 · {t.published ? (t.active ? '노출 중' : '기간 외') : '비공개'}
                </span>
                <span className={styles.sub}>
                  {t.startsOn || t.endsOn ? `${t.startsOn ? formatDate(t.startsOn) : '…'} ~ ${t.endsOn ? formatDate(t.endsOn) : '…'}` : '상시'}
                </span>
                <span className={styles.actions}>
                  <button onClick={() => void open(t)}>편집</button>
                  <button onClick={() => void remove(t)}>삭제</button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeForm({
  initial,
  products,
  onCancel,
  onSubmit,
}: {
  initial: ThemeRequest;
  products: ProductDetail[];
  onCancel: () => void;
  onSubmit: (form: ThemeRequest) => Promise<void>;
}) {
  const [f, setF] = useState<ThemeRequest>(initial);
  const [pick, setPick] = useState('');
  const [saving, setSaving] = useState(false);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const set = (key: keyof ThemeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ ...f, startsOn: f.startsOn || null, endsOn: f.endsOn || null, sortOrder: Number(f.sortOrder) || 0 });
    setSaving(false);
  };

  return (
    <form className={`${styles.panel} ${styles.productForm}`} onSubmit={submit}>
      <div className={styles.toolbar}>
        <h2 className="serif">{initial.slug ? '테마 편집' : '새 테마'}</h2>
        <div className={styles.formActions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-primary" disabled={saving}>
            저장
          </button>
        </div>
      </div>
      <fieldset>
        <legend>기본 정보</legend>
        <label>
          주소 (영문 소문자·숫자·하이픈) *<input className="input" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={f.slug} onChange={set('slug')} />
        </label>
        <label>
          영문 머리말<input className="input" value={f.eyebrow} onChange={set('eyebrow')} placeholder="AUTUMN EDIT — WARM & WOODY" />
        </label>
        <label className={styles.wide}>
          제목 *<input className="input" required maxLength={120} value={f.title} onChange={set('title')} />
        </label>
        <label className={styles.wide}>
          부제<input className="input" maxLength={200} value={f.subtitle} onChange={set('subtitle')} />
        </label>
        <label className={styles.wide}>
          이야기<textarea className="input" rows={5} maxLength={2000} value={f.story} onChange={set('story')} />
        </label>
      </fieldset>
      <fieldset>
        <legend>노출</legend>
        <label>
          시작일<input className="input" type="date" value={f.startsOn ?? ''} onChange={set('startsOn')} />
        </label>
        <label>
          종료일<input className="input" type="date" value={f.endsOn ?? ''} onChange={set('endsOn')} />
        </label>
        <label>
          정렬 순서<input className="input" type="number" value={f.sortOrder} onChange={set('sortOrder')} />
        </label>
        <label className={styles.inline}>
          <input type="checkbox" checked={f.published} onChange={set('published')} /> 공개
        </label>
        <p className="help">기간을 비우면 상시 노출돼요. 기간 안의 테마가 목록 맨 앞에 보여요.</p>
      </fieldset>
      <fieldset>
        <legend>대표 이미지</legend>
        <label className={styles.wide}>
          이미지 URL *<input className="input" required value={f.heroImageUrl} onChange={set('heroImageUrl')} />
        </label>
        <ImageUpload purpose="THEME" className={styles.uploadButton} label="대표 이미지 올리기" onUploaded={(url) => setF((prev) => ({ ...prev, heroImageUrl: url }))} />
        {f.heroImageUrl && <img className={styles.preview} src={f.heroImageUrl} alt="미리보기" />}
      </fieldset>
      <fieldset>
        <legend>묶을 향 ({f.items.length} / 12)</legend>
        <div className={styles.wide} style={{ display: 'flex', gap: 8 }}>
          <select className="input" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="추가할 상품">
            <option value="">상품 선택</option>
            {products
              .filter((p) => !f.items.some((i) => i.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.category}] {p.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!pick || f.items.length >= 12}
            onClick={() => {
              setF((prev) => ({ ...prev, items: [...prev.items, { productId: Number(pick), note: '' }] }));
              setPick('');
            }}
          >
            추가
          </button>
        </div>
        <div className={styles.wide}>
          {f.items.map((item, index) => {
            const p = byId.get(item.productId);
            return (
              <div key={item.productId} className={styles.itemRow}>
                {p ? <img src={p.imageUrl} alt="" /> : <span />}
                <span>{p?.name ?? `상품 #${item.productId}`}</span>
                <input
                  className="input"
                  placeholder="큐레이터 한 줄 소개"
                  maxLength={200}
                  value={item.note}
                  onChange={(e) =>
                    setF((prev) => ({ ...prev, items: prev.items.map((it, i) => (i === index ? { ...it, note: e.target.value } : it)) }))
                  }
                />
                <span className={styles.actions}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      setF((prev) => {
                        const items = [...prev.items];
                        [items[index - 1], items[index]] = [items[index], items[index - 1]];
                        return { ...prev, items };
                      })
                    }
                  >
                    ↑
                  </button>
                  <button type="button" onClick={() => setF((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}>
                    빼기
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}

/** 조향사 정산 관리: 정산 대기 → 송금 후 지급 완료 처리 */
export function AdminSettlements() {
  const toast = useToast();
  const [status, setStatus] = useState('PENDING');
  const [data, setData] = useState<SettlementSummary | null>(null);

  const load = useCallback(() => {
    adminApi
      .settlements(status || undefined)
      .then(setData)
      .catch((err) => toast(errorMessage(err)));
  }, [status, toast]);
  useEffect(load, [load]);

  const pay = async (id: number, name: string, amount: number) => {
    if (!window.confirm(`${name} 조향사에게 ${formatPrice(amount)}을 송금했나요? 지급 완료로 표시합니다.`)) return;
    try {
      await adminApi.paySettlement(id);
      toast('지급 완료로 바꿨어요.');
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.segment}>
          {[
            ['PENDING', '정산 대기'],
            ['PAID', '지급 완료'],
            ['', '전체'],
          ].map(([value, label]) => (
            <button key={label} className={status === value ? styles.segmentOn : ''} onClick={() => setStatus(value)}>
              {label}
            </button>
          ))}
        </div>
        <div className={styles.summaryBar}>
          <span>
            대기<strong>{formatPrice(data?.pendingAmount ?? 0)}</strong>
          </span>
          <span>
            지급<strong>{formatPrice(data?.paidAmount ?? 0)}</strong>
          </span>
        </div>
      </div>
      {!data || data.items.length === 0 ? (
        <p className={styles.empty}>해당하는 정산 내역이 없어요.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>의뢰</th>
                <th>조향사</th>
                <th>구분</th>
                <th>대상 금액</th>
                <th>수수료</th>
                <th>지급 금액</th>
                <th>상태</th>
                <th>생성일</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={`/custom/${s.commissionId}`}>{s.commissionTitle}</a>
                  </td>
                  <td>{s.perfumerName}</td>
                  <td>{s.reason === 'PARTIAL_CANCEL' ? '제작 중 취소' : '구매 확정'}</td>
                  <td className="latin">{formatPrice(s.grossAmount)}</td>
                  <td className="latin">{formatPrice(s.feeAmount)}</td>
                  <td className="latin">{formatPrice(s.netAmount)}</td>
                  <td>
                    {s.status === 'PAID' ? (
                      `지급 완료 · ${formatDate(s.paidAt ?? '')}`
                    ) : (
                      <button className={styles.linkButton} onClick={() => void pay(s.id, s.perfumerName, s.netAmount)}>
                        지급 완료로 →
                      </button>
                    )}
                  </td>
                  <td className="latin">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
