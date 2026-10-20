import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { reviewApi } from '../../api/endpoints';
import type { Review } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/format';
import styles from './ProductDetailPage.module.css';

const MAX = 500;

/** 의견 남기기 — 리뷰 테이블(별점 + 내용)과 연결됩니다. */
export default function Comments({ productId }: { productId: number }) {
  const { member, requireMember } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    reviewApi
      .byProduct(productId)
      .then((page) => setReviews(page.content))
      .catch(() => setReviews([]));
  }, [productId]);

  useEffect(load, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!requireMember('의견은 로그인 후 남길 수 있어요.')) return;
    if (!content.trim()) {
      toast('향에 대한 생각을 적어주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create(productId, { rating, content: content.trim() });
      setContent('');
      setRating(5);
      toast('의견을 남겼어요. 고마워요.');
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '의견을 등록하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await reviewApi.remove(id);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '삭제하지 못했어요.');
    }
  };

  return (
    <section id="comments" className={`page px ${styles.comments}`}>
      <div className={styles.storyHeading}>
        <p className="eyebrow">SCENT CONVERSATION</p>
        <h2 className="serif">이 향은 어떤 장면으로 남았나요?</h2>
        <p className={styles.commentsGuide}>사용감이나 떠오르는 장면을 자유롭게 남겨주세요. 별점과 함께 다른 분들의 선택에 도움이 됩니다.</p>
      </div>

      <form className={styles.composer} onSubmit={submit}>
        <div className={styles.stars} role="radiogroup" aria-label="별점">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}점`}
              className={n <= rating ? styles.starOn : ''}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={content}
          maxLength={MAX}
          rows={3}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => {
            if (!member) requireMember('의견은 로그인 후 남길 수 있어요.');
          }}
          placeholder={`향에 대한 생각을 적어주세요. (최대 ${MAX}자)`}
          aria-label="의견 내용"
        />
        <div className={styles.composerActions}>
          <span className="latin">
            {content.length} / {MAX}
            {!member && ' · 로그인 후 의견을 남길 수 있어요'}
          </span>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            등록
          </button>
        </div>
      </form>

      <ul className={styles.commentList}>
        {reviews.length === 0 && <li className={styles.noComment}>아직 남겨진 의견이 없어요. 첫 장면을 들려주세요.</li>}
        {reviews.map((r) => (
          <li key={r.id} className={styles.comment}>
            <div className={styles.commentMeta}>
              <span className={styles.commentStars}>{'★'.repeat(r.rating)}</span>
              <span className={styles.commentAuthor}>{r.authorName}</span>
              <span className="latin">{formatDate(r.createdAt)}</span>
              {member && (member.id === r.authorId || member.role === 'ADMIN') && (
                <button className={styles.commentDelete} onClick={() => remove(r.id)}>
                  삭제
                </button>
              )}
            </div>
            <p>{r.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
