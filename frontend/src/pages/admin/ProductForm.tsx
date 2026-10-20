import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { adminApi } from '../../api/endpoints';
import type { ProductDetail, ProductRequest } from '../../api/types';
import { useToast } from '../../components/Toast';
import styles from './AdminPage.module.css';

const TYPE_BY_CODE: Record<string, [string, string]> = {
  '001': ['디퓨저', '200ml'],
  '002': ['인센스', '40 sticks'],
  '003': ['오드퍼퓸', '50ml'],
  '004': ['캔들', '200g'],
};

const toLines = (list: string[]) => list.join('\n');
const fromLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function initial(p: ProductDetail | null) {
  return {
    incCd: p?.incCd ?? '001',
    name: p?.name ?? '',
    subtitle: p?.subtitle ?? '',
    englishLine: p?.englishLine ?? '',
    typeLabel: p?.typeLabel ?? '디퓨저',
    volume: p?.volume ?? '200ml',
    price: String(p?.price ?? 38000),
    stock: String(p?.stock ?? 10),
    imageUrl: p?.imageUrl ?? '/images/products/diffuser-01.jpg',
    thumbnailUrl: p?.thumbnailUrl ?? '',
    artworkUrl: p?.artworkUrl ?? '',
    scentFamily: p?.scentFamily ?? '',
    feeling: p?.feeling ?? '',
    scene: p?.scene ?? '',
    bestPlace: p?.bestPlace ?? '',
    composition: p?.composition ?? '',
    storyTitle: p?.storyTitle ?? '',
    storyBody: p?.storyBody ?? '',
    safetyNotice: p?.safetyNotice ?? '',
    playlistTitle: p?.playlistTitle ?? '',
    intensity: String(p?.intensity ?? 2),
    popularity: String(p?.popularity ?? 0),
    newArrival: p?.newArrival ?? false,
    notes: toLines((p?.notes ?? []).map((n) => `${n.name} | ${n.description ?? ''}`)),
    ritualSteps: toLines(p?.ritualSteps ?? []),
    poemLines: toLines(p?.poemLines ?? []),
    tracks: toLines((p?.tracks ?? []).map((t) => `${t.title} | ${t.artist ?? ''}${t.youtubeVideoId ? ` | ${t.youtubeVideoId}` : ''}`)),
    tags: (p?.tags ?? []).join(', '),
  };
}

