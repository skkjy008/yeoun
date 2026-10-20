import { Link } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import styles from './SimplePages.module.css';

const COPY: Record<string, { eyebrow: string; title: string; body: string; image: string }> = {
  theme: {
    eyebrow: 'THEME — SEASON & MOMENT',
    title: '계절과 기념일에 어울리는 향을 준비하고 있어요.',
    body: '할로윈, 가을, 첫눈 오는 날처럼 그때그때의 테마에 맞춘 큐레이션 페이지가 곧 열립니다. 지금은 메인 배너에서 먼저 만나보세요.',
    image: '/images/hero/hero-3.jpg',
  },
  custom: {
    eyebrow: 'BESPOKE — COMMISSION A PERFUMER',
    title: '원하는 향을 묘사하면, 조향사가 만들어 드려요.',
    body: '커미션 의뢰 게시판과 조향사 매칭, 선결제·후기 기능은 다음 단계에서 열립니다. 의뢰가 등록되면 인증된 조향사에게 알림이 발송됩니다.',
    image: '/images/common/atelier.jpg',
  },
};

export default function ComingSoonPage({ kind }: { kind: 'theme' | 'custom' }) {
  const copy = COPY[kind];
  return (
    <>
      <section className={`page px ${styles.soon}`}>
        <div className={styles.soonCopy}>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="serif">{copy.title}</h1>
          <p>{copy.body}</p>
          <div className={styles.soonActions}>
            <Link to="/" className="btn btn-primary">
              메인으로
            </Link>
            <Link to="/search" className="btn btn-ghost">
              전체 향 둘러보기
            </Link>
          </div>
        </div>
        <img src={copy.image} alt="" className={styles.soonImage} />
      </section>
      <Footer />
    </>
  );
}
