import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function FeedbackDisplayModal({ show, handleClose, feedbackContent, date }) {
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{date ? `${date.toLocaleDateString('ko-KR')} 피드백` : '피드백'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{feedbackContent}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FeedbackDisplayModal;
