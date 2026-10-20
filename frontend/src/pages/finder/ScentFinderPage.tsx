import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { preferenceApi } from '../../api/endpoints';
import type { QuizQuestion, Recommendation } from '../../api/types';
import { JourneyFooter } from '../../components/layout/Footer';
import ProductCard from '../../components/ProductCard';
import { useToast } from '../../components/Toast';
import styles from './ScentFinderPage.module.css';

export default function ScentFinderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Recommendation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    preferenceApi.questions().then(setQuestions).catch(() => toast('질문을 불러오지 못했어요.'));
  }, [toast]);

  const question = questions[step];
  const selected = question ? answers[question.questionNo] : undefined;
  const isLast = step === questions.length - 1;

  const progress = useMemo(
    () =>
      questions.map((q, i) => ({
        no: String(i + 1).padStart(2, '0'),
        label: q.stepLabel,
        state: i === step && !result ? 'current' : answers[q.questionNo] ? 'done' : 'todo',
      })),
    [questions, step, answers, result],
  );

  const next = async () => {
    if (!question || selected === undefined) {
      toast('가장 끌리는 답변 1개를 선택해 주세요.');
      return;
    }
    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ questionNo: q.questionNo, optionNo: answers[q.questionNo] }));
      setResult(await preferenceApi.submit(payload));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '결과를 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setStep(0);
  };

  return (
    <>
      <section className={`page px ${styles.discovery}`}>
        <nav className={styles.breadcrumb} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span className="latin">/</span>
          <span className={styles.here}>나만의 향 찾기</span>
        </nav>

        <div className={styles.intro}>
          <div className={styles.identity}>
            <h1 className="serif">나만의 향 찾기</h1>
            <span className={styles.divider} />
            <span className="eyebrow">YOUR SCENT, YOUR STORY</span>
          </div>
          <p className={styles.introCopy}>여섯 번의 선택, 나에게 가까워지는 향</p>
        </div>

        <ol className={styles.progress}>
          {progress.map((p, i) => (
            <li key={p.no} className={styles[p.state]}>
              <button
                type="button"
                disabled={!!result || (p.state === 'todo' && i > step)}
                onClick={() => setStep(i)}
                aria-current={p.state === 'current' ? 'step' : undefined}
              >
                <span className={styles.rule} />
                <span className={styles.stepLabel}>
                  <span className="latin">{p.no}</span>
                  <span>{p.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {result ? (
          <ResultView result={result} onRestart={restart} onHome={() => navigate('/')} />
        ) : question ? (
          <>
            <div className={styles.heading}>
              <div className={styles.meta}>
                <span className="latin">
                  QUESTION {String(step + 1).padStart(2, '0')}&nbsp;&nbsp;/&nbsp;&nbsp;{question.englishLabel}
                </span>
                <span className="latin">
                  {String(step + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                </span>
              </div>
              <h2 className="serif">{question.title}</h2>
              <div className={styles.guide}>
                <p>{question.guide}</p>
                <p>가장 끌리는 답변 1개를 선택해 주세요.</p>
              </div>
            </div>

            <div
              className={question.layout === 'GRID' ? styles.grid : styles.list}
              role="radiogroup"
              aria-label={question.title}
            >
              {question.options.map((option) => {
                const isSelected = selected === option.optionNo;
                return (
                  <button
                    key={option.optionNo}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [question.questionNo]: option.optionNo }))}
                  >
                    {option.imageUrl && <img src={option.imageUrl} alt="" loading="lazy" />}
                    <span className={styles.overlay} />
                    <span className={styles.radio} aria-hidden="true" />
                    <span className={styles.copy}>
                      <span className={styles.label}>{option.label}</span>
                      {isSelected && <span className={styles.chosen}>선택한 답변</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.navigation}>
              <button
                type="button"
                className={styles.prev}
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                ←　이전
              </button>
              <p className={styles.reassure}>정답은 없어요. 지금의 취향에 귀 기울여 보세요.</p>
              <button type="button" className={`btn btn-primary ${styles.continue}`} onClick={next} disabled={submitting}>
                <span>{isLast ? (submitting ? '향을 고르는 중…' : '나의 향 보기') : '다음 질문'}</span>
                <span className={styles.arrow}>→</span>
              </button>
            </div>
          </>
        ) : (
          <div className={`${styles.loading} skeleton`} />
        )}
      </section>
      <JourneyFooter />
    </>
  );
}

function ResultView({ result, onRestart, onHome }: { result: Recommendation; onRestart: () => void; onHome: () => void }) {
  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <p className="eyebrow">YOUR SCENT PROFILE {result.aiGenerated && '· CURATED WITH CLAUDE'}</p>
        <h2 className="serif">{result.headline}</h2>
        <p className={styles.summary}>{result.summary}</p>
        <div className={styles.keywords}>
          {result.keywords.map((k) => (
            <span key={k}>#{k}</span>
          ))}
        </div>
      </div>

      <dl className={styles.answers}>
        {result.answers.map((a) => (
          <div key={a.questionNo}>
            <dt>{a.stepLabel}</dt>
            <dd>{a.label}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.resultProducts}>
        {result.products.map((p, i) => (
          <ProductCard key={p.id} product={p} variant="home" badge={i === 0 ? 'BEST MATCH' : 'FOR YOU'} />
        ))}
      </div>

      <div className={styles.resultActions}>
        <button className="btn btn-ghost" onClick={onRestart}>
          다시 찾아보기
        </button>
        <button className="btn btn-primary" onClick={onHome}>
          메인에서 맞춤 추천 보기 →
        </button>
      </div>
    </div>
  );
}
