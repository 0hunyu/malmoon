import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import FilterSelector from './FilterSelector'; // 새로 만든 필터 선택기
import './FilterSetModal.css'; // Import the new CSS file

/**
 * 필터 묶음을 생성하거나 편집하는 모달 컴포넌트입니다.
 */
const FilterSetModal = ({ show, onHide, onSave, initialData, allFilters, getAuthHeader }) => {
    const [form, setForm] = useState({ name: '', description: '', filterIds: [] });
    const [loadingDetails, setLoadingDetails] = useState(false);

    // 수정 모드일 때, 묶음에 포함된 필터 목록을 가져오는 함수
    const fetchSetDetails = useCallback(async (setId) => {
        if (typeof getAuthHeader !== 'function') return;
        const headers = getAuthHeader();
        if (!headers) return;
        
        setLoadingDetails(true);
        try {
            const response = await fetch(`/api/v1/filters/sets/my/${setId}`, { headers });
            if (!response.ok) {
                throw new Error('필터 묶음 상세 정보를 불러오는데 실패했습니다.');
            }
            const itemsInSet = await response.json();
            const itemIds = itemsInSet.map(item => item.filterId);
            setForm(prev => ({ ...prev, filterIds: itemIds }));
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingDetails(false);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        if (show) {
            if (initialData) { // 수정 모드
                setForm({
                    id: initialData.filterSetId,
                    name: initialData.name,
                    description: initialData.description,
                    filterIds: [] // 상세 정보 로딩 전 초기화
                });
                fetchSetDetails(initialData.filterSetId);
            } else { // 생성 모드
                setForm({ name: '', description: '', filterIds: [] });
            }
        }
    }, [initialData, show, fetchSetDetails]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleFilter = (filterId) => {
        setForm(prev => {
            const newIds = (prev.filterIds || []).includes(filterId)
                ? (prev.filterIds || []).filter(id => id !== filterId)
                : [...(prev.filterIds || []), filterId];
            return { ...prev, filterIds: newIds };
        });
    };

    const handleSaveClick = () => {
        if (!form.name || !form.description) {
            alert('묶음 이름과 설명은 필수입니다.');
            return;
        }
        if ((form.filterIds || []).length === 0) {
            alert('하나 이상의 필터를 선택해야 합니다.');
            return;
        }
        onSave({
            id: form.id,
            name: form.name,
            description: form.description,
            filterIds: form.filterIds
        });
    };

    return (
        <Modal show={show} onHide={onHide} centered size="xl" className="filter-set-modal">
            <Modal.Header closeButton>
                <Modal.Title>{initialData ? '필터 묶음 편집' : '새 필터 묶음 추가'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingDetails ? (
                    <div className="text-center">
                        <Spinner animation="border" className="spinner-border" />
                        <p className="loading-text">묶음 정보를 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>묶음 이름</Form.Label>
                            <Form.Control type="text" name="name" value={form.name || ''} onChange={handleFormChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>설명</Form.Label>
                            <Form.Control as="textarea" name="description" value={form.description || ''} onChange={handleFormChange} />
                        </Form.Group>
                        <hr />
                        <h5 className="filter-selection-title">필터 선택 ({(form.filterIds || []).length}개 선택됨)</h5>
                        <FilterSelector
                            allFilters={allFilters}
                            selectedFilterIds={form.filterIds || []}
                            onToggleFilter={handleToggleFilter}
                        />
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-cancel" onClick={onHide}>취소</Button>
                <Button className="btn-save-add" onClick={handleSaveClick}>{initialData ? '저장' : '추가'}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FilterSetModal;

