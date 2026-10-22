import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { couponApi, memberApi, orderApi, productApi } from '../../api/endpoints';
import type { Coupon, OrderLine, PaymentMethod, ProductDetail } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { formatPrice, shippingFor } from '../../lib/format';
import { openPostcode } from '../../lib/postcode';
import { useShop } from '../../shop/ShopContext';
import OrderIntro from './OrderIntro';
import styles from './Commerce.module.css';

interface CheckoutState {
  lines: OrderLine[];
  fromCart: boolean;
}

const METHODS: { value: PaymentMethod; label: string; providers: string[]; providerLabel: string }[] = [
  { value: 'CARD', label: '신용 / 체크카드', providerLabel: '카드 선택', providers: ['여운카드', '하나카드', '국민카드', '신한카드', '현대카드'] },
  { value: 'TRANSFER', label: '계좌이체', providerLabel: '은행 선택', providers: ['여운은행', '국민은행', '신한은행', '우리은행', '하나은행'] },
  { value: 'EASY_PAY', label: '간편결제', providerLabel: '간편결제 선택', providers: ['카카오페이', '네이버페이', '토스페이'] },
];

const MEMOS = ['선택 안 함', '문 앞에 놓아 주세요.', '경비실에 맡겨 주세요.', '배송 전에 연락 부탁드려요.', '직접 입력'];

