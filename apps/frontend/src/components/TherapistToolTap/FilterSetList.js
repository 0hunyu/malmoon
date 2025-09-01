import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import './FilterSetList.css';

const FilterSetList = ({ filterSets, onEdit, onDelete }) => {
    if (!filterSets || filterSets.length === 0) {
        return (
            <div className="empty-list-placeholder">
                <h5>아직 필터 묶음이 없어요</h5>
                <p>새로운 필터 묶음을 추가하여 관리해보세요.</p>
            </div>
        );
    }

    const SetIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-collection item-title-icon" viewBox="0 0 16 16">
            <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6v7zm1.5.5A.5.5 0 0 1 1 13V6a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-13z"/>
        </svg>
    );

    return (
        <div className="filter-set-list-container">
            <div className="filter-set-list-group">
                {filterSets.map(set => (
                    <div key={set.filterSetId} className="filter-set-list-item">
                        <div className="list-item-content">
                            <div className="filter-set-text-content">
                                <div className="item-title-container">
                                    <SetIcon />
                                    <h5 className="filter-set-item-title">{set.name}</h5>
                                </div>
                                <p className="filter-set-item-description">{set.description}</p>
                            </div>
                            <div className="filter-set-actions">
                                <Button className="btn-tool-edit" onClick={() => onEdit(set)}>편집</Button>
                                <Button className="btn-tool-delete" onClick={() => onDelete(set.filterSetId)}>삭제</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilterSetList;