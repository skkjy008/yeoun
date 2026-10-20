import { Link } from 'react-router-dom';
import styles from './SectionHeading.module.css';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  linkLabel?: string;
  linkTo?: string;
}

export default function SectionHeading({ eyebrow, title, description, linkLabel, linkTo }: Props) {
  return (
    <div className={styles.heading}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {linkLabel && linkTo && (
        <Link to={linkTo} className={styles.link}>
          {linkLabel} ↗
        </Link>
      )}
    </div>
  );
}
