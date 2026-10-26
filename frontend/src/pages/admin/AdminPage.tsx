import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { adminApi } from '../../api/endpoints';
import type { MemberRow, OrderStatus, OrderSummary, PerfumerApplicationRow, ProductDetail } from '../../api/types';
import { useToast } from '../../components/Toast';
import { formatDate, formatPrice } from '../../lib/format';
import { AdminSettlements, AdminThemes } from './AdminThemes';
import ProductForm from './ProductForm';
import styles from './AdminPage.module.css';

const TABS = [
  { key: 'products', label: '상품 관리' },
  { key: 'orders', label: '주문 관리' },
  { key: 'themes', label: '테마' },
  { key: 'settlements', label: '정산' },
  { key: 'perfumers', label: '조향사 인증' },
  { key: 'members', label: '고객 관리' },
] as const;

const CATEGORY_LABEL: Record<string, string> = { '001': '방향제', '002': '인센스', '003': '향수', '004': '캔들' };

export default function AdminPage() {
  const { tab = 'products' } = useParams();
  return (
    <section className={`page px ${styles.admin}`}>
      <div className={styles.head}>
        <div>
          <p className="eyebrow">YEOUN BACK OFFICE</p>
          <h1 className="serif">관리자 페이지</h1>
        </div>
        <nav className={styles.tabs} aria-label="관리 메뉴">
          {TABS.map((t) => (
            <Link key={t.key} to={`/admin/${t.key}`} className={tab === t.key ? styles.tabOn : ''}>
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {tab === 'perfumers' ? (
        <Perfumers />
      ) : tab === 'members' ? (
        <Members />
      ) : tab === 'orders' ? (
        <Orders />
      ) : tab === 'themes' ? (
        <AdminThemes />
      ) : tab === 'settlements' ? (
        <AdminSettlements />
      ) : (
        <Products />
      )}
    </section>
  );
}

function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : '요청을 처리하지 못했어요.';
}

function Products() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [editing, setEditing] = useState<ProductDetail | 'new' | null>(null);
  const [stocks, setStocks] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    adminApi
      .products()
      .then((page) => setProducts(page.content))
      .catch((err) => toast(errorMessage(err)));
  }, [toast]);
  useEffect(load, [load]);

  const saveStock = async (p: ProductDetail) => {
    const value = Number(stocks[p.id]);
    if (!Number.isInteger(value) || value < 0) {
      toast('재고는 0 이상의 숫자로 입력해 주세요.');
      return;
    }
    try {
      await adminApi.updateStock(p.id, value);
      toast(value === 0 ? `${p.name} — 품절(Sold Out)로 표시됩니다.` : `${p.name} 재고를 ${value}개로 바꿨어요.`);
      setStocks((s) => {
        const next = { ...s };
        delete next[p.id];
        return next;
      });
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const remove = async (p: ProductDetail) => {
    if (!window.confirm(`'${p.name}' 상품을 판매 목록에서 내릴까요?`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      toast('상품을 내렸어요.');
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <ProductForm
        product={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <p>
          판매 중인 상품 <strong>{products.length}</strong>개
        </p>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          상품 등록
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>코드</th>
              <th>상품</th>
              <th>가격</th>
              <th>재고</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="latin">
                  {p.incCd}
                  <span className={styles.sub}>{CATEGORY_LABEL[p.incCd]}</span>
                </td>
                <td>
                  <div className={styles.productCell}>
                    <img src={p.imageUrl} alt="" />
                    <div>
                      <Link to={`/products/${p.id}`}>{p.name}</Link>
                      <span className={styles.sub}>{p.subtitle}</span>
                    </div>
                  </div>
                </td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <div className={styles.stock}>
                    <input
                      type="number"
                      min={0}
                      value={stocks[p.id] ?? String(p.stock)}
                      onChange={(e) => setStocks((s) => ({ ...s, [p.id]: e.target.value }))}
                      aria-label={`${p.name} 재고`}
                    />
                    {stocks[p.id] !== undefined && <button onClick={() => saveStock(p)}>저장</button>}
                  </div>
                </td>
                <td>
                  {p.soldOut ? <span className={styles.badgeOut}>SOLD OUT</span> : <span className={styles.badgeOn}>판매중</span>}
                  {p.newArrival && <span className={styles.badgeNew}>NEW</span>}
                </td>
                <td className={styles.actions}>
                  <button onClick={() => setEditing(p)}>수정</button>
                  <button onClick={() => remove(p)}>내리기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Perfumers() {
  const toast = useToast();
  const [status, setStatus] = useState('PENDING');
  const [rows, setRows] = useState<PerfumerApplicationRow[]>([]);

  const load = useCallback(() => {
    adminApi
      .applications(status || undefined)
      .then(setRows)
      .catch((err) => toast(errorMessage(err)));
  }, [status, toast]);
  useEffect(load, [load]);

  const approve = async (row: PerfumerApplicationRow) => {
    try {
      await adminApi.approve(row.id);
      toast(`${row.memberName} 님을 조향사로 승인했어요.`);
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const reject = async (row: PerfumerApplicationRow) => {
    const reason = window.prompt('반려 사유를 입력해 주세요. (선택)') ?? '';
    try {
      await adminApi.reject(row.id, reason);
      toast('신청을 반려했어요.');
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
            ['PENDING', '승인 대기'],
            ['APPROVED', '승인'],
            ['REJECTED', '반려'],
            ['', '전체'],
          ].map(([value, label]) => (
            <button key={label} className={status === value ? styles.segmentOn : ''} onClick={() => setStatus(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>해당하는 인증 신청서가 없어요.</p>
      ) : (
        <div className={styles.cards}>
          {rows.map((row) => (
            <article key={row.id} className={styles.application}>
              <div className={styles.appHead}>
                <div>
                  <p className="serif">{row.memberName}</p>
                  <p className={styles.sub}>{row.memberEmail}</p>
                </div>
                <span className={styles[`status${row.status}`]}>{row.status}</span>
              </div>
              <dl>
                <div>
                  <dt>스튜디오</dt>
                  <dd>{row.studioName || '-'}</dd>
                </div>
                <div>
                  <dt>경력</dt>
                  <dd>{row.careerYears}년</dd>
                </div>
                <div>
                  <dt>자격·수료</dt>
                  <dd>{row.certification || '-'}</dd>
                </div>
                <div>
                  <dt>포트폴리오</dt>
                  <dd>
                    {row.portfolioUrl ? (
                      <a href={row.portfolioUrl} target="_blank" rel="noreferrer">
                        {row.portfolioUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>소개</dt>
                  <dd>{row.introduction}</dd>
                </div>
                <div>
                  <dt>신청일</dt>
                  <dd>{formatDate(row.createdAt)}</dd>
                </div>
                {row.rejectReason && (
                  <div>
                    <dt>반려 사유</dt>
                    <dd>{row.rejectReason}</dd>
                  </div>
                )}
              </dl>
              {row.status === 'PENDING' && (
                <div className={styles.appActions}>
                  <button className="btn btn-ghost" onClick={() => reject(row)}>
                    반려
                  </button>
                  <button className="btn btn-primary" onClick={() => approve(row)}>
                    승인
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const ROLES = ['USER', 'PERFUMER', 'ADMIN'];
const GRADES = [
  ['BRONZE', '브론즈'],
  ['SILVER', '실버'],
  ['GOLD', '골드'],
  ['PLATINUM', '플래티넘'],
  ['DIAMOND', '다이아'],
];

function Members() {
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<MemberRow[]>([]);

  const load = useCallback(
    (q?: string) => {
      adminApi
        .members(q)
        .then((page) => setRows(page.content))
        .catch((err) => toast(errorMessage(err)));
    },
    [toast],
  );
  useEffect(() => load(), [load]);

  const update = async (row: MemberRow, body: { role?: string; grade?: string }) => {
    try {
      const updated = await adminApi.updateMember(row.id, body);
      setRows((list) => list.map((r) => (r.id === row.id ? updated : r)));
      toast(`${row.name} 님 정보를 바꿨어요.`);
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <div className={styles.panel}>
      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          load(keyword.trim() || undefined);
        }}
      >
        <input className={`input ${styles.searchInput}`} placeholder="이름 또는 이메일로 찾기" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="btn btn-ghost">검색</button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>권한</th>
              <th>등급</th>
              <th>마케팅</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="latin">{r.email}</td>
                <td>
                  <select value={r.role} onChange={(e) => update(r, { role: e.target.value })}>
                    {ROLES.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={r.grade} onChange={(e) => update(r, { grade: e.target.value })}>
                    {GRADES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{r.marketingAgreed ? '동의' : '-'}</td>
                <td className="latin">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ORDER_FLOW: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING_PAYMENT', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'PREPARING', label: '상품 준비 중' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CANCELLED', label: '취소' },
];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { PAID: 'PREPARING', PREPARING: 'SHIPPING', SHIPPING: 'DELIVERED' };

function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [rows, setRows] = useState<OrderSummary[]>([]);

  const load = useCallback(() => {
    adminApi
      .orders(status || undefined)
      .then((page) => setRows(page.content))
      .catch((err) => toast(errorMessage(err)));
  }, [status, toast]);
  useEffect(load, [load]);

  const change = async (row: OrderSummary, next: OrderStatus) => {
    if (next === 'CANCELLED' && !window.confirm(`${row.orderNumber} 주문을 취소할까요? 재고·쿠폰·적립금이 복구돼요.`)) return;
    try {
      await adminApi.changeOrderStatus(row.id, next);
      toast(`${row.orderNumber} → ${ORDER_FLOW.find((f) => f.value === next)?.label}`);
      load();
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.segment}>
          {[{ value: '' as const, label: '전체' }, ...ORDER_FLOW].map((f) => (
            <button key={f.label} className={status === f.value ? styles.segmentOn : ''} onClick={() => setStatus(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>해당하는 주문이 없어요.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문 번호</th>
                <th>주문자</th>
                <th>상품</th>
                <th>결제 금액</th>
                <th>상태</th>
                <th>처리</th>
                <th>주문일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const next = NEXT[r.status];
                return (
                  <tr key={r.id}>
                    <td className="latin">{r.orderNumber}</td>
                    <td>{r.memberName}</td>
                    <td>
                      {r.firstItemName}
                      {r.itemCount > 1 ? ` 외 ${r.itemCount - 1}건` : ''}
                    </td>
                    <td className="latin">{formatPrice(r.totalAmount)}</td>
                    <td>{r.statusLabel}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {next && (
                        <button className={styles.linkButton} onClick={() => change(r, next)}>
                          {ORDER_FLOW.find((f) => f.value === next)?.label}으로 →
                        </button>
                      )}
                      {(r.status === 'PAID' || r.status === 'PREPARING') && (
                        <button className={styles.linkButton} onClick={() => change(r, 'CANCELLED')} style={{ marginLeft: 12 }}>
                          취소
                        </button>
                      )}
                    </td>
                    <td className="latin">{formatDate(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
