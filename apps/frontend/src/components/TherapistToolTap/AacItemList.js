import React, { useState, useMemo } from "react";
import { Row, Col, Card, Button, InputGroup, Form, Pagination, Accordion, ListGroup } from "react-bootstrap";
import "./AacItemList.css";

// [수정] 절대/상대 경로를 모두 처리하는 최종 URL 보정 함수
const getCorrectedUrl = (imageUrl) => {
    // 입력값이 없거나 유효하지 않으면 빈 문자열 반환
    if (!imageUrl || typeof imageUrl !== 'string') {
        return "";
    }

    // S3 버킷의 기본 주소
    const S3_BUCKET_BASE_URL = 'https://malmoon-file-bucket-dev.s3.ap-northeast-2.amazonaws.com/';

    // Step 1: 입력값이 이미 완전한 URL인지 확인
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // 이미 완전한 URL인 경우, 이전과 같이 중복 주소나 인코딩 문제를 처리합니다.
        let correctedUrl = imageUrl;
        try {
            // 디코딩을 먼저 시도하여 'https%3A//' 같은 문제를 해결
            correctedUrl = decodeURIComponent(correctedUrl);
        } catch (e) { /* 디코딩 실패는 무시 */ }

        // 'https://' 중복 문제 해결
        const protocol = 'https://';
        const lastProtocolIndex = correctedUrl.lastIndexOf(protocol);
        if (lastProtocolIndex > 0) {
            correctedUrl = correctedUrl.substring(lastProtocolIndex);
        }
        return correctedUrl;

    } else {
        // Step 2: 완전한 URL이 아닌 경우 (예: 'AAC/파일명.png'), 상대 경로로 판단하여 기본 주소를 앞에 붙여줍니다.
        return `${S3_BUCKET_BASE_URL}${imageUrl}`;
    }
};

const AacItemList = ({ aacItems, currentUser, onEdit, onDelete, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const itemsPerPage = 12;

  const categories = useMemo(() => {
    if (!aacItems) return {};
    const initialCategories = aacItems.reduce((acc, item) => {
      const { situation, action } = item;
      if (!acc[situation]) acc[situation] = new Set();
      if (action) acc[situation].add(action);
      return acc;
    }, {});
    return Object.keys(initialCategories)
      .sort()
      .reduce((obj, key) => {
        obj[key] = Array.from(initialCategories[key]).sort();
        return obj;
      }, {});
  }, [aacItems]);

  const filteredItems = useMemo(() => {
    if (!aacItems) return [];

    const checkVisibility = (item) => {
      if (!currentUser) return false; 
      if (item.status === "PUBLIC" || item.status === "DEFAULT") {
        return true;
      }
      return item.status === "PRIVATE" && item.therapistId === currentUser.memberId;
    };

    let itemsToFilter = aacItems.filter(checkVisibility);

    if (selectedSituation) {
      itemsToFilter = itemsToFilter.filter(item => item.situation === selectedSituation);
      if (selectedAction) {
        itemsToFilter = itemsToFilter.filter(item => item.action === selectedAction);
      }
    }

    if (searchTerm) {
      itemsToFilter = itemsToFilter.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return itemsToFilter;
  }, [aacItems, searchTerm, selectedSituation, selectedAction, currentUser]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAccordionSelect = (eventKey) => {
    setActiveKey(eventKey);
    const situation = eventKey ? Object.keys(categories)[parseInt(eventKey, 10)] : null;
    setSelectedSituation(situation);
    setSelectedAction(null);
    setCurrentPage(1);
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setCurrentPage(1);
  };

  const clearCategory = () => {
    setActiveKey(null);
    setSelectedSituation(null);
    setSelectedAction(null);
    setCurrentPage(1);
  };

  const canModify = (item) => {
      if (!currentUser) {
          return false;
      }
      // 변경: 아이템의 상태가 'PRIVATE'이고, 현재 사용자가 해당 아이템의 소유자일 경우에만 수정/삭제 가능
      return item.status === 'PRIVATE' && item.therapistId === currentUser.memberId;
  }

  const handleEditClick = (e, item) => {
      e.stopPropagation();
      onEdit(item);
  }

  const handleDeleteClick = (e, itemId) => {
      e.stopPropagation();
      onDelete(itemId);
  }
  
  if (!aacItems) {
      return <p className="text-muted text-center">아이템을 불러오는 중...</p>;
  }

  return (
    <Row>
      <Col md={3}>
        <h5 className="mb-3">카테고리</h5>
        <Button variant="outline-secondary" size="sm" className="w-100 mb-2" onClick={clearCategory}>
          전체 보기
        </Button>
        <div className="category-list-container">
          <Accordion activeKey={activeKey} onSelect={handleAccordionSelect}>
            {Object.keys(categories).map((situation, index) => (
              <Accordion.Item eventKey={index.toString()} key={situation}>
                <Accordion.Header>{situation}</Accordion.Header>
                <Accordion.Body>
                  <ListGroup variant="flush">
                    {categories[situation].map((action) => (
                      <ListGroup.Item
                        key={action}
                        action
                        active={selectedSituation === situation && selectedAction === action}
                        onClick={() => handleActionSelect(action)}
                      >
                        {action}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </Col>
      <Col md={9}>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="아이템 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputGroup>
        {currentItems.length > 0 ? (
          <Row xs={2} md={3} lg={4} className="g-3">
            {currentItems.map((item) => (
              <Col key={item.id}>
                <Card className="h-100 item-card" onClick={() => onViewDetails(item)} style={{ cursor: 'pointer' }}>
                  <Card.Img
                    variant="top"
                    src={getCorrectedUrl(item.imageUrl) || "https://placehold.co/150x120?text=No+Image"}
                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x120?text=Error"; }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title as="h6" className="flex-grow-1" style={{ fontSize: "0.9rem" }}>
                      {item.name}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center p-5 border rounded">
            <p className="text-muted">표시할 아이템이 없습니다.</p>
          </div>
        )}
        {totalPages > 1 && (
          <Pagination className="justify-content-center mt-4 custom-pagination">
            <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <Pagination.Item key={num} active={num === currentPage} onClick={() => setCurrentPage(num)}>
                {num}
              </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
          </Pagination>
        )}
      </Col>
    </Row>
  );
};

export default AacItemList;
