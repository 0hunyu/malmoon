import React from 'react';
import { Modal, Image, Badge, ListGroup } from 'react-bootstrap';



const AacItemDetailModal = ({ show, onHide, item }) => {
  if (!item) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{item.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <Image 
          src={item.imageUrl || ""} 
          fluid 
          rounded 
          className="mb-3"
        />
        <p className="text-muted">{item.description}</p>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <strong>상황:</strong> <Badge bg="primary">{item.situation}</Badge>
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>행동:</strong> <Badge bg="info">{item.action}</Badge>
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>감정:</strong> <Badge bg="success">{item.emotion || 'N/A'}</Badge>
          </ListGroup.Item>
           <ListGroup.Item>
            <strong>상태:</strong> <Badge bg="secondary">{item.status}</Badge>
          </ListGroup.Item>
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};

export default AacItemDetailModal;
