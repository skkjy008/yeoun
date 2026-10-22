import { Link } from 'react-router-dom';
import type { OrderSummary } from '../../api/types';
import { formatDate, formatPrice } from '../../lib/format';
import styles from './MyPage.module.css';

export default function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <article className={styles.order}>
      <div className={styles.orderHead}>
        <span>
          주문 {formatDate(order.createdAt)}
          <span className="latin">{order.orderNumber}</span>
        </span>
        <span className={order.status === 'CANCELLED' ? styles.orderStatusCancelled : styles.orderStatus}>
          {order.statusLabel}
        </span>
      </div>
      {order.items.map((item) => (
        <div key={item.productId} className={styles.orderItem}>
          <img src={item.imageUrl} alt="" />
          <div>
            <p>{item.name}</p>
            <p>
              {item.typeLabel} · {item.volume} / {item.quantity}개
            </p>
          </div>
          <span>{formatPrice(item.lineAmount)}</span>
        </div>
      ))}
      <div className={styles.orderFoot}>
        <div className={styles.orderLinks}>
          <Link to={`/mypage/orders/${order.id}`}>주문 상세 ↗</Link>
        </div>
        <span>
          총 {order.totalQuantity}개 · <span className={styles.orderTotal}>{formatPrice(order.totalAmount)}</span>
        </span>
      </div>
    </article>
  );
}
