import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Commerce.module.css';

const STEPS = ['장바구니', '주문서 작성', '결제'];

interface Props {
  crumbs: { label: string; to?: string }[];
  eyebrow: string;
  title: string;
  /** 1~3: 주문 단계 표시, 0이면 숨김 */
  step?: number;
  notice?: ReactNode;
}

/** 장바구니 · 주문서 상단 공통 영역 (브레드크럼 + 제목 + 주문 단계) */
export default function OrderIntro({ crumbs, eyebrow, title, step = 0, notice }: Props) {
  return (
    <section className={`page px ${styles.intro}`}>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link to="/">홈</Link>
        {crumbs.map((c) => (
          <span key={c.label} style={{ display: 'contents' }}>
            <span>/</span>
            {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className={styles.introRow}>
        <div className={styles.introCopy}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {step > 0 && (
          <ol className={styles.steps} aria-label="주문 단계">
            {STEPS.map((label, i) => (
              <li key={label} className={i + 1 === step ? styles.current : undefined} aria-current={i + 1 === step ? 'step' : undefined}>
                <span className="latin">0{i + 1}</span> {label}
              </li>
            ))}
          </ol>
        )}
      </div>
      {notice && <p className={styles.notice}>{notice}</p>}
    </section>
  );
}
