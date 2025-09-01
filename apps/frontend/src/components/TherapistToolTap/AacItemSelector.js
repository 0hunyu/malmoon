import React, { useState, useMemo } from 'react';
import { Row, Col, Card, InputGroup, Form, Pagination } from 'react-bootstrap';

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


const AacItemSelector = ({ aacItems, selectedItemIds, onToggleItem }) => {
    const [searchCategory, setSearchCategory] = useState('name');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const filteredItems = useMemo(() => {
        if (!aacItems) return [];
        if (!searchTerm.trim()) return aacItems;
        return aacItems.filter(item => {
            const itemValue = item[searchCategory] ? item[searchCategory].toLowerCase() : '';
            return itemValue.includes(searchTerm.toLowerCase());
        });
    }, [aacItems, searchTerm, searchCategory]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <InputGroup className="mb-3">
                <Form.Select style={{flex: '0 0 120px'}} value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                    <option value="name">이름</option>
                    <option value="situation">상황</option>
                    <option value="action">행동</option>
                    <option value="emotion">감정</option>
                </Form.Select>
                <Form.Control placeholder="선택한 기준으로 검색..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </InputGroup>

            {currentItems.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '15px' }}>
                    <Row xs={1} sm={2} md={4} lg={5} className="g-3">
                        {currentItems.map(item => (
                            <Col key={item.id}>
                                <Card className={`h-100 text-center ${selectedItemIds.includes(item.id) ? 'border-primary' : ''}`} onClick={() => onToggleItem(item.id)} style={{ cursor: 'pointer' }}>
                                    <Card.Img 
                                        variant="top" 
                                        src={getCorrectedUrl(item.imageUrl) || 'https://placehold.co/150x100?text=No+Image'} 
                                        style={{ height: '100px', objectFit: 'cover' }} 
                                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x100?text=Error"; }}
                                    />
                                    <Card.Body className="p-2"><Card.Text style={{ fontSize: '0.8rem' }}>{item.name}</Card.Text></Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            ) : <p className="text-muted text-center">검색 결과가 없습니다.</p>}

            {totalPages > 1 && (
                <Pagination className="justify-content-center mt-3">
                    <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                    <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                </Pagination>
            )}
        </>
    );
};

export default AacItemSelector;
