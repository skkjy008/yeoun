import { Bell, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/endpoints';
import type { NotificationItem } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/format';
import { subscribeNotifications } from '../../lib/notificationStream';
import { useShop } from '../../shop/ShopContext';
import { useToast } from '../Toast';
import styles from './Header.module.css';

const NAV = [
  { to: '/shop/diffuser', label: '방향제' },
  { to: '/shop/incense', label: '인센스' },
  { to: '/shop/perfume', label: '향수' },
  { to: '/shop/candle', label: '캔들' },
  { to: '/theme', label: '테마' },
  { to: '/custom', label: '커스텀' },
  { to: '/scent-finder', label: '나만의 향 찾기', memberOnly: true },
];

export default function Header() {
  const { member, logout, requireMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { cartCount } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const accountRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setNoticeOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!member) {
      setUnread(0);
      return;
    }
    notificationApi.unreadCount().then((r) => setUnread(r.count)).catch(() => setUnread(0));
  }, [member, location.pathname]);

  // 실시간 알림: 커미션 의뢰·제안·주문 상태가 바뀌면 바로 배지와 토스트로 알려 줍니다.
  useEffect(() => {
    if (!member) return undefined;
    return subscribeNotifications({
      onConnected: (count) => setUnread(count),
      onNotification: (item) => {
        setUnread((n) => n + 1);
        setNotifications((list) => [item, ...list.filter((n) => n.id !== item.id)]);
        toast(item.message);
      },
    });
  }, [member, toast]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
      if (noticeRef.current && !noticeRef.current.contains(e.target as Node)) setNoticeOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openNotices = async () => {
    const next = !noticeOpen;
    setNoticeOpen(next);
    if (next) {
      try {
        setNotifications(await notificationApi.list());
      } catch {
        setNotifications([]);
      }
    }
  };

  const readNotice = async (item: NotificationItem) => {
    if (!item.read) {
      await notificationApi.read(item.id).catch(() => undefined);
      setUnread((n) => Math.max(0, n - 1));
    }
    setNoticeOpen(false);
    if (item.link) navigate(item.link);
  };

  const onUserClick = () => {
    if (!member) {
      navigate('/login');
      return;
    }
    setAccountOpen((v) => !v);
  };

  return (
    <header className={styles.header}>
      <div className={styles.announcement}>
        <Link to="/signup">첫 만남을 위한 작은 선물, 신규 가입 시 3,000원 웰컴 쿠폰 →</Link>
      </div>
      <div className={`${styles.nav} px`}>
        <button className={styles.menuButton} onClick={() => setMenuOpen((v) => !v)} aria-label="메뉴 열기">
          {menuOpen ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
        </button>

        <Link to="/" className={styles.brand} aria-label="여운 홈">
          <span className={styles.brandKo}>여운</span>
          <span className={styles.brandEn}>YEOUN</span>
        </Link>

        <nav className={`${styles.categories} ${menuOpen ? styles.open : ''}`} aria-label="주요 메뉴">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={(e) => {
                if (item.memberOnly && !member) {
                  e.preventDefault();
                  requireMember('나만의 향 찾기는 회원만 이용할 수 있어요.');
                }
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.utility}>
          <button aria-label="검색" onClick={() => navigate('/search')}>
            <Search size={21} strokeWidth={1.4} />
          </button>

          {member && (
            <div className={styles.dropdownWrap} ref={noticeRef}>
              <button aria-label={`알림 ${unread}개`} onClick={openNotices} className={styles.iconWithBadge}>
                <Bell size={20} strokeWidth={1.4} />
                {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
              {noticeOpen && (
                <div className={`${styles.dropdown} ${styles.noticePanel}`}>
                  <div className={styles.dropdownHead}>
                    <span>알림</span>
                    {unread > 0 && (
                      <button
                        onClick={async () => {
                          await notificationApi.readAll().catch(() => undefined);
                          setUnread(0);
                          setNotifications((list) => list.map((n) => ({ ...n, read: true })));
                        }}
                      >
                        모두 읽음
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className={styles.empty}>새로운 알림이 없어요.</p>
                  ) : (
                    notifications.map((n) => (
                      <button key={n.id} className={`${styles.noticeItem} ${n.read ? '' : styles.unread}`} onClick={() => readNotice(n)}>
                        <span>{n.message}</span>
                        <span className={styles.noticeDate}>{formatDate(n.createdAt)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className={styles.dropdownWrap} ref={accountRef}>
            <button aria-label={member ? '내 계정' : '로그인'} onClick={onUserClick}>
              <UserRound size={21} strokeWidth={1.4} />
            </button>
            {accountOpen && member && (
              <div className={styles.dropdown}>
                <p className={styles.accountName}>
                  {member.name} 님 <span>{member.gradeLabel}</span>
                </p>
                <Link to="/mypage">마이페이지</Link>
                <Link to="/mypage/orders">주문 / 배송 조회</Link>
                <Link to="/custom?tab=mine">나의 커미션</Link>
                {member.role === 'ADMIN' && <Link to="/admin">관리자 페이지</Link>}
                <button onClick={logout}>로그아웃</button>
              </div>
            )}
          </div>

          <button
            aria-label={`장바구니 ${cartCount}개`}
            onClick={() => {
              if (requireMember('장바구니는 회원만 이용할 수 있어요.')) navigate('/cart');
            }}
          >
            <ShoppingBag size={21} strokeWidth={1.4} />
          </button>
          <span className={styles.count}>{cartCount}</span>
        </div>
      </div>
    </header>
  );
}
