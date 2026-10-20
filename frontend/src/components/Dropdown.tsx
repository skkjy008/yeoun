import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  bare?: boolean;
}

/** Figma 필터 컨트롤 스타일의 드롭다운 ("향의 느낌 · 전체") */
export default function Dropdown({ label, value, options, onChange, bare }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.control} ${bare ? styles.bare : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label ? `${label} · ${current?.label ?? ''}` : current?.label}</span>
        <ChevronDown size={14} strokeWidth={1.5} className={open ? styles.flip : ''} />
      </button>
      {open && (
        <ul className={styles.menu} role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={o.value === value ? styles.selected : ''}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
