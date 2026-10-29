import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../lib/format';
import dropdown from './Dropdown.module.css';
import styles from './PriceRange.module.css';

export const PRICE_MIN = 0;
export const PRICE_MAX = 100_000;
const STEP = 1_000;

const PRESETS: { label: string; range: [number, number] }[] = [
  { label: '3만원 이하', range: [0, 30_000] },
  { label: '3만~5만원', range: [30_000, 50_000] },
  { label: '5만원 이상', range: [50_000, PRICE_MAX] },
];

/** "10000-15000" → [10000, 15000]. 끝값이 비어 있으면 최솟값/최댓값 */
export function parsePriceParam(value: string): [number, number] | null {
  if (!value) return null;
  const [min, max] = value.split('-');
  return [min ? Number(min) : PRICE_MIN, max ? Number(max) : PRICE_MAX];
}

export function priceLabel(value: string) {
  const range = parsePriceParam(value);
  if (!range) return '전체';
  const [min, max] = range;
  if (max >= PRICE_MAX) return `${formatPrice(min)} 이상`;
  if (min <= PRICE_MIN) return `${formatPrice(max)} 이하`;
  return `${formatPrice(min)} ~ ${formatPrice(max)}`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** 가격대 필터: 두 손잡이를 끌어 최소·최대 가격을 정하는 슬라이더 (1,000원 단위) */
export default function PriceRange({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<[number, number]>(parsePriceParam(value) ?? [PRICE_MIN, PRICE_MAX]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRange(parsePriceParam(value) ?? [PRICE_MIN, PRICE_MAX]);
  }, [value, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const [min, max] = range;
  const left = ((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const right = 100 - ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const apply = (next: [number, number]) => {
    const [a, b] = next;
    const isAll = a <= PRICE_MIN && b >= PRICE_MAX;
    // 최댓값 끝까지 끌면 "이상"으로, 최솟값 끝이면 "이하"로 보냅니다.
    onChange(isAll ? '' : `${a}-${b >= PRICE_MAX ? '' : b}`);
    setOpen(false);
  };

  return (
    <div className={dropdown.wrap} ref={ref}>
      <button type="button" className={dropdown.control} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>가격 · {priceLabel(value)}</span>
        <ChevronDown size={14} strokeWidth={1.5} className={open ? dropdown.flip : ''} />
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="가격대 선택">
          <p className={styles.value}>
            <strong>{formatPrice(min)}</strong> ~ <strong>{max >= PRICE_MAX ? `${formatPrice(PRICE_MAX)} 이상` : formatPrice(max)}</strong>
          </p>
          <div className={styles.slider}>
            <div className={styles.track} />
            <div className={styles.fill} style={{ left: `${left}%`, right: `${right}%` }} />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={min}
              aria-label="최소 가격"
              onChange={(e) => setRange([Math.min(Number(e.target.value), max - STEP), max])}
              style={{ zIndex: min > PRICE_MAX - STEP * 5 ? 5 : 3 }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={STEP}
              value={max}
              aria-label="최대 가격"
              onChange={(e) => setRange([min, Math.max(Number(e.target.value), min + STEP)])}
              style={{ zIndex: 4 }}
            />
          </div>
          <div className={styles.scale} aria-hidden>
            <span>0원</span>
            <span>5만원</span>
            <span>10만원+</span>
          </div>
          <div className={styles.presets}>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setRange(p.range)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={() => apply([PRICE_MIN, PRICE_MAX])}>
              초기화
            </button>
            <button type="button" className="btn btn-primary" onClick={() => apply(range)}>
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
