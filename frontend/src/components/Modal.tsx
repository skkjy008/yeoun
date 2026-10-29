import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface Props {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}

/** 가운데 뜨는 작은 안내 모달 (Esc·바깥 클릭으로 닫힘) */
export default function Modal({ title, children, actions, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className={styles.close} aria-label="닫기" onClick={onClose}>
          <X size={18} strokeWidth={1.5} />
        </button>
        <h2 id="modal-title" className={styles.title}>
          {title}
        </h2>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
