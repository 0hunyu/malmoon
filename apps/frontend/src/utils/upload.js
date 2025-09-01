// 허용 타입/사이즈: 백엔드와 반드시 동일하게 유지
export const MAX_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/webp','image/avif','image/gif',
  'application/pdf','video/mp4','audio/mpeg','audio/wav'
];

export function assertFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`허용되지 않는 타입: ${file.type || '(없음)'}`);
  }
  if (!file.size || file.size <= 0 || file.size > MAX_SIZE) {
    const mb = (file.size || 0) / 1024 / 1024;
    throw new Error(`파일 크기 제한 초과: ${mb.toFixed(1)}MB (최대 20MB)`);
  }
}

// SHA-256(Base64). 지원 안 되면 null 반환(체크섬 비활성)
export async function sha256Base64(file) {
  try {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(hash);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  } catch (e) {
    console.warn('checksum 계산 불가, 건너뜀:', e?.message || e);
    return null;
  }
}
