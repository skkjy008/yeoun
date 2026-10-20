import { ChevronDown } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { CompactFooter } from '../../components/layout/Footer';
import { useToast } from '../../components/Toast';
import styles from './AuthPages.module.css';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const PHONE_RULE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

interface LocationState {
  from?: string;
  reason?: string;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const state = (useLocation().state ?? {}) as LocationState;

  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' });
  const [consent, setConsent] = useState({ terms: false, privacy: false, marketing: false });
  const [isPerfumer, setIsPerfumer] = useState<boolean | null>(null);
  const [perfumer, setPerfumer] = useState({ studioName: '', careerYears: '', certification: '', portfolioUrl: '', introduction: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const allAgreed = consent.terms && consent.privacy && consent.marketing;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const setP = (key: keyof typeof perfumer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPerfumer((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = '이메일 형식이 올바르지 않습니다.';
    if (!PASSWORD_RULE.test(form.password)) next.password = '영문·숫자·특수문자를 조합해 8자 이상 입력해 주세요.';
    if (form.password !== form.passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.name.trim()) next.name = '이름을 입력해 주세요.';
    if (!PHONE_RULE.test(form.phone)) next.phone = '휴대전화 번호 형식이 올바르지 않습니다.';
    if (isPerfumer === null) next.perfumer = '회원 유형을 선택해 주세요.';
    if (isPerfumer && !perfumer.introduction.trim()) next.introduction = '조향사 소개를 입력해 주세요.';
    if (isPerfumer && (perfumer.careerYears === '' || Number(perfumer.careerYears) < 0))
      next.careerYears = '경력을 숫자로 입력해 주세요.';
    if (!consent.terms || !consent.privacy) next.consent = '필수 약관에 동의해 주세요.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast('입력한 내용을 다시 확인해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const member = await signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim(),
        termsAgreed: consent.terms,
        privacyAgreed: consent.privacy,
        marketingAgreed: consent.marketing,
        perfumer: !!isPerfumer,
        perfumerApplication: isPerfumer
          ? {
              studioName: perfumer.studioName.trim(),
              careerYears: Number(perfumer.careerYears),
              certification: perfumer.certification.trim(),
              portfolioUrl: perfumer.portfolioUrl.trim(),
              introduction: perfumer.introduction.trim(),
            }
          : null,
      });
      toast(
        member.perfumerStatus === 'PENDING'
          ? `${member.name} 님, 환영해요. 조향사 인증 요청을 운영자에게 보냈어요.`
          : `${member.name} 님, 여운에 오신 것을 환영해요.`,
      );
      navigate(state.from && state.from !== '/signup' ? state.from : '/', { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '회원가입을 완료하지 못했어요.');
      if (err instanceof ApiError && err.status === 409) setErrors((prev) => ({ ...prev, email: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className={`page px ${styles.introduction}`}>
        <nav className={styles.breadcrumb} aria-label="현재 위치">
          <Link to="/">홈</Link>
          <span>/</span>
          <span>회원가입</span>
        </nav>
        <div className={styles.pageHeading}>
          <div>
            <p className="eyebrow">BECOME A PART OF YEOUN</p>
            <h1 className="serif">여운에 오신 것을 환영합니다</h1>
          </div>
          <p className={styles.headingNote}>당신의 취향이 시작되는 곳</p>
        </div>
        {state.reason && <p className={styles.reason}>{state.reason} 가입 후 바로 이어서 이용할 수 있어요.</p>}
      </section>

      <section className={`page px ${styles.layout}`}>
        <aside className={styles.editorial}>
          <img src="/images/common/signup.jpg" alt="편지와 말린 꽃이 놓인 나무 테이블" />
          <div className={styles.invitation}>
            <h2 className="serif">
              좋아하는 향을 모으고,
              <br />
              나만의 장면을 이어가세요.
            </h2>
            <p>마음에 남은 향과 주문 내역을 한곳에서 살펴보세요. 작은 취향이 쌓여 당신만의 여운이 됩니다.</p>
          </div>
          <ol className={styles.benefits}>
            <Benefit no="01" title="향과 함께하는 첫 만남" desc="신규 가입 웰컴 쿠폰 3,000원 · 혜택 예시" />
            <Benefit no="02" title="취향을 따라 쌓이는 여운" desc="브론즈부터 다이아까지, 나의 회원등급 확인" />
            <Benefit no="03" title="나에게 도착하는 향의 편지" desc="선택 동의 시 새로운 향과 큐레이션 소식" />
          </ol>
          <p className="help">가상 브랜드의 회원가입 화면입니다. 쿠폰·등급은 디자인 예시이며 실제 혜택 지급은 이루어지지 않습니다.</p>
        </aside>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.formHeading}>
            <h2 className="serif">기본 정보</h2>
            <span className="help">* 필수 입력</span>
          </div>

          <Field label="이메일 *" error={errors.email} help="로그인과 주문 안내에 사용할 이메일을 입력해 주세요.">
            <input className="input" type="email" autoComplete="email" placeholder="yeoun@example.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="비밀번호 *" error={errors.password} help="영문·숫자·특수문자 조합 8자 이상">
            <input className="input" type="password" autoComplete="new-password" placeholder="••••••••••••" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="비밀번호 확인 *" error={errors.passwordConfirm}>
            <input className="input" type="password" autoComplete="new-password" placeholder="••••••••••••" value={form.passwordConfirm} onChange={set('passwordConfirm')} />
          </Field>
          <Field label="이름 *" error={errors.name}>
            <input className="input" autoComplete="name" placeholder="김여운" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="휴대전화 *" error={errors.phone} help="주문·배송 안내용 연락처입니다.">
            <input className="input" type="tel" autoComplete="tel" placeholder="010-0000-0000" value={form.phone} onChange={set('phone')} />
          </Field>

          {/* 조향사 여부를 묻는 단계 — 조향사를 선택하면 인증 아코디언 폼이 열립니다. */}
          <div className={styles.section}>
            <h2 className="serif">조향사이신가요?</h2>
            <p className="help">조향사로 가입하면 운영자 승인 후 커미션 의뢰를 받을 수 있어요. 승인 전까지는 일반 회원으로 이용할 수 있습니다.</p>
            <div className={styles.memberTypes} role="radiogroup" aria-label="회원 유형">
              <button type="button" role="radio" aria-checked={isPerfumer === false} className={isPerfumer === false ? styles.typeOn : ''} onClick={() => setIsPerfumer(false)}>
                <span className={styles.typeTitle}>향을 찾는 사람</span>
                <span className="help">일반 회원으로 가입할게요</span>
              </button>
              <button type="button" role="radio" aria-checked={isPerfumer === true} className={isPerfumer === true ? styles.typeOn : ''} onClick={() => setIsPerfumer(true)}>
                <span className={styles.typeTitle}>향을 만드는 사람</span>
                <span className="help">조향사 인증을 함께 신청할게요</span>
              </button>
            </div>
            {errors.perfumer && <p className="error-text">{errors.perfumer}</p>}

            <div className={`${styles.accordion} ${isPerfumer ? styles.accordionOpen : ''}`} aria-hidden={!isPerfumer}>
              <div className={styles.accordionInner}>
                <div className={styles.accordionHead}>
                  <span>조향사 인증 정보</span>
                  <ChevronDown size={16} strokeWidth={1.5} />
                </div>
                <Field label="공방 / 스튜디오명">
                  <input className="input" placeholder="아틀리에 여운" value={perfumer.studioName} onChange={setP('studioName')} tabIndex={isPerfumer ? 0 : -1} />
                </Field>
                <Field label="조향 경력 (년) *" error={errors.careerYears}>
                  <input className="input" type="number" min={0} max={60} placeholder="3" value={perfumer.careerYears} onChange={setP('careerYears')} tabIndex={isPerfumer ? 0 : -1} />
                </Field>
                <Field label="자격증 · 수료 과정">
                  <input className="input" placeholder="조향사 자격증, 향료 아카데미 수료 등" value={perfumer.certification} onChange={setP('certification')} tabIndex={isPerfumer ? 0 : -1} />
                </Field>
                <Field label="포트폴리오 링크">
                  <input className="input" type="url" placeholder="https://" value={perfumer.portfolioUrl} onChange={setP('portfolioUrl')} tabIndex={isPerfumer ? 0 : -1} />
                </Field>
                <Field label="조향사 소개 *" error={errors.introduction} help="주로 만드는 향, 작업 방식, 커미션 가능 범위를 적어주세요.">
                  <textarea className="input" rows={4} maxLength={1000} value={perfumer.introduction} onChange={setP('introduction')} tabIndex={isPerfumer ? 0 : -1} />
                </Field>
                <p className={styles.notice}>가입과 동시에 운영자에게 인증 요청 알림이 발송되며, 승인 결과는 알림으로 알려드려요.</p>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className="serif">약관 동의</h2>
            <Check
              checked={allAgreed}
              onChange={(v) => setConsent({ terms: v, privacy: v, marketing: v })}
              title="모두 동의합니다"
              desc="선택 항목을 포함합니다. 선택 동의 없이도 가입할 수 있어요."
            />
            <div className={styles.consentList}>
              <Check checked={consent.terms} onChange={(v) => setConsent((c) => ({ ...c, terms: v }))} title="[필수] 이용약관 동의" link />
              <Check
                checked={consent.privacy}
                onChange={(v) => setConsent((c) => ({ ...c, privacy: v }))}
                title="[필수] 개인정보 수집 및 이용 동의"
                desc="수집: 이메일·이름·휴대전화 / 목적: 계정 관리·주문 안내"
                link
              />
              <Check
                checked={consent.marketing}
                onChange={(v) => setConsent((c) => ({ ...c, marketing: v }))}
                title="[선택] 이메일·문자 마케팅 수신 동의"
                desc="신제품과 향의 소식을 받아봅니다. 언제든 철회할 수 있어요."
              />
            </div>
            {errors.consent && <p className="error-text">{errors.consent}</p>}
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? '가입하는 중…' : '여운 회원가입'}
          </button>
          <p className={styles.loginEntry}>
            이미 여운의 회원이신가요?{' '}
            <Link to="/login" state={state}>
              로그인
            </Link>
          </p>
        </form>
      </section>
      <CompactFooter />
    </>
  );
}

function Benefit({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <li>
      <span className="latin">{no}</span>
      <div>
        <p>{title}</p>
        <p className="help">{desc}</p>
      </div>
    </li>
  );
}

export function Field({ label, error, help, children }: { label: string; error?: string; help?: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="error-text">{error}</span> : help ? <span className="help">{help}</span> : null}
    </label>
  );
}

function Check({ checked, onChange, title, desc, link }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc?: string; link?: boolean }) {
  return (
    <div className={styles.check}>
      <label>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.box} aria-hidden="true">
          {checked && '✓'}
        </span>
        <span className={styles.checkText}>
          <span>{title}</span>
          {desc && <span className="help">{desc}</span>}
        </span>
      </label>
      {link && <span className="help">보기 ↗</span>}
    </div>
  );
}
