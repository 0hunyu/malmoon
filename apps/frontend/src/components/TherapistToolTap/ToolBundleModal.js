import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup } from 'react-bootstrap';
import './ToolBundleModal.css'; // Import the new CSS file

const ToolBundleModal = ({ show, onHide, onSave, bundleData, allAacSets, allFilterSets }) => {
    // 백엔드 DTO에 맞춰 aacSetId, filterSetId를 단일 값으로 관리
    const [form, setForm] = useState({ name: '', description: '', aacSetId: null, filterSetId: null });

    useEffect(() => {
        if (bundleData) { // 수정 모드
            setForm({
                id: bundleData.toolBundleId,
                name: bundleData.name,
                description: bundleData.description,
                aacSetId: bundleData.aacSetId,
                filterSetId: bundleData.filterSetId
            });
        } else { // 생성 모드
            setForm({ name: '', description: '', aacSetId: null, filterSetId: null });
        }
    }, [bundleData, show]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // 단일 선택 로직으로 수정
    const handleSelect = (type, id) => {
        setForm(prev => ({
            ...prev,
            [type]: prev[type] === id ? null : id // 다시 클릭하면 선택 해제
        }));
    };
    
    const handleSaveClick = () => {
        if (!form.name || !form.description) {
            alert('세트 이름과 설명은 필수입니다.');
            return;
        }
        if (!form.aacSetId && !form.filterSetId) {
            alert('하나 이상의 AAC 묶음 또는 필터 묶음을 포함해야 합니다.');
            return;
        }
        onSave(form);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="tool-bundle-modal">
            <Modal.Header closeButton>
                <Modal.Title>{bundleData ? '수업 세트 편집' : '새 수업 세트 추가'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>세트 이름</Form.Label>
                    <Form.Control type="text" name="name" value={form.name || ''} onChange={handleFormChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>설명</Form.Label>
                    <Form.Control as="textarea" name="description" value={form.description || ''} onChange={handleFormChange} />
                </Form.Group>
                <Row>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>포함할 AAC 묶음 (1개 선택)</Form.Label>
                            <ListGroup className="list-group-selection">
                                {allAacSets.map(set => (
                                    <ListGroup.Item key={set.id} action active={form.aacSetId === set.id} onClick={() => handleSelect('aacSetId', set.id)}>
                                        {set.name}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>포함할 필터 묶음 (1개 선택)</Form.Label>
                            <ListGroup className="list-group-selection">
                                {allFilterSets.map(set => (
                                    <ListGroup.Item key={set.filterSetId} action active={form.filterSetId === set.filterSetId} onClick={() => handleSelect('filterSetId', set.filterSetId)}>
                                        {set.name}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Form.Group>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-cancel" onClick={onHide}>취소</Button>
                <Button className="btn-save-add" onClick={handleSaveClick}>{bundleData ? '저장' : '추가'}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ToolBundleModal;
