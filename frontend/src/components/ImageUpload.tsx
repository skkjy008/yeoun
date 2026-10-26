import { ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { uploadApi } from '../api/endpoints';
import type { UploadPurpose } from '../api/types';
import { useToast } from './Toast';

interface Props {
  purpose: UploadPurpose;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/** 이미지 파일 하나를 골라 업로드하고 URL을 돌려줍니다. (S3/SeaweedFS 또는 서버 디스크) */
export default function ImageUpload({ purpose, onUploaded, label = '이미지 올리기', className }: Props) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast('이미지는 5MB 이하로 올려 주세요.');
      return;
    }
    setBusy(true);
    try {
      const result = await uploadApi.image(file, purpose);
      onUploaded(result.url);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : '이미지를 올리지 못했어요.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <label className={className} aria-busy={busy}>
      <ImagePlus size={18} strokeWidth={1.4} aria-hidden />
      <span>{busy ? '올리는 중…' : label}</span>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => void choose(e.target.files?.[0])}
      />
    </label>
  );
}
