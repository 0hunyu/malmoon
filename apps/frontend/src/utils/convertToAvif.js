// src/utils/convertToAvif.js

/**
 * File -> AVIF File (브라우저 지원 시)
 * 지원하지 않거나 변환 실패하면 throw 해서 호출 측에서 원본 폴백하도록.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function convertToAvif(file) {
  // 브라우저가 AVIF 인코딩을 지원하는지 간단 탐지
  const avifSupported = await isAvifEncodeSupported();
  if (!avifSupported) {
    throw new Error('AVIF encode not supported by this browser');
  }

  const img = await loadImageFromFile(file);
  const { width, height } = img;

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // draw
  if ('bitmap' in img && img.bitmap) {
    // createImageBitmap 경로 (안 씀)
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  // AVIF로 blob 생성 (quality 인자는 브라우저마다 무시될 수 있음)
  const blob = await canvasToBlob(canvas, 'image/avif');

  if (!blob) {
    throw new Error('AVIF conversion failed');
  }

  const newName = replaceExt(file.name, '.avif');
  return new File([blob], newName, { type: 'image/avif', lastModified: Date.now() });
}

/** 간단한 AVIF 인코딩 지원 탐지 */
async function isAvifEncodeSupported() {
  if (!HTMLCanvasElement || !HTMLCanvasElement.prototype.toBlob) return false;
  // 일부 브라우저는 지원하더라도 null을 반환할 수 있으므로 실제 시도
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  try {
    const blob = await canvasToBlob(canvas, 'image/avif');
    return !!blob;
  } catch {
    return false;
  }
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))), type);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function replaceExt(name, ext) {
  return name.replace(/\.[^.]+$/, ext);
}
