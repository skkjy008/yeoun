import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { lines } from '../../lib/format';
import styles from './HeroCarousel.module.css';

const AUTOPLAY_MS = 7000;

export default function HeroCarousel({ slides }: { slides: Post[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const { requireMember } = useAuth();
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) {
    return <section className={`${styles.hero} skeleton`} aria-busy="true" />;
  }

  const onCta = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('/scent-finder') && !requireMember('나만의 향 찾기는 회원만 이용할 수 있어요.')) return;
    navigate(link);
  };

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="여운 추천 테마"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const titleLines = lines(slide.title);
        return (
          <div
            key={slide.id}
            className={`${styles.slide} ${i === index ? styles.current : ''}`}
            aria-hidden={i !== index}
            role="group"
            aria-label={`${i + 1} / ${count}`}
          >
            <div className={styles.story}>
              <p className="eyebrow">{slide.eyebrow}</p>
              <h1 className={`${styles.title} ${titleLines.length > 2 ? styles.large : ''}`}>
                {titleLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              <p className={styles.body}>
                {lines(slide.body).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
              {slide.ctaLabel && (
                <button className="btn btn-primary" tabIndex={i === index ? 0 : -1} onClick={() => onCta(slide.ctaLink)}>
                  {slide.ctaLabel}
                  <ArrowUpRight size={17} strokeWidth={1.5} />
                </button>
              )}
              {slide.footnote && <p className={styles.footnote}>{slide.footnote}</p>}
            </div>
            <div className={styles.photo}>
              {slide.imageUrl && <img src={slide.imageUrl} alt="" loading={i === 0 ? 'eager' : 'lazy'} />}
              {slide.caption && <span className={styles.caption}>{slide.caption}</span>}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.prev}`} onClick={() => go(index - 1)} aria-label="이전 슬라이드">
            <ChevronLeft size={64} strokeWidth={0.9} />
          </button>
          <button className={`${styles.arrow} ${styles.next}`} onClick={() => go(index + 1)} aria-label="다음 슬라이드">
            <ChevronRight size={64} strokeWidth={0.9} />
          </button>
          <div className={styles.status} role="tablist" aria-label="슬라이드 선택">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}번째 슬라이드`}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
