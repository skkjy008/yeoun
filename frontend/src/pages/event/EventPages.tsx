import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Wheel } from 'react-custom-roulette';
import { ApiError } from '../../api/client';
import { eventApi, themeApi } from '../../api/endpoints';
import type { EventDetail, EventSummary, RouletteStatus, SpinResult, ThemeDetail } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import ProductCard from '../../components/ProductCard';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import { formatDateTime, formatPeriod, formatPrice } from '../../lib/format';
import NotFoundPage from '../NotFoundPage';
import OrderIntro from '../order/OrderIntro';
import styles from './Event.module.css';

const STATUS_LABEL: Record<EventSummary['status'], string> = {
  ONGOING: '진행 중',
  UPCOMING: '예정',
  ENDED: '종료',
};

function StatusChip({ status }: { status: EventSummary['status'] }) {
  return <span className={`${styles.chip} ${styles[`chip${status}`] ?? ''}`}>{STATUS_LABEL[status]}</span>;
}

/** 이벤트 목록: 한 행에 썸네일 · 이벤트명 · 내용 · (작은 회색 글씨) 기간 */
export function EventListPage() {
  const [events, setEvents] = useState<EventSummary[] | null>(null);

  useEffect(() => {
    eventApi.list().then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <>
      <OrderIntro crumbs={[{ label: '이벤트' }]} eyebrow="EVENTS" title="여운이 준비한 작은 선물들" />
      <section className="page px">
        <div className={styles.list}>
          {!events &&
            [0, 1, 2].map((n) => (
              <div key={n} className={styles.row}>
                <div className={`${styles.thumb} skeleton`} />
                <div className="skeleton" style={{ height: 96 }} />
              </div>
            ))}
          {events?.length === 0 && <p className="help" style={{ padding: '40px 0' }}>진행 중인 이벤트가 없어요.</p>}
          {events?.map((e) => (
            <Link key={e.id} to={`/events/${e.slug}`} className={`${styles.row} ${e.status === 'ENDED' ? styles.rowEnded : ''}`}>
              <img className={styles.thumb} src={e.thumbnailUrl} alt="" loading="lazy" />
              <div className={styles.rowText}>
                <StatusChip status={e.status} />
                <h2 className={styles.rowTitle}>{e.title}</h2>
                <p className={styles.rowSummary}>{e.summary}</p>
                <p className={styles.period}>이벤트 기간 · {formatPeriod(e.startsOn, e.endsOn)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CompactFooter />
    </>
  );
}

export function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setEvent(null);
    eventApi
      .detail(slug ?? '')
      .then(setEvent)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <NotFoundPage />;
  if (!event) {
    return (
      <section className="page px" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="skeleton" style={{ height: 420 }} />
      </section>
    );
  }
  const { summary } = event;
  const ongoing = summary.status === 'ONGOING';

  return (
    <>
      <OrderIntro crumbs={[{ label: '이벤트', to: '/events' }, { label: summary.title }]} eyebrow="EVENT" title={summary.title} />
      <section className={`page px ${styles.hero}`}>
        <img className={styles.heroImage} src={summary.thumbnailUrl} alt="" />
        <div className={styles.heroCopy}>
          <StatusChip status={summary.status} />
          <p className={styles.period}>이벤트 기간 · {formatPeriod(summary.startsOn, summary.endsOn)}</p>
          {summary.kind === 'THEME_SALE' && event.discountRate && (
            <p className={styles.badge}>
              테마 향 특가 <strong>{event.discountRate}%</strong>
            </p>
          )}
          <p className={styles.body}>{event.body ?? summary.summary}</p>
          {summary.kind === 'THEME_SALE' && event.themeSlug && (
            <div className={styles.heroActions}>
              <Link to={`/theme/${event.themeSlug}`} className="btn btn-primary">
                테마 향 바로가기 <span aria-hidden>→</span>
              </Link>
              <Link to="/events" className="btn btn-ghost">
                다른 이벤트
              </Link>
            </div>
          )}
        </div>
      </section>

      {summary.kind === 'THEME_SALE' && event.themeSlug && (
        <ThemeSaleProducts themeSlug={event.themeSlug} rate={event.discountRate ?? 0} />
      )}
      {summary.kind === 'ROULETTE' && <RouletteSection ongoing={ongoing} />}
      {summary.kind === 'WELCOME_COUPON' && <WelcomeCouponSection ongoing={ongoing} />}
      <CompactFooter />
    </>
  );
}

/* ───────── 테마 특가: 테마에 묶인 향 소개 ───────── */

function ThemeSaleProducts({ themeSlug, rate }: { themeSlug: string; rate: number }) {
  const [theme, setTheme] = useState<ThemeDetail | null>(null);

  useEffect(() => {
    themeApi.detail(themeSlug).then(setTheme).catch(() => setTheme(null));
  }, [themeSlug]);

  if (!theme) return null;
  return (
    <section className={`page px ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2>이벤트 대상 향 · {theme.summary.title}</h2>
        <Link to={`/theme/${themeSlug}`} className="help">
          테마에서 이야기와 함께 보기 ↗
        </Link>
      </div>
      <div className={styles.products}>
        {theme.items.map(({ product }) => (
          <ProductCard key={product.id} product={product} badge={rate ? `${rate}% 특가` : undefined} />
        ))}
      </div>
    </section>
  );
}

/* ───────── 룰렛: 결과는 서버가 정하고, 바퀴는 그 칸에 멈추기만 합니다 ───────── */

type PrizeCode = SpinResult['prize'];

/** 바퀴의 칸 구성 (꽝 칸이 가장 많고 50% 칸은 하나) — 실제 확률은 서버 가중치로 결정 */
const SEGMENTS: { code: PrizeCode; option: string }[] = [
  { code: 'MISS', option: '꽝' },
  { code: 'OFF_10', option: '10% 할인' },
  { code: 'MISS', option: '꽝' },
  { code: 'OFF_20', option: '20% 할인' },
  { code: 'MISS', option: '꽝' },
  { code: 'OFF_10', option: '10% 할인' },
  { code: 'MISS', option: '꽝' },
  { code: 'OFF_50', option: '50% 할인' },
];
const SEGMENT_COLORS: Record<PrizeCode, string> = {
  MISS: '#eeeae1',
  OFF_10: '#e8e0d3',
  OFF_20: '#a88f76',
  OFF_50: '#66513f',
};
const WHEEL_DATA = SEGMENTS.map((s) => ({
  option: s.option,
  style: { backgroundColor: SEGMENT_COLORS[s.code], textColor: s.code === 'OFF_20' || s.code === 'OFF_50' ? '#fffdfa' : '#3e3b31' },
}));

function RouletteSection({ ongoing }: { ongoing: boolean }) {
  const { member, requireMember } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RouletteStatus | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const load = useCallback(() => {
    eventApi.rouletteStatus().then(setStatus).catch(() => setStatus(null));
  }, []);
  useEffect(load, [load, member]);

  const spin = async () => {
    if (!requireMember('룰렛은 회원만 돌릴 수 있어요.')) return;
    if (spinning) return;
    try {
      const res = await eventApi.spin();
      const candidates = SEGMENTS.map((s, i) => (s.code === res.prize ? i : -1)).filter((i) => i >= 0);
      setPrizeNumber(candidates[Math.floor(Math.random() * candidates.length)]);
      setResult(res);
      setSpinning(true);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '룰렛을 돌리지 못했어요.');
      load();
    }
  };

  const spunToday = status?.spunToday ?? false;

  return (
    <section className={`page px ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2>오늘의 룰렛</h2>
        <span className="help">하루 한 번 · 매일 자정에 다시 돌릴 수 있어요</span>
      </div>
      <div className={styles.roulette}>
        <div className={styles.wheelWrap}>
          <Wheel
            mustStartSpinning={spinning}
            prizeNumber={prizeNumber}
            data={WHEEL_DATA}
            outerBorderColor="#66513f"
            outerBorderWidth={6}
            innerBorderColor="#66513f"
            radiusLineColor="#fffdfa"
            radiusLineWidth={2}
            fontFamily="sans-serif"
            fontSize={16}
            spinDuration={0.6}
            onStopSpinning={() => {
              setSpinning(false);
              setShowResult(true);
              load();
            }}
          />
        </div>
        <div className={styles.rouletteSide}>
          <table className={styles.odds}>
            <thead>
              <tr>
                <th>경품</th>
                <th>최대 할인</th>
                <th>당첨 확률</th>
              </tr>
            </thead>
            <tbody>
              {(status?.prizes ?? []).map((p) => (
                <tr key={p.code}>
                  <td>{p.label}</td>
                  <td>{p.rate ? formatPrice(p.maxDiscount) : '-'}</td>
                  <td>{p.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className={`btn btn-primary ${styles.spinButton}`}
            onClick={() => void spin()}
            disabled={spinning || !ongoing || (Boolean(member) && spunToday)}
          >
            {!ongoing ? '이벤트 기간이 아니에요' : spinning ? '돌아가는 중…' : member && spunToday ? '오늘은 이미 참여했어요' : '룰렛 돌리기'}
          </button>
          <p className={styles.note}>
            {member && spunToday && status?.todayPrizeLabel
              ? `오늘의 결과: ${status.todayPrizeLabel} · 다음 참여 ${formatDateTime(status.nextAvailableAt)}`
              : '당첨 쿠폰은 3만 원 이상 주문 시 쓸 수 있고, 발급일로부터 7일 동안 사용할 수 있어요. 할인율이 클수록 당첨되기 어려워요.'}
          </p>
        </div>
      </div>
      {showResult && result && (
        <Modal
          title={result.prize === 'MISS' ? '아쉽게도 꽝이에요' : `${result.label} 당첨!`}
          onClose={() => setShowResult(false)}
          actions={
            result.coupon ? (
              <>
                <button className="btn btn-ghost" onClick={() => setShowResult(false)}>
                  닫기
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/mypage/coupons')}>
                  쿠폰함 보기
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowResult(false)}>
                내일 다시 도전할게요
              </button>
            )
          }
        >
          {result.message}
        </Modal>
      )}
    </section>
  );
}

/* ───────── 신규 가입 쿠폰: 회원이면 누구나 1회 ───────── */

function WelcomeCouponSection({ ongoing }: { ongoing: boolean }) {
  const { requireMember } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(false);

  const claim = async () => {
    if (!requireMember('쿠폰은 회원만 받을 수 있어요. 가입하고 다시 눌러 주세요.')) return;
    setBusy(true);
    try {
      await eventApi.claimWelcome();
      setIssued(true);
    } catch (e) {
      // 이미 받은 회원(409)은 모달 없이 알림만
      toast(e instanceof ApiError ? e.message : '쿠폰을 받지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`page px ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2>웰컴 쿠폰 받기</h2>
      </div>
      <div className={styles.couponCard}>
        <div>
          <strong>3,000원</strong>
          <p>
            첫 향을 위한 환영 쿠폰
            <br />3만 원 이상 주문 시 · 발급일로부터 30일 · 회원 1인 1회
          </p>
        </div>
        <button className="btn" disabled={busy || !ongoing} onClick={() => void claim()}>
          {busy ? '발급 중…' : '신규 가입 쿠폰 받기'}
        </button>
      </div>
      {issued && (
        <Modal
          title="쿠폰이 발급되었습니다."
          onClose={() => setIssued(false)}
          actions={
            <>
              <button className="btn btn-ghost" onClick={() => setIssued(false)}>
                닫기
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/mypage/coupons')}>
                쿠폰함 보기
              </button>
            </>
          }
        >
          3,000원 웰컴 쿠폰이 쿠폰함에 들어갔어요. 주문서에서 바로 사용할 수 있어요.
        </Modal>
      )}
    </section>
  );
}
