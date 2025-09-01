// utils/convertSmart.js
import { convertToAvif } from './convertToAvif';
import { maybeResize } from './resizeImage';
import { convertToWebp } from './convertToWebp'; // 아래 예시 추가

const AVIF_THRESHOLD = 1 * 1024 * 1024; // 1MB

/**
 * 사진/이미지 파일을 똑똑하게 처리:
 * 1) 너무 크면 리사이즈
 * 2) AVIF 변환 시도
 * 3) WebP 변환 시도
 * 4) 원본/AVIF/WebP 중 "가장 작은" 걸 선택
 */
export async function pickSmallestVariant(file, { maxDim = 2048 } = {}) {
  // 0) 이미지가 아니면 그대로
  if (!file.type.startsWith('image/')) return file;

  // 1) 원본이 이미 웹포/avif면 변환 이득 적음 → 사이즈 가드만
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const alreadyEfficient = file.type === 'image/webp' || file.type === 'image/avif' || ext === 'webp' || ext === 'avif';

  // 2) 리사이즈(너비/높이 maxDim 제한)
  const base = await maybeResize(file, { maxDim });

  const candidates = [{ file: base, label: 'original' }];

  // 3) 1MB 이상 & 사진류일 때만 변환 시도 (스크린샷/아이콘 등은 건너뛰고 싶으면 MIME/메타로 필터링 추가)
  const shouldTry = base.size >= AVIF_THRESHOLD && !alreadyEfficient;

  if (shouldTry) {
    try {
      const avif = await convertToAvif(base);
      candidates.push({ file: avif, label: 'avif' });
    } catch (e) {
      // AVIF 미지원/실패 → 무시
      // console.warn(e);
    }
    try {
      const webp = await convertToWebp(base, 0.82); // 대체로 잘 동작, 품질 파라미터 적용됨
      candidates.push({ file: webp, label: 'webp' });
    } catch {}
  }

  // 4) 가장 작은 파일 선택 (같거나 더 크면 원본 유지)
  let best = candidates[0];
  for (const c of candidates) {
    if (c.file.size < best.file.size) best = c;
  }
  return best.file;
}
