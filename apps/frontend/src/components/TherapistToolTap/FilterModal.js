import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Image } from 'react-bootstrap';
import './FilterModal.css'; // Import the new CSS file

const FilterModal = ({ show, onHide, onSave, filterData }) => {
    // filterLensId 상태 제거
    const [form, setForm] = useState({ name: '' });
    const [imagePreview, setImagePreview] = useState('');
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (filterData) {
            setForm({ 
                name: filterData.name, 
            });
            if (filterData.fileUrl) setImagePreview(filterData.fileUrl);
        } else {
            setForm({ name: '' });
        }
        if (!show) {
            setImagePreview('');
            setImageFile(null);
        }
    }, [filterData, show]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveClick = () => {
        if (!form.name || (!imageFile && !filterData)) {
            alert('필터 이름과 이미지는 필수입니다.');
            return;
        }
        // filterLensId를 전달하지 않도록 수정
        onSave({ ...form, imageFile, id: filterData?.filterId });
    };

    return (
        <Modal show={show} onHide={onHide} centered className="filter-modal">
            <Modal.Header closeButton>
                <Modal.Title>{filterData ? '필터 편집' : '새 필터 추가'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>필터 이름</Form.Label>
                    <Form.Control type="text" name="name" value={form.name || ''} onChange={handleFormChange} />
                </Form.Group>
                {/* 필터 렌즈 ID 입력 필드 완전 제거 */}
                <Form.Group className="mb-3">
                    <Form.Label>이미지</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                    {imagePreview && <Image src={imagePreview} className="image-preview" fluid thumbnail />}
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-cancel" onClick={onHide}>취소</Button>
                <Button className="btn-save-add" onClick={handleSaveClick}>{filterData ? '저장' : '추가'}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FilterModal;

