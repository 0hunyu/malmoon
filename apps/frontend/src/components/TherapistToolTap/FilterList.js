import React from 'react';
import { Row, Col } from 'react-bootstrap'; // Removed Card, Button as they are replaced by custom styles
import './FilterList.css'; // Import the new CSS file

const FilterList = ({ filters, onDelete }) => { // Removed onEdit prop
    if (!filters) {
        return null; // Or a loading indicator
    }

    const lensFilters = filters.filter(filter => filter.filterLensId !== null);
    const backgroundFilters = filters.filter(filter => filter.filterLensId === null);

    const renderFilterCard = (filter, isEditable) => (
        <Col key={filter.filterId} className="mb-4">
            <div className="filter-card">
                <img
                    src={filter.fileUrl || 'https://placehold.co/200x200?text=No+Img'}
                    alt={filter.name}
                    className="card-img-top"
                />
                {isEditable && (
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(filter.filterId)}
                        aria-label={`Delete ${filter.name}`}
                        title="삭제"
                    >
                        &times;
                    </button>
                )}
                <div className="card-body">
                    <p className="filter-name">{filter.name}</p>
                </div>
            </div>
        </Col>
    );

    return (
        <div className="filter-list-container">
            {/* 배경 필터 섹션 */}
            <div className="filter-section">
                <h3 className="section-title">나만의 배경 필터</h3>
                {backgroundFilters.length > 0 ? (
                    <Row xs={2} sm={3} md={4} lg={6} className="g-4">
                        {backgroundFilters.map(filter => renderFilterCard(filter, true))}
                    </Row>
                ) : (
                    <div className="empty-list-placeholder">
                       <h5>아직 필터가 없어요</h5>
                       <p>새로운 필터를 추가하여 치료 세션을 더욱 다채롭게 만들어보세요.</p>
                    </div>
                )}
            </div>

            {/* 렌즈 필터 섹션 */}
            {lensFilters.length > 0 && (
                <div className="filter-section">
                    <h3 className="section-title">기본 제공 렌즈 필터</h3>
                    <Row xs={2} sm={3} md={4} lg={6} className="g-4">
                        {lensFilters.map(filter => renderFilterCard(filter, false))}
                    </Row>
                </div>
            )}
        </div>
    );
};

export default FilterList;