const PHONE = /^[0-9-]{9,13}$/;

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { member } = useAuth();
  const { refreshCart } = useShop();
  const state = location.state as CheckoutState | null;

  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [availablePoint, setAvailablePoint] = useState(0);

  const [orderer, setOrderer] = useState({ name: '', phone: '', email: '' });
  const [sameAsOrderer, setSameAsOrderer] = useState(true);
  const [shipping, setShipping] = useState({ recipientName: '', recipientPhone: '', zipCode: '', address1: '', address2: '' });
  const [memoChoice, setMemoChoice] = useState(MEMOS[0]);
  const [memoText, setMemoText] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [couponId, setCouponId] = useState<number | ''>('');
  const [pointInput, setPointInput] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [provider, setProvider] = useState(METHODS[0].providers[0]);
  const [agreeOrder, setAgreeOrder] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state?.lines?.length) return;
    Promise.all(state.lines.map((l) => productApi.detail(l.productId)))
      .then(setProducts)
      .catch(() => {
        toast('주문할 상품 정보를 불러오지 못했어요.');
        navigate('/cart', { replace: true });
      });
    couponApi.mine().then(setCoupons).catch(() => setCoupons([]));
    memberApi
      .summary()
      .then((s) => {
        setAvailablePoint(s.point);
        if (s.address) {
          setSameAsOrderer(false);
          setShipping({
            recipientName: s.address.recipientName,
            recipientPhone: s.address.recipientPhone,
            zipCode: s.address.zipCode,
            address1: s.address.address1,
            address2: s.address.address2 ?? '',
          });
        } else {
          setSaveAddress(true);
        }
      })
      .catch(() => undefined);
  }, [state, navigate, toast]);

  useEffect(() => {
    if (member) setOrderer({ name: member.name, phone: member.phone ?? '', email: member.email });
  }, [member]);

  const lines = useMemo(
    () =>
      (products ?? []).map((p, i) => ({
        product: p,
        quantity: state?.lines[i]?.quantity ?? 1,
      })),
    [products, state],
  );
  const itemsAmount = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const usableCoupons = coupons.filter((c) => c.usable);
  const coupon = usableCoupons.find((c) => c.id === couponId);
  const couponDiscount = coupon && itemsAmount >= coupon.minOrderAmount ? Math.min(coupon.discountAmount, itemsAmount) : 0;
  const maxPoint = Math.max(0, Math.min(availablePoint, itemsAmount - couponDiscount));
  const pointUsed = Math.min(maxPoint, Math.max(0, Number(pointInput.replace(/[^0-9]/g, '')) || 0));
  const shippingFee = shippingFor(itemsAmount);
  const total = itemsAmount - couponDiscount - pointUsed + shippingFee;
  const currentMethod = METHODS.find((m) => m.value === method) ?? METHODS[0];
  const soldOutLine = lines.find((l) => l.product.soldOut || l.product.stock < l.quantity);

  // 쿠폰 최소 금액을 만족하는 가장 큰 쿠폰을 기본으로 적용합니다.
  useEffect(() => {
    if (couponId !== '' || !itemsAmount) return;
    const best = usableCoupons
      .filter((c) => itemsAmount >= c.minOrderAmount)
      .sort((a, b) => b.discountAmount - a.discountAmount)[0];
    if (best) setCouponId(best.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupons, itemsAmount]);

  if (!state?.lines?.length) return <Navigate to="/cart" replace />;

  const receiver = sameAsOrderer
    ? { ...shipping, recipientName: orderer.name, recipientPhone: orderer.phone }
    : shipping;

  const searchAddress = async () => {
    try {
      const result = await openPostcode();
      if (result) setShipping((s) => ({ ...s, zipCode: result.zipCode, address1: result.address }));
    } catch {
      toast('주소 검색을 열지 못했어요. 우편번호와 주소를 직접 입력해 주세요.');
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!orderer.name.trim()) next.ordererName = '주문자 이름을 입력해 주세요.';
    if (!PHONE.test(orderer.phone)) next.ordererPhone = '휴대전화 번호를 확인해 주세요. (예: 010-1234-5678)';
    if (!/^\S+@\S+\.\S+$/.test(orderer.email)) next.ordererEmail = '이메일을 확인해 주세요.';
    if (!receiver.recipientName.trim()) next.recipientName = '받는 분을 입력해 주세요.';
    if (!PHONE.test(receiver.recipientPhone)) next.recipientPhone = '연락처를 확인해 주세요.';
    if (!receiver.zipCode.trim()) next.zipCode = '우편번호를 입력해 주세요.';
    if (!receiver.address1.trim()) next.address1 = '기본 주소를 입력해 주세요.';
    if (!agreeOrder || !agreePrivacy) next.consent = '필수 항목에 모두 동의해 주세요.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (soldOutLine) {
      toast(`${soldOutLine.product.name}의 재고가 부족해요.`);
      return;
    }
    if (!validate()) {
      toast('입력한 내용을 다시 확인해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const memo = memoChoice === '직접 입력' ? memoText.trim() : memoChoice === MEMOS[0] ? '' : memoChoice;
      const order = await orderApi.create({
        items: state.lines,
        fromCart: state.fromCart,
        orderer,
        shipping: { ...receiver, memo },
        saveAsDefaultAddress: saveAddress,
        paymentMethod: method,
        paymentProvider: provider,
        couponId: coupon ? coupon.id : null,
        usePoint: pointUsed,
        agreed: true,
      });
      void refreshCart();
      navigate(`/orders/${order.id}/complete`, { replace: true, state: { order } });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: string) => (errors[key] ? <span className="error-text">{errors[key]}</span> : null);

  return (
    <>
      <OrderIntro
        crumbs={state.fromCart ? [{ label: '장바구니', to: '/cart' }, { label: '주문서 작성' }] : [{ label: '주문서 작성' }]}
        eyebrow="YOUR NEXT SCENT CHAPTER"
        title="당신의 일상으로 향을 보냅니다"
        step={2}
        notice="포트폴리오용 모의 결제입니다. 실제 카드 정보는 받지 않으며, 결제 승인 후 바로 주문 내역에서 확인할 수 있어요."
      />

      <form className={`page px ${styles.body}`} onSubmit={submit} noValidate>
        <div className={styles.main} style={{ gap: 44 }}>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>주문자 정보</h2>
              <span>* 필수 입력</span>
            </div>
            <div className={styles.fields}>
              <div className={styles.pair}>
                <div className={styles.field}>
                  <label htmlFor="ordererName">
                    이름<span className={styles.required}>*</span>
                  </label>
                  <input id="ordererName" className="input" value={orderer.name} onChange={(e) => setOrderer({ ...orderer, name: e.target.value })} autoComplete="name" />
                  {field('ordererName')}
                </div>
                <div className={styles.field}>
                  <label htmlFor="ordererPhone">
                    휴대전화<span className={styles.required}>*</span>
                  </label>
                  <input id="ordererPhone" className="input" inputMode="tel" placeholder="010-1234-5678" value={orderer.phone} onChange={(e) => setOrderer({ ...orderer, phone: e.target.value })} autoComplete="tel" />
                  {field('ordererPhone')}
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="ordererEmail">
                  이메일<span className={styles.required}>*</span>
                </label>
                <input id="ordererEmail" className="input" type="email" value={orderer.email} onChange={(e) => setOrderer({ ...orderer, email: e.target.value })} autoComplete="email" />
                {field('ordererEmail')}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>배송지 정보</h2>
              <label className={styles.check}>
                <input type="checkbox" checked={sameAsOrderer} onChange={(e) => setSameAsOrderer(e.target.checked)} />
                주문자 정보와 동일
              </label>
            </div>
            <div className={styles.fields}>
              <div className={styles.pair}>
                <div className={styles.field}>
                  <label htmlFor="recipientName">
                    받는 분<span className={styles.required}>*</span>
                  </label>
                  <input id="recipientName" className="input" value={receiver.recipientName} disabled={sameAsOrderer} onChange={(e) => setShipping({ ...shipping, recipientName: e.target.value })} />
                  {field('recipientName')}
                </div>
                <div className={styles.field}>
                  <label htmlFor="recipientPhone">
                    연락처<span className={styles.required}>*</span>
                  </label>
                  <input id="recipientPhone" className="input" inputMode="tel" value={receiver.recipientPhone} disabled={sameAsOrderer} onChange={(e) => setShipping({ ...shipping, recipientPhone: e.target.value })} />
                  {field('recipientPhone')}
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="zipCode">
                  주소<span className={styles.required}>*</span>
                </label>
                <div className={styles.zip}>
                  <input id="zipCode" className="input" placeholder="우편번호" inputMode="numeric" value={shipping.zipCode} onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })} />
                  <button type="button" className="btn btn-ghost" onClick={searchAddress}>
                    주소 검색
                  </button>
                </div>
                {field('zipCode')}
              </div>
              <div className={styles.field}>
                <label htmlFor="address1">
                  기본 주소<span className={styles.required}>*</span>
                </label>
                <input id="address1" className="input" value={shipping.address1} onChange={(e) => setShipping({ ...shipping, address1: e.target.value })} />
                {field('address1')}
              </div>
              <div className={styles.field}>
                <label htmlFor="address2">상세 주소</label>
                <input id="address2" className="input" placeholder="동, 호수 등" value={shipping.address2} onChange={(e) => setShipping({ ...shipping, address2: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="memo">배송 요청사항 (선택)</label>
                <select id="memo" className={`input ${styles.select}`} value={memoChoice} onChange={(e) => setMemoChoice(e.target.value)}>
                  {MEMOS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                {memoChoice === '직접 입력' && (
                  <input className="input" maxLength={100} placeholder="배송 기사님께 남길 말을 적어 주세요." value={memoText} onChange={(e) => setMemoText(e.target.value)} />
                )}
              </div>
              <label className={styles.check}>
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                이 배송지를 기본 배송지로 저장
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>주문 상품</h2>
              <span>{quantity}개</span>
            </div>
            <div className={styles.lineItems}>
              {!products && <div className="skeleton" style={{ height: 116 }} />}
              {lines.map(({ product, quantity: q }) => (
                <div key={product.id} className={styles.lineItem}>
                  <img src={product.imageUrl} alt="" />
                  <div>
                    <p className={styles.lineName}>{product.name}</p>
                    <p className={styles.lineMeta}>
                      {product.category} · {product.volume} / {q}개
                    </p>
                    {(product.soldOut || product.stock < q) && <p className="error-text">재고가 부족해요. (남은 수량 {product.stock}개)</p>}
                  </div>
                  <span className={styles.linePrice}>{formatPrice(product.price * q)}</span>
                </div>
              ))}
              <div className={styles.lineTotal}>
                <span>상품 합계</span>
                <strong>{formatPrice(itemsAmount)}</strong>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>할인</h2>
              <span>쿠폰 {usableCoupons.length}장 · 적립금 {formatPrice(availablePoint)}</span>
            </div>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="coupon">쿠폰</label>
                <select id="coupon" className={`input ${styles.select}`} value={couponId} onChange={(e) => setCouponId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">적용하지 않음</option>
                  {usableCoupons.map((c) => (
                    <option key={c.id} value={c.id} disabled={itemsAmount < c.minOrderAmount}>
                      {c.name} ({formatPrice(c.discountAmount)} · {formatPrice(c.minOrderAmount)} 이상)
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="point">적립금</label>
                <div className={styles.discountRow}>
                  <input id="point" className="input" inputMode="numeric" placeholder="0" value={pointInput} onChange={(e) => setPointInput(e.target.value)} disabled={maxPoint === 0} />
                  <button type="button" className="btn btn-ghost" disabled={maxPoint === 0} onClick={() => setPointInput(String(maxPoint))}>
                    모두 사용
                  </button>
                </div>
                <span className="help">사용 가능 {formatPrice(maxPoint)} · 배송 완료 후 상품 금액의 1%가 적립돼요.</span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>결제수단</h2>
              <span>모의 결제 · 카드 정보 미수집</span>
            </div>
            <div className={styles.methods} role="radiogroup" aria-label="결제수단">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={method === m.value}
                  className={styles.method}
                  onClick={() => {
                    setMethod(m.value);
                    setProvider(m.providers[0]);
                  }}
                >
                  <span aria-hidden>{method === m.value ? '◉' : '○'}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <div className={styles.field}>
              <label htmlFor="provider">{currentMethod.providerLabel}</label>
              <select id="provider" className={`input ${styles.select}`} value={provider} onChange={(e) => setProvider(e.target.value)}>
                {currentMethod.providers.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <span className="help">결제 버튼을 누르면 모의 승인 번호가 발급되고 주문이 바로 완료돼요. 실제 결제는 일어나지 않아요.</span>
            </div>
          </section>
        </div>

        <aside className={styles.aside}>
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>결제 예정 금액</h2>
            <dl className={styles.summaryRows}>
              <div>
                <dt>상품 합계</dt>
                <dd>{formatPrice(itemsAmount)}</dd>
              </div>
              <div>
                <dt>쿠폰</dt>
                <dd>{couponDiscount ? `- ${formatPrice(couponDiscount)}` : '0원'}</dd>
              </div>
              <div>
                <dt>적립금 사용</dt>
                <dd>{pointUsed ? `- ${formatPrice(pointUsed)}` : '0원'}</dd>
              </div>
              <div>
                <dt>배송비</dt>
                <dd>{formatPrice(shippingFee)}</dd>
              </div>
            </dl>
            <div className={styles.divider} />
            <div className={styles.total}>
              <span className={styles.totalLabel}>총 결제 예정 금액</span>
              <span className={`${styles.totalAmount} ${styles.totalAmountLarge}`}>{formatPrice(total)}</span>
              <p className={styles.totalNote}>
                {lines.length}개 상품 · {couponDiscount || pointUsed ? `할인 ${formatPrice(couponDiscount + pointUsed)}` : '추가 할인 없음'}
              </p>
            </div>
            <div className={styles.consents}>
              <label className={styles.check}>
                <input type="checkbox" checked={agreeOrder} onChange={(e) => setAgreeOrder(e.target.checked)} />
                (필수) 주문 상품과 결제 금액을 확인했으며 결제 진행에 동의합니다.
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
                (필수) 배송을 위한 개인정보 수집·이용에 동의합니다.
              </label>
              {field('consent')}
            </div>
            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !products || Boolean(soldOutLine)}>
                {submitting ? '결제 승인 중…' : `${formatPrice(total)} 결제하기`}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                취소
              </button>
            </div>
          </div>
          <div className={styles.asideNote}>
            <h3>향을 맞이하기 전에</h3>
            <p>
              향은 빛과 열에 약해요. 받은 뒤에는 직사광선을 피해 서늘한 곳에 두고, 디퓨저는 리드를 꽂은 뒤 하루 정도 지나면 향이 고르게
              퍼집니다.
            </p>
            <Link to={state.fromCart ? '/cart' : '/'} className={styles.back}>
              {state.fromCart ? '← 장바구니로 돌아가기' : '← 계속 쇼핑하기'}
            </Link>
          </div>
        </aside>
      </form>
      <CompactFooter />
    </>
  );
}
