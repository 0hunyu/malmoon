import api from '../api/axios';
import { assertFile, sha256Base64 } from '../utils/upload';

// 진행률(onProgress), 취소(cancel) 지원
export async function uploadWithPresignXHR(file, fileType, { onProgress } = {}) {
  assertFile(file);

  const checksum = await sha256Base64(file);
  const presignReq = {
    fileType,
    originalFileName: file.name,
    contentType: file.type,
    size: file.size,
    checksumSha256Base64: checksum || undefined
  };

  // 1) presign
  const { data: presign } = await api.post('/api/v1/files/presign', presignReq);
  const { uploadUrl, key } = presign;

  // 2) XHR PUT to S3 (진행률)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    if (checksum) xhr.setRequestHeader('x-amz-checksum-sha256', checksum);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve()
      : reject(new Error(`S3 업로드 실패: ${xhr.status}`));
    xhr.onerror = () => reject(new Error('네트워크 오류'));
    xhr.send(file);

    // 취소 지원
    uploadWithPresignXHR.cancel = () => xhr.abort();
  });

  // 3) confirm (DB 저장 + 짧은 조회 URL)
  const { data: confirmed } = await api.post('/api/v1/files/confirm', {
    key, contentType: file.type, size: file.size
  });

  return { fileId: confirmed.fileId, viewUrl: confirmed.viewUrl, key };
}

// 현재 진행 업로드를 취소하고 싶을 때 호출
uploadWithPresignXHR.cancel = () => {};
