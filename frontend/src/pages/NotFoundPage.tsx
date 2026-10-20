import { Link } from 'react-router-dom';
import styles from './SimplePages.module.css';

export default function NotFoundPage() {
  return (
    <section className={`page px ${styles.center}`}>
      <p className="eyebrow">404 — LOST SCENT</p>
      <h1 className="serif">찾으시는 향이 이곳에는 없어요.</h1>
      <p>주소가 바뀌었거나, 잠시 판매를 쉬고 있는 향일 수 있어요.</p>
      <Link to="/" className="btn btn-primary">
        메인으로 돌아가기
      </Link>
    </section>
  );
}
