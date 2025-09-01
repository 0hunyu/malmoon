import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Button, Form, Row, Col, Spinner, Card, Image, ProgressBar } from 'react-bootstrap';
import './AacItemModal.css'; // Import the new CSS file
import api from '../../api/axios';

const AacItemModal = ({ show, onHide, onSave, itemData, onGenerate }) => {
    const [form, setForm] = useState({ name: '', description: '', situation: '', action: '', emotion: '', status: 'PUBLIC' });
    const [creationMethod, setCreationMethod] = useState('direct');
    const [imagePreview, setImagePreview] = useState('');
    const [imageFile, setImageFile] = useState(null);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiGeneratedImage, setAiGeneratedImage] = useState(null);

    const { user } = useAuth();
    const token = user?.accessToken;

    // Pre-signed 테스트용 상태
    const [psBusy, setPsBusy] = useState(false);
    const [psProgress, setPsProgress] = useState(0);
    const [psResult, setPsResult] = useState(null);

    // SHA-256 → Base64 (지원 불가하면 null)
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
                status: itemData.status || 'PUBLIC'
            });
            if (itemData.imageUrl) setImagePreview(itemData.imageUrl);
            setCreationMethod('direct');
        } else {
            setForm({ name: '', description: '', situation: '', action: '', emotion: '', status: 'PUBLIC' });
            setCreationMethod('direct');
            setImagePreview('');
            setImageFile(null);
            setAiGeneratedImage(null);
        }
    }, [itemData, show]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = () => {
        let payloadToSave = { ...form }; // 기본 폼 데이터

        if (creationMethod === 'direct') {
            if(!form.name || !form.description || !form.situation || !form.action) {
                alert('이름, 설명, 상황, 행동은 필수 입력 항목입니다.');
                return;
            }
            if(!itemData && !imageFile) {
                alert('이미지를 등록해주세요.');
                return;
            }
            payloadToSave.imageFile = imageFile; // 직접 등록 시 imageFile 추가
        } else if (creationMethod === 'ai') {
             if(!form.name) {
                alert('아이템 이름은 필수 입력 항목입니다.');
                return;
            }
            // AI 생성 방식일 경우, aiGeneratedImage가 설정되어 있는지 확인
            if(!aiGeneratedImage) {
                alert('AI 이미지를 생성해주세요.');
                return;
            }
            payloadToSave.aiGeneratedImage = aiGeneratedImage; // AI 생성 이미지 URL 추가
            payloadToSave.imageFile = imageFile; // File 객체도 함께 전달 (TherapistToolsPage에서 사용될 수 있음)
        }
        
        console.log("handleSaveClick - creationMethod:", creationMethod);
        console.log("handleSaveClick - imageFile:", imageFile);
        console.log("handleSaveClick - aiGeneratedImage:", aiGeneratedImage);
        onSave(payloadToSave); // 수정된 payloadToSave 객체 전달
    };

    // ✅ Pre-signed 업로드 테스트용
   const handlePresignedTest = async () => {
     try {
       if (!imageFile) {
         alert('테스트할 이미지를 먼저 선택/생성하세요.');
         return;
       }
       setPsBusy(true);
       setPsProgress(0);
       setPsResult(null);
 
       const token = user?.accessToken;
       const contentType = imageFile.type || 'application/octet-stream';
       const checksum = await sha256Base64(imageFile); // 없으면 null
 
       // 1) presign 발급
       const { data: presign } = await api.post('/files/presign', {
            fileType: 'AAC',
            originalFileName: imageFile.name,
            contentType: imageFile.type,
            size: imageFile.size,
            ...(checksum ? { checksumSha256Base64: checksum } : {})
        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

       // 2) S3로 XHR PUT (진행률)
    const etag = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl, true);

        // 👉 presign에 서명에 포함된 헤더들을 '똑같이' 전송
        xhr.setRequestHeader('Content-Type', contentType);
        if (checksum) xhr.setRequestHeader('x-amz-checksum-sha256', checksum);
        xhr.setRequestHeader('x-amz-server-side-encryption', 'AES256'); // 중요!

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setPsProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
            const ok = xhr.status >= 200 && xhr.status < 300;
            if (!ok) {
            console.log('S3 status:', xhr.status);
            console.log('S3 headers:', xhr.getAllResponseHeaders());
            console.log('S3 body:', xhr.responseText);
            reject(new Error(`S3 오류 ${xhr.status}`));
            return;
            }
            // S3가 반환한 ETag를 노출하려면 버킷 CORS에 ExposeHeaders에 "ETag"가 있어야 함
            const etagHeader = xhr.getResponseHeader('ETag'); // 예: "abc123..."
            resolve(etagHeader); // null이어도 confirm은 진행되지만, 있으면 검증에 더 안전
        };

        xhr.onerror = () => reject(new Error('네트워크 오류'));
        xhr.send(imageFile);
        });
 
       // 3) 업로드 확정 → DB 저장 + 짧은 조회 URL
        const { data: confirmed } = await api.post('/files/confirm', {
            key: presign.key,
            contentType,
            size: imageFile.size,
            etag,
        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
 
       setPsResult(confirmed);
       // 테스트 편의를 위해 미리보기에 확인 URL 표시(유효기간 짧음)
       setImagePreview(confirmed.viewUrl || imagePreview);
       alert(`Pre-signed 업로드 성공!\nfileId: ${confirmed.fileId}`);
     } catch (e) {
       console.error(e);
       alert(e.message || 'Pre-signed 업로드 실패');
     } finally {
       setPsBusy(false);
     }
   };


    const handleAiGenerate = async () => {
        const { situation, action, emotion, description } = form;
        if (!situation || !action || !emotion) {
            alert('AI 이미지 생성을 위해 상황, 행동, 감정을 모두 입력해주세요.');
            return;
        }
        setIsGenerating(true);
        try {
            // const generatedUrl = await onGenerate({ situation, action, emotion, description });
            // setAiGeneratedImage(generatedUrl); // AI 생성 이미지 URL 저장 (미리보기용)

            // // AI 생성 이미지를 Blob으로 가져와 File 객체로 변환
            // const response = await fetch(generatedUrl);
            // const blob = await response.blob();
            // const filename = generatedUrl.substring(generatedUrl.lastIndexOf('/') + 1);
            // const aiImageFile = new File([blob], filename, { type: blob.type });
            
            // setImageFile(aiImageFile); // File 객체를 imageFile 상태에 저장
            // setImagePreview(URL.createObjectURL(aiImageFile)); // 미리보기 업데이트

            let generatedUrl = await onGenerate({ situation, action, emotion, description });

            // 혹시라도 객체가 들어오면 보정
            if (generatedUrl && typeof generatedUrl === 'object') {
            generatedUrl = generatedUrl.previewUrl || generatedUrl.preview_url || '';
            }
            if (typeof generatedUrl !== 'string' || !generatedUrl) {
            throw new Error('유효하지 않은 미리보기 URL입니다.');
            }

            // 절대 URL 보정 (상대경로로 오면 현재 오리진 기준으로 절대화)
            const absoluteUrl = new URL(generatedUrl, window.location.origin).toString();
            setAiGeneratedImage(absoluteUrl);

            // 이미지 Blob 다운로드 → File 생성
            const response = await fetch(absoluteUrl);
            if (!response.ok) throw new Error('이미지 다운로드 실패');
            const blob = await response.blob();

            // 파일명 안전 추출
            const pathname = new URL(absoluteUrl).pathname;
            const fallbackName = `aac_preview_${Date.now()}.png`;
            const filename = pathname.split('/').pop() || fallbackName;

            const aiImageFile = new File([blob], filename, { type: blob.type || 'image/png' });
            setImageFile(aiImageFile);
            setImagePreview(URL.createObjectURL(aiImageFile));
        } catch (error) {
            console.error('AI 이미지 생성 중 오류 발생:', error);
            alert(error.message || 'AI 이미지 생성에 실패했습니다. 콘솔을 확인해주세요.');
        } finally {
            setIsGenerating(false);
        }
        // } catch (error) { 
        //     console.error("AI 이미지 생성 중 오류 발생:", error);
        //     alert(error.message || 'AI 이미지 생성에 실패했습니다. 콘솔을 확인해주세요.');
        // } finally {
        //     setIsGenerating(false);
        // }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="aac-item-modal">
            <Modal.Header closeButton>
                <Modal.Title>{itemData ? 'AAC 아이템 편집' : '새 AAC 아이템 추가'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    {!itemData && (
                        <Form.Group className="mb-3">
                            <Form.Label>생성 방식</Form.Label>
                            <div>
                                <Form.Check inline type="radio" label="AI로 생성" name="creationMethod" value="ai" checked={creationMethod === 'ai'} onChange={(e) => setCreationMethod(e.target.value)} />
                                <Form.Check inline type="radio" label="직접 등록" name="creationMethod" value="direct" checked={creationMethod === 'direct'} onChange={(e) => setCreationMethod(e.target.value)} />
                            </div>
                        </Form.Group>
                    )}
                    
                    {creationMethod === 'ai' && !itemData ? (
                        <>
                            <Row>
                                <Col md={7}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>핵심 설명</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={3} 
                                            name="description"
                                            placeholder="AI에게 생성 요청할 이미지에 대한 설명을 자유롭게 입력하세요. (예: 학교에서 즐겁게 친구들과 노는 모습)" 
                                            value={form.description || ''} 
                                            onChange={handleFormChange} 
                                        />
                                    </Form.Group>
                                    <Row>
                                        <Col md={7}><Form.Group className="mb-3"><Form.Label>상황</Form.Label><Form.Control type="text" name="situation" placeholder="예: 학교" value={form.situation || ''} onChange={handleFormChange} /></Form.Group></Col>
                                        <Col md={7}><Form.Group className="mb-3"><Form.Label>행동</Form.Label><Form.Control type="text" name="action" placeholder="예: 친구와 놀기" value={form.action || ''} onChange={handleFormChange} /></Form.Group></Col>
                                        <Col md={7}><Form.Group className="mb-3"><Form.Label>감정</Form.Label><Form.Control type="text" name="emotion" placeholder="예: 즐거움" value={form.emotion || ''} onChange={handleFormChange} /></Form.Group></Col>
                                    </Row>
                                    <Button className="btn-ai-generate" onClick={handleAiGenerate} disabled={isGenerating}>
                                        {isGenerating ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> 생성 중...</> : 'AI 이미지 생성'}
                                    </Button>
                                </Col>
                                <Col md={5}>
                                    <Form.Label>생성된 이미지</Form.Label>
                                    <Card className="image-preview-card">
                                        {isGenerating ? (
                                            <Spinner animation="border" />
                                        ) : (
                                            imagePreview ? <Image src={imagePreview} fluid thumbnail /> : <div className="text-muted"> 생성된 AI 이미지 </div> // aiGeneratedImage 대신 imagePreview 사용
                                        )}
                                    </Card>
                                    {psBusy && (
                                        <div className="mt-2">
                                          <ProgressBar now={psProgress} label={`${psProgress}%`} striped animated />
                                        </div>
                                      )}
                                      {psResult && !psBusy && (
                                        <div className="mt-2 small text-muted">
                                          업로드 완료 · fileId: {psResult.fileId}{' '}
                                          {psResult.viewUrl && (
                                            <a href={psResult.viewUrl} target="_blank" rel="noreferrer">미리보기(10분)</a>
                                          )}
                                        </div>
                                      )}
                                </Col>
                            </Row>
                            <hr className="my-4" />
                            <Form.Group className="mb-3"><Form.Label>이름</Form.Label><Form.Control type="text" name="name" placeholder="생성된 아이템의 이름 (예: 즐거운 학교생활)" value={form.name || ''} onChange={handleFormChange} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>상태</Form.Label><Form.Select name="status" value={form.status || 'PUBLIC'} onChange={handleFormChange}><option value="PUBLIC">공개</option><option value="PRIVATE">비공개</option></Form.Select></Form.Group>
                        </>
                    ) : (
                        <Row>
                            <Col md={7}>
                                <Form.Group className="mb-3"><Form.Label>이름</Form.Label><Form.Control type="text" name="name" placeholder="예: 물 마시기" value={form.name || ''} onChange={handleFormChange} /></Form.Group>
                                <Form.Group className="mb-3"><Form.Label>설명</Form.Label><Form.Control as="textarea" name="description" rows={2} placeholder="이 아이템에 대한 간단한 설명" value={form.description || ''} onChange={handleFormChange} /></Form.Group>
                                <Row>
                                    <Col md={7}><Form.Group className="mb-3"><Form.Label>상황 (대분류)</Form.Label><Form.Control type="text" name="situation" placeholder="예: 집, 학교" value={form.situation || ''} onChange={handleFormChange} /></Form.Group></Col>
                                    <Col md={7}><Form.Group className="mb-3"><Form.Label>행동</Form.Label><Form.Control type="text" name="action" placeholder="예: 친구와 놀기" value={form.action || ''} onChange={handleFormChange} /></Form.Group></Col>
                                    <Col md={7}><Form.Group className="mb-3"><Form.Label>감정</Form.Label><Form.Control type="text" name="emotion" placeholder="예: 기쁨" value={form.emotion || ''} onChange={handleFormChange} /></Form.Group></Col>
                                </Row>
                                <Form.Group className="mb-3"><Form.Label>상태</Form.Label><Form.Select name="status" value={form.status || 'PUBLIC'} onChange={handleFormChange}><option value="PUBLIC">공개</option><option value="PRIVATE">비공개</option></Form.Select></Form.Group>
                            </Col>
                            <Col md={7}>
                                <Form.Group className="mb-3">
                                    <Form.Label>이미지</Form.Label>
                                    <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                                    {imagePreview && <Image src={imagePreview} className="mt-2" fluid thumbnail />}
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-cancel" onClick={onHide}>취소</Button>
                <Button variant="secondary" onClick={handlePresignedTest} disabled={psBusy || (!itemData && !imageFile)}>
                    {psBusy ? '테스트 업로드 중…' : 'Pre-signed 테스트'}
                </Button>
                <Button className="btn-save-add" onClick={handleSaveClick}>
                    {itemData ? '저장' : '추가'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AacItemModal;
