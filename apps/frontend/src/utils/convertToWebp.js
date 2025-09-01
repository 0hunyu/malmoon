// utils/convertToWebp.js
export async function convertToWebp(file, quality = 0.82) {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, 'image/webp', quality);
  if (!blob) throw new Error('WEBP conversion failed');
  const newName = replaceExt(file.name, '.webp');
  return new File([blob], newName, { type: 'image/webp', lastModified: Date.now() });
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
function replaceExt(name, ext) {
  return name.replace(/\.[^.]+$/, ext);
}
