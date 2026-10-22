import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { memberApi } from '../../api/endpoints';
import type { MyPageSummary } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import OrderIntro from '../order/OrderIntro';
import styles from './MyPage.module.css';

const LINKS = [
  { to: '/mypage', label: '마이페이지 홈', end: true },
  { to: '/mypage/orders', label: '주문 / 배송 조회' },
  { to: '/mypage/coupons', label: '쿠폰 / 적립금' },
  { to: '/mypage/wishlist', label: '찜한 향' },
  { to: '/mypage/commissions', label: '나의 커미션' },
  { to: '/mypage/reviews', label: '나의 의견' },
  { to: '/mypage/profile', label: '회원정보 수정' },
  { to: '/mypage/address', label: '배송지 관리' },
];

export interface MyPageContext {
  summary: MyPageSummary | null;
  reload: () => Promise<void>;
}

export const useMyPage = () => useOutletContext<MyPageContext>();

export default function MyPageLayout() {
  const { member, logout } = useAuth();
  const [summary, setSummary] = useState<MyPageSummary | null>(null);

  const reload = useCallback(async () => {
    try {
      setSummary(await memberApi.summary());
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!member) return null;

  return (
    <>
      <OrderIntro crumbs={[{ label: '마이페이지' }]} eyebrow="MY YEOUN" title="취향이 쌓이는 나의 공간" />
      <div className={`page px ${styles.layout}`}>
        <aside className={styles.nav}>
          <div className={styles.greeting}>
            <strong>{member.name} 님</strong>
            <span>반가워요, 오늘의 향은 어떤가요?</span>
          </div>
          <nav className={styles.links} aria-label="마이페이지 메뉴">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button className={styles.logout} onClick={logout}>
            로그아웃 ↗
          </button>
        </aside>
        <div className={styles.content}>
          <Outlet context={{ summary, reload } satisfies MyPageContext} />
        </div>
      </div>
      <CompactFooter />
    </>
  );
}
