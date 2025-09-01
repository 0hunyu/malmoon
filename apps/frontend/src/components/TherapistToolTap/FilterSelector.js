import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

/**
 * 필터 묶음에 포함할 필터를 선택하는 컴포넌트입니다.
 * @param {object} props - allFilters, selectedFilterIds, onToggleFilter를 포함하는 객체
 */
const FilterSelector = ({ allFilters, selectedFilterIds, onToggleFilter }) => {
    if (!allFilters || allFilters.length === 0) {
        return <p className="text-muted text-center">선택할 수 있는 필터가 없습니다. 먼저 필터를 추가해주세요.</p>;
    }

    return (
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '15px' }}>
            <Row xs={1} sm={2} md={4} lg={5} className="g-3">
                {allFilters.map(filter => (
                    <Col key={filter.filterId}>
                        <Card 
                            className={`h-100 text-center ${selectedFilterIds.includes(filter.filterId) ? 'border-primary' : ''}`} 
                            onClick={() => onToggleFilter(filter.filterId)} 
                            style={{ cursor: 'pointer' }}
                        >
                            <Card.Img 
                                variant="top" 
                                src={filter.fileUrl || 'https://placehold.co/150x100?text=No+Image'} 
                                style={{ height: '100px', objectFit: 'cover' }} 
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x100?text=Error"; }}
                            />
                            <Card.Body className="p-2">
                                <Card.Text style={{ fontSize: '0.8rem' }}>{filter.name}</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default FilterSelector;
