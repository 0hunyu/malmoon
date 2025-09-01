// src/components/AacItemModal/AacItemModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, Form, Row, Col, Spinner, Card, Image, ProgressBar } from 'react-bootstrap';
import './AacItemModal.css';
import api from '../../api/axios';
import { pickSmallestVariant  } from '../../utils/convertSmart';

const AVIF_THRESHOLD = 1 * 1024 * 1024; // 1MB

const AacItemModal = ({ show, onHide, onSave, itemData, onGenerate }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    situation: '',
    action: '',
    emotion: '',
    status: 'PUBLIC',
  });
  const [creationMethod, setCreationMethod] = useState('direct');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);

  // 업로드 진행 상태
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const { user } = useAuth();
  const token = user?.accessToken;

  // sha256 → base64 (가능한 브라우저에서만 사용)
  const sha256Base64 = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buf);
      const bytes = new Uint8Array(hash);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (itemData) {
      setForm({
        ...itemData,
        status: itemData.status || 'PUBLIC',
      });
      if (itemData.imageUrl) setImagePreview(itemData.imageUrl);
      setCreationMethod('direct');
      setImageFile(null);
    } else {
      setForm({ name: '', description: '', situation: '', action: '', emotion: '', status: 'PUBLIC' });
      setCreationMethod('direct');
      setImagePreview('');
      setImageFile(null);
    }
  }, [itemData, show]);

  /** 파일 선택 핸들러: 1MB 이상 이미지는 AVIF 변환 */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const finalFile = (file.type.startsWith('image/') && file.size >= AVIF_THRESHOLD)
   ? await pickSmallestVariant(file, { maxDim: 2048 })
   : file;

    setImageFile(finalFile);
    setImagePreview(URL.createObjectURL(finalFile));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** AI 이미지 생성 → 1MB 이상이면 AVIF 변환 동일 적용 */
  const handleAiGenerate = async () => {
    const { situation, action, emotion, description } = form;
    if (!situation || !action || !emotion) {
      alert('AI 이미지 생성을 위해 상황, 행동, 감정을 모두 입력해주세요.');
      return;
    }
    setIsGenerating(true);
    try {
      let generatedUrl = await onGenerate({ situation, action, emotion, description });
      if (generatedUrl && typeof generatedUrl === 'object') {
        generatedUrl = generatedUrl.previewUrl || generatedUrl.preview_url || '';
      }
      if (typeof generatedUrl !== 'string' || !generatedUrl) {
        throw new Error('유효하지 않은 미리보기 URL입니다.');
      }

      // AI 프리뷰 다운로드
      const absoluteUrl = new URL(generatedUrl, window.location.origin).toString();
      const res = await fetch(absoluteUrl);
      if (!res.ok) throw new Error('이미지 다운로드 실패');

      const blob = await res.blob();
      const pathname = new URL(absoluteUrl).pathname;
      const fallbackName = `aac_preview_${Date.now()}.png`;
      const filename = pathname.split('/').pop() || fallbackName;

      let aiImageFile = new File([blob], filename, { type: blob.type || 'image/png' });

      // 동일 정책: 1MB 이상 이미지라면 AVIF 변환
      if (aiImageFile.type.startsWith('image/') && aiImageFile.size >= AVIF_THRESHOLD) {
        aiImageFile = await pickSmallestVariant(aiImageFile, { maxDim: 2048 });
      }

      setImageFile(aiImageFile);
      setImagePreview(URL.createObjectURL(aiImageFile));
    } catch (err) {
      console.error('AI 이미지 생성 중 오류:', err);
      alert(err.message || 'AI 이미지 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  /** Presign → S3 PUT → Complete → AAC 생성 */
  const handleCreateViaPresign = async () => {
    try {
      // 필수 검증
      if (!form.name || !form.description || !form.situation || !form.action) {
        alert('이름, 설명, 상황, 행동은 필수 입력 항목입니다.');
        return;
      }
      if (!imageFile) {
        alert('이미지를 선택하거나 생성해주세요.');
        return;
      }
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      setBusy(true);
      setProgress(0);

      const contentType = imageFile.type || 'application/octet-stream';
      const checksum = await sha256Base64(imageFile);

      // 1) Presigned URL 발급 (백엔드가 key를 생성/반환한다고 가정: uploadUrl, key)
      const { data: presign } = await api.post(
        '/aacs/presign-upload',
        {
          originalFileName: imageFile.name, // 서버가 키를 만들 때 참고
          contentType,                      // 변환되었으면 image/avif
          size: imageFile.size,
          ...(checksum ? { checksumSha256Base64: checksum } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2) S3로 PUT (진행률 표시 + ETag 추출)
      const etag = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl, true);
        xhr.setRequestHeader('Content-Type', contentType);
        if (checksum) xhr.setRequestHeader('x-amz-checksum-sha256', checksum);
        // 서버측에서 SSE-KMS가 아니라면 AES256 또는 미설정. 정책에 맞춰 수정 가능.
        xhr.setRequestHeader('x-amz-server-side-encryption', 'AES256');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // S3 CORS: ExposeHeaders에 ETag 필요
            resolve(xhr.getResponseHeader('ETag'));
          } else {
            reject(new Error(`S3 오류 ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('네트워크 오류'));
        xhr.send(imageFile);
      });

      // 3) 업로드 확정 + AAC 저장(서버에서 File/ AAC 모두 저장)
      const completeBody = {
        key: presign.key, // 서버가 presign 단계에서 내려준 최종 키
        size: imageFile.size,
        contentType,
        etag,
        name: form.name,
        situation: form.situation,
        action: form.action,
        emotion: form.emotion || null,
        description: form.description,
        status: form.status,
      };

      const { data: created } = await api.post(
        '/aacs/presign-complete',
        completeBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 미리보기 URL 있으면 갱신
      if (created?.previewUrl) setImagePreview(created.previewUrl);

      // 부모 목록 새로고침 트리거
      if (typeof onSave === 'function') {
        onSave({ refreshed: true });
      }

      alert('AAC가 생성되었습니다.');
      onHide?.();

      // 폼 초기화
      setForm({ name: '', description: '', situation: '', action: '', emotion: '', status: 'PUBLIC' });
      setImageFile(null);
      setProgress(0);
    } catch (e) {
      console.error(e);
      alert(e.message || '업로드/생성 실패');
    } finally {
      setBusy(false);
    }
  };

  const isCreateMode = !itemData;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="aac-item-modal">
      <Modal.Header closeButton>
        <Modal.Title>{itemData ? 'AAC 아이템 편집' : '새 AAC 아이템 추가'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {isCreateMode && (
            <Form.Group className="mb-3">
              <Form.Label>생성 방식</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="AI로 생성"
                  name="creationMethod"
                  value="ai"
                  checked={creationMethod === 'ai'}
                  onChange={(e) => setCreationMethod(e.target.value)}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="직접 등록"
                  name="creationMethod"
                  value="direct"
                  checked={creationMethod === 'direct'}
                  onChange={(e) => setCreationMethod(e.target.value)}
                />
              </div>
            </Form.Group>
          )}

          {creationMethod === 'ai' && isCreateMode ? (
            <>
              <Row>
                <Col md={7}>
                  <Form.Group className="mb-3">
                    <Form.Label>핵심 설명</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      placeholder="AI에게 생성 요청할 이미지 설명"
                      value={form.description || ''}
                      onChange={handleFormChange}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={7}>
                      <Form.Group className="mb-3">
                        <Form.Label>상황</Form.Label>
                        <Form.Control type="text" name="situation" value={form.situation || ''} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group className="mb-3">
                        <Form.Label>행동</Form.Label>
                        <Form.Control type="text" name="action" value={form.action || ''} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group className="mb-3">
                        <Form.Label>감정</Form.Label>
                        <Form.Control type="text" name="emotion" value={form.emotion || ''} onChange={handleFormChange} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button className="btn-ai-generate" onClick={handleAiGenerate} disabled={isGenerating || busy}>
                    {isGenerating ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> 생성 중...
                      </>
                    ) : (
                      'AI 이미지 생성'
                    )}
                  </Button>
                </Col>
                <Col md={5}>
                  <Form.Label>생성된 이미지</Form.Label>
                  <Card className="image-preview-card">
                    {isGenerating ? (
                      <Spinner animation="border" />
                    ) : imagePreview ? (
                      <Image src={imagePreview} fluid thumbnail />
                    ) : (
                      <div className="text-muted"> 생성된 AI 이미지 </div>
                    )}
                  </Card>
                  {busy && (
                    <div className="mt-2">
                      <ProgressBar now={progress} label={`${progress}%`} striped animated />
                    </div>
                  )}
                </Col>
              </Row>
              <hr className="my-4" />
              <Form.Group className="mb-3">
                <Form.Label>이름</Form.Label>
                <Form.Control type="text" name="name" value={form.name || ''} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>상태</Form.Label>
                <Form.Select name="status" value={form.status || 'PUBLIC'} onChange={handleFormChange}>
                  <option value="PUBLIC">공개</option>
                  <option value="PRIVATE">비공개</option>
                </Form.Select>
              </Form.Group>
            </>
          ) : (
            <Row>
              <Col md={7}>
                <Form.Group className="mb-3">
                  <Form.Label>이름</Form.Label>
                  <Form.Control type="text" name="name" value={form.name || ''} onChange={handleFormChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>설명</Form.Label>
                  <Form.Control as="textarea" name="description" rows={2} value={form.description || ''} onChange={handleFormChange} />
                </Form.Group>
                <Row>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label>상황 (대분류)</Form.Label>
                      <Form.Control type="text" name="situation" value={form.situation || ''} onChange={handleFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label>행동</Form.Label>
                      <Form.Control type="text" name="action" value={form.action || ''} onChange={handleFormChange} />
                    </Form.Group>
                  </Col>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label>감정</Form.Label>
                      <Form.Control type="text" name="emotion" value={form.emotion || ''} onChange={handleFormChange} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>상태</Form.Label>
                  <Form.Select name="status" value={form.status || 'PUBLIC'} onChange={handleFormChange}>
                    <option value="PUBLIC">공개</option>
                    <option value="PRIVATE">비공개</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>이미지</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleFileChange} disabled={busy} />
                  {imagePreview && <Image src={imagePreview} className="mt-2" fluid thumbnail />}
                </Form.Group>
                {busy && (
                  <div className="mt-2">
                    <ProgressBar now={progress} label={`${progress}%`} striped animated />
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn-cancel" onClick={onHide} disabled={busy}>
          취소
        </Button>
        {isCreateMode ? (
          // 생성 모드: presign → PUT → complete
          <Button className="btn-save-add" onClick={handleCreateViaPresign} disabled={busy}>
            {busy ? '업로드 중…' : '추가'}
          </Button>
        ) : (
          // 편집 모드: 업데이트 API 준비 전 비활성 처리(선택)
          <Button className="btn-save-add" disabled>
            저장 (곧 지원)
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AacItemModal;
