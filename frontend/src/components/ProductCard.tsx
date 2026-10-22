import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductSummary } from '../api/types';
import { formatPrice } from '../lib/format';
import { useShop } from '../shop/ShopContext';
import styles from './ProductCard.module.css';

interface Props {
  product: ProductSummary;
  /** home: 메인 페이지 카드(스튜디오 컷 + 배지), list: 카테고리 목록 카드 */
  variant?: 'home' | 'list';
  badge?: string;
}

export default function ProductCard({ product, variant = 'list', badge }: Props) {
  const { wished, toggleWish } = useShop();
  const saved = wished(product.id);
  const image = variant === 'home' ? product.thumbnailUrl : product.imageUrl;

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <Link to={`/products/${product.id}`} className={styles.imageWrap} aria-label={`${product.name} 상세 보기`}>
        <img src={image} alt={`${product.name} ${product.typeLabel}`} loading="lazy" />
        {badge && <span className={styles.badge}>{badge}</span>}
        {product.soldOut && <span className={styles.soldOut}>SOLD OUT</span>}
      </Link>
      <button
        className={styles.save}
        aria-pressed={saved}
        aria-label={saved ? '저장 취소' : '향 저장하기'}
        onClick={() => void toggleWish(product.id)}
      >
        <Heart size={variant === 'home' ? 19 : 20} strokeWidth={1.4} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <Link to={`/products/${product.id}`} className={styles.details}>
        <div className={styles.meta}>
          <span>{product.typeLabel}</span>
          <span className="latin">{product.volume}</span>
        </div>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.subtitle}>{product.subtitle}</p>
        <p className={styles.price}>{formatPrice(product.price)}</p>
      </Link>
    </article>
  );
}