export default function ProductForm({ product, onCancel, onSaved }: { product: ProductDetail | null; onCancel: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(() => initial(product));
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const onCode = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [typeLabel, volume] = TYPE_BY_CODE[e.target.value];
    setF((prev) => ({ ...prev, incCd: e.target.value, typeLabel, volume }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const blank = (v: string) => (v.trim() ? v.trim() : null);
    const body: ProductRequest = {
      incCd: f.incCd,
      name: f.name.trim(),
      subtitle: f.subtitle.trim(),
      englishLine: blank(f.englishLine),
      typeLabel: f.typeLabel.trim(),
      volume: f.volume.trim(),
      price: Number(f.price),
      stock: Number(f.stock),
      imageUrl: f.imageUrl.trim(),
      thumbnailUrl: blank(f.thumbnailUrl),
      artworkUrl: blank(f.artworkUrl),
      artworkCaption: product?.artworkCaption ?? null,
      scentFamily: blank(f.scentFamily),
      feeling: blank(f.feeling),
      scene: blank(f.scene),
      bestPlace: blank(f.bestPlace),
      composition: blank(f.composition),
      storyTitle: blank(f.storyTitle),
      storyBody: blank(f.storyBody),
      safetyNotice: blank(f.safetyNotice),
      playlistTitle: blank(f.playlistTitle),
      intensity: Number(f.intensity),
      popularity: Number(f.popularity),
      newArrival: f.newArrival,
      notes: fromLines(f.notes).map((line) => {
        const [name, description = ''] = line.split('|').map((s) => s.trim());
        return { name, description };
      }),
      ritualSteps: fromLines(f.ritualSteps),
      poemLines: fromLines(f.poemLines),
      tracks: fromLines(f.tracks).map((line) => {
        const [title, artist = '', youtubeVideoId = ''] = line.split('|').map((s) => s.trim());
        return { title, artist, youtubeVideoId: youtubeVideoId || null };
      }),
      tags: f.tags
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    };
    setSaving(true);
    try {
      if (product) await adminApi.updateProduct(product.id, body);
      else await adminApi.createProduct(body);
      toast(product ? '상품을 수정했어요.' : '상품을 등록했어요.');
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : '저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={`${styles.panel} ${styles.productForm}`} onSubmit={submit}>
      <div className={styles.toolbar}>
        <h2 className="serif">{product ? `${product.name} 수정` : '새 상품 등록'}</h2>
        <div className={styles.formActions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>

      <fieldset>
        <legend>기본 정보</legend>
        <label>
          향 종류 코드 (inc_cd)
          <select className="input" value={f.incCd} onChange={onCode}>
            <option value="001">001 · 방향제</option>
            <option value="002">002 · 인센스</option>
            <option value="003">003 · 향수</option>
            <option value="004">004 · 캔들</option>
          </select>
        </label>
        <label>
          상품명 *<input className="input" required value={f.name} onChange={set('name')} />
        </label>
        <label className={styles.wide}>
          한 줄 장면 설명 *<input className="input" required value={f.subtitle} onChange={set('subtitle')} />
        </label>
        <label>
          영문 라인<input className="input" value={f.englishLine} onChange={set('englishLine')} placeholder="AFTER THE RAIN — YEOUN" />
        </label>
        <label>
          유형 / 용량
          <span className={styles.pair}>
            <input className="input" required value={f.typeLabel} onChange={set('typeLabel')} />
            <input className="input" required value={f.volume} onChange={set('volume')} />
          </span>
        </label>
        <label>
          판매가 (원)<input className="input" type="number" min={0} required value={f.price} onChange={set('price')} />
        </label>
        <label>
          재고 (0이면 SOLD OUT)<input className="input" type="number" min={0} required value={f.stock} onChange={set('stock')} />
        </label>
        <label>
          무게감 (1~3)<input className="input" type="number" min={1} max={3} value={f.intensity} onChange={set('intensity')} />
        </label>
        <label>
          인기도 (정렬용)<input className="input" type="number" min={0} value={f.popularity} onChange={set('popularity')} />
        </label>
        <label className={styles.inline}>
          <input type="checkbox" checked={f.newArrival} onChange={set('newArrival')} /> 신제품(NEW)으로 노출
        </label>
      </fieldset>

      <fieldset>
        <legend>이미지</legend>
        <label>
          상품 이미지 경로 *<input className="input" required value={f.imageUrl} onChange={set('imageUrl')} />
        </label>
        <label>
          메인 카드용 이미지<input className="input" value={f.thumbnailUrl} onChange={set('thumbnailUrl')} />
        </label>
        <label>
          향 아트워크<input className="input" value={f.artworkUrl} onChange={set('artworkUrl')} />
        </label>
        {f.imageUrl && <img className={styles.preview} src={f.imageUrl} alt="미리보기" />}
      </fieldset>

      <fieldset>
        <legend>향의 장면</legend>
        <label>
          향의 계열<input className="input" value={f.scentFamily} onChange={set('scentFamily')} placeholder="우디 · 그린 · 시트러스" />
        </label>
        <label>
          필터: 향의 느낌<input className="input" value={f.feeling} onChange={set('feeling')} />
        </label>
        <label>
          필터: 공간/순간<input className="input" value={f.scene} onChange={set('scene')} />
        </label>
        <label>
          어울리는 곳<input className="input" value={f.bestPlace} onChange={set('bestPlace')} />
        </label>
        <label className={styles.wide}>
          장면 제목 (줄바꿈 가능)
          <textarea className="input" rows={2} value={f.storyTitle} onChange={set('storyTitle')} />
        </label>
        <label className={styles.wide}>
          장면 묘사<textarea className="input" rows={3} value={f.storyBody} onChange={set('storyBody')} />
        </label>
        <label className={styles.wide}>
          노트 (한 줄에 하나: 이름 | 설명)
          <textarea className="input" rows={3} value={f.notes} onChange={set('notes')} />
        </label>
        <label className={styles.wide}>
          취향 매칭 태그 (쉼표 구분: WOODY, GREEN, CITRUS, MUSK, FLORAL, TEA, AMBER, AQUATIC, EARTHY, POWDERY, SWEET, HERBAL, SMOKY)
          <input className="input" value={f.tags} onChange={set('tags')} />
        </label>
      </fieldset>

      <fieldset>
        <legend>사용법 · 글과 음악</legend>
        <label>
          구성<input className="input" value={f.composition} onChange={set('composition')} />
        </label>
        <label>
          플레이리스트 제목<input className="input" value={f.playlistTitle} onChange={set('playlistTitle')} />
        </label>
        <label className={styles.wide}>
          사용 가이드 (한 줄에 한 단계)
          <textarea className="input" rows={3} value={f.ritualSteps} onChange={set('ritualSteps')} />
        </label>
        <label className={styles.wide}>
          안전 안내<textarea className="input" rows={2} value={f.safetyNotice} onChange={set('safetyNotice')} />
        </label>
        <label className={styles.wide}>
          세 줄 이야기<textarea className="input" rows={3} value={f.poemLines} onChange={set('poemLines')} />
        </label>
        <label className={styles.wide}>
          음악 추천 (한 줄에 하나: 곡명 | 아티스트 | YouTube 영상 ID(선택))
          <textarea className="input" rows={3} value={f.tracks} onChange={set('tracks')} />
        </label>
      </fieldset>
    </form>
  );
}
