// utils/resizeImage.js
export async function maybeResize(file, { maxDim = 2048 } = {}) {
  const img = await loadImageFromFile(file);
  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  if (scale >= 1) return file; // 리사이즈 불필요

  const nw = Math.round(width * scale);
  const nh = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = nw; canvas.height = nh;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, nw, nh);

  const blob = await canvasToBlob(canvas, file.type || 'image/jpeg', 0.92); // 원본 타입 유지 시도
  return new File([blob], appendSuffix(file.name, `_resized`), { type: blob.type, lastModified: Date.now() });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob null')), type, quality);
  });
}
function appendSuffix(name, suffix) {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? `${name}${suffix}` : `${name.slice(0, dot)}${suffix}${name.slice(dot)}`;
}
