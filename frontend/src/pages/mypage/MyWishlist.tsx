import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../../api/endpoints';
import type { ProductSummary } from '../../api/types';
import ProductCard from '../../components/ProductCard';
import { useShop } from '../../shop/ShopContext';
import styles from './MyPage.module.css';

export default function MyWishlist() {
  const { wished } = useShop();
  const [items, setItems] = useState<ProductSummary[] | null>(null);

  useEffect(() => {
    wishlistApi.list().then(setItems).catch(() => setItems([]));
  }, []);

  // 하트를 눌러 해제한 상품은 목록에서 바로 사라지도록 합니다.
  const visible = items?.filter((p) => wished(p.id)) ?? null;

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2>찜한 향</h2>
        <span>{visible ? `${visible.length}개` : ''}</span>
      </div>
      {!visible && <div className="skeleton" style={{ height: 320 }} />}
      {visible && visible.length === 0 && (
        <div className={styles.empty}>
          마음에 드는 향의 하트를 눌러 모아 두세요.
          <Link to="/shop/perfume" className="btn btn-ghost">
            향 둘러보기
          </Link>
        </div>
      )}
      <div className={styles.grid}>
        {visible?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
