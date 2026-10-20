import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

/** 메인·목록 페이지용 큰 푸터 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`page px ${styles.inner}`}>
        <div className={styles.info}>
          <div className={styles.brandStory}>
            <p className={styles.wordmark}>YEOUN</p>
            <p className={styles.muted}>
              향이 지나간 자리, 오래 남는 여운.
              <br />
              일상에 스며드는 향의 순간을 만듭니다.
            </p>
          </div>
          <div className={styles.care}>
            <p className={styles.label}>CUSTOMER CARE</p>
            <p className={styles.mail}>hello@yeoun.example</p>
            <p className={styles.small}>
              평일 10:00–17:00 · 점심 12:00–13:00
              <br />
              주말 및 공휴일 휴무
            </p>
          </div>
          <ul className={styles.help}>
            <li>쇼핑 가이드</li>
            <li>배송 및 교환·반품</li>
            <li>자주 묻는 질문</li>
            <li>문의하기</li>
          </ul>
          <ul className={styles.social}>
            <li>ABOUT YEOUN</li>
            <li>INSTAGRAM ↗</li>
            <li>KAKAO TALK ↗</li>
          </ul>
        </div>
        <div className={styles.legal}>
          <div>
            <p>여운 / YEOUN은 가상 브랜드입니다. 모든 상품·후기·행사는 디자인을 위한 컨셉 콘텐츠입니다.</p>
            <p className="latin">© 2026 YEOUN. A FICTIONAL FRAGRANCE STUDIO.</p>
          </div>
          <p>이용약관 개인정보처리방침</p>
        </div>
      </div>
    </footer>
  );
}

/** 상세·회원가입 페이지용 간결한 푸터 */
export function CompactFooter() {
  return (
    <footer className={styles.compact}>
      <div className={`page px`}>
        <div className={styles.compactInfo}>
          <div className={styles.compactBrand}>
            <Link to="/" className="serif">
              여운
            </Link>
            <p>일상에 스며들어, 당신의 장면으로 남는 향.</p>
          </div>
          <div className={styles.compactLinks}>
            <p>고객 안내　　자주 묻는 질문</p>
            <p>이용약관　　개인정보처리방침</p>
          </div>
          <div className={styles.compactLinks}>
            <p>INSTAGRAM ↗</p>
            <p>YEOUN SCENT JOURNAL ↗</p>
          </div>
        </div>
        <div className={styles.compactLegal}>
          <p>
            여운은 포트폴리오를 위한 가상 향 브랜드입니다. 상품·회원·혜택·주문 정보는 디자인 예시이며 실제 판매 및
            서비스는 제공하지 않습니다.
          </p>
          <p className="latin">© YEOUN. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}

/** 나만의 향 찾기 여정용 한 줄 푸터 */
export function JourneyFooter() {
  return (
    <footer className={styles.journey}>
      <div className="page px">
        <p className="serif">향이 지나간 자리, 오래 남는 여운.</p>
        <p className="latin">© 2026 YEOUN. A FICTIONAL FRAGRANCE STUDIO.</p>
      </div>
    </footer>
  );
}
