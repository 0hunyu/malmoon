import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

function RejectReasonModal({ show, handleClose, handleSubmitReject, clientName }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const onSubmit = () => {
    if (reason.trim() === '') {
      setError('거절 사유를 입력해주세요.');
      return;
    }
    setError('');
    handleSubmitReject(reason); // 부모 컴포넌트로 사유 전달
    setReason(''); // 입력 필드 초기화
  };

  const onClose = () => {
    setReason(''); // 입력 필드 초기화
    setError(''); // 에러 초기화
    handleClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{clientName} 님과의 매칭 거절 사유</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>매칭을 거절하는 이유를 간단히 작성해주세요.</p>
        <Form.Group controlId="rejectReason">
          <Form.Control
            as="textarea"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim() !== '') {
                setError(''); // 입력 시작 시 에러 메시지 제거
              }
            }}
            placeholder="예: 현재 예약이 많아 추가적인 상담이 어렵습니다."
            isInvalid={!!error}
          />
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button variant="danger" onClick={onSubmit}>
          거절하기
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RejectReasonModal;