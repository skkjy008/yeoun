import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../../api/endpoints';
import type { Review } from '../../api/types';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import styles from './MyPage.module.css';

export default function MyReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    reviewApi.mine().then(setReviews).catch(() => setReviews([]));
  }, []);

  const remove = async (id: number) => {
    if (!window.confirm('이 의견을 지울까요?')) return;
    try {
      await reviewApi.remove(id);
      setReviews((list) => list?.filter((r) => r.id !== id) ?? null);
    } catch {
      toast('의견을 지우지 못했어요.');
    }
  };

  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h2>나의 의견</h2>
        <span>{reviews ? `${reviews.length}개` : ''}</span>
      </div>
      {!reviews && <div className="skeleton" style={{ height: 200 }} />}
      {reviews && reviews.length === 0 && <div className={styles.empty}>상품 상세 페이지 아래에서 향에 대한 의견을 남길 수 있어요.</div>}
      <div>
        {reviews?.map((r) => (
          <article key={r.id} className={styles.reviewItem}>
            <Link to={`/products/${r.productId}#comments`}>{r.productName}</Link>
            <span className={styles.stars} aria-label={`별점 ${r.rating}점`}>
              {'★'.repeat(r.rating)}
              {'☆'.repeat(5 - r.rating)}
            </span>
            <p>{r.content}</p>
            <span className="help">{formatDate(r.createdAt)}</span>
            <button className="help" onClick={() => remove(r.id)}>
              삭제
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
