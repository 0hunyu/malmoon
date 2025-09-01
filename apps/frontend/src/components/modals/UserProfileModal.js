import React from 'react';
import { Modal, Button, ListGroup, Card, Tabs, Tab } from 'react-bootstrap';

function UserProfileModal({ show, handleClose, userProfile }) {
  if (!userProfile) {
    return null; // 프로필 데이터가 없으면 렌더링하지 않음
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{userProfile.name} 님의 상세 프로필</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-3">
          <Card.Header as="h5">기본 정보</Card.Header>
          <ListGroup variant="flush">
            <ListGroup.Item>이름: {userProfile.name}</ListGroup.Item>
            <ListGroup.Item>이메일: {userProfile.email}</ListGroup.Item>
            <ListGroup.Item>전화: {userProfile.telephone}</ListGroup.Item>
            <ListGroup.Item>요청일: {new Date(userProfile.createDate).toLocaleDateString()}</ListGroup.Item>
          </ListGroup>
        </Card>

        <Card className="mb-3">
          <Card.Header as="h5">간이 언어 평가 정보</Card.Header>
          <Card.Body>
            {userProfile.evaluation ? (
              <Tabs defaultActiveKey="evaluation" id="evaluation-tabs" className="mb-3">
                <Tab eventKey="evaluation" title="종합 평가">
                  <Card.Text className="p-2">{userProfile.evaluation}</Card.Text>
                </Tab>
                <Tab eventKey="strengths" title="강점">
                  <Card.Text className="p-2">{userProfile.strengths}</Card.Text>
                </Tab>
                <Tab eventKey="improvements" title="개선점">
                  <Card.Text className="p-2">{userProfile.improvements}</Card.Text>
                </Tab>
                <Tab eventKey="recommendations" title="추천 사항">
                  <Card.Text className="p-2">{userProfile.recommendations}</Card.Text>
                </Tab>
              </Tabs>
            ) : (
              <p className="text-muted">
                현재는 간이 언어 평가 정보가 제공되지 않습니다.
              </p>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UserProfileModal;
