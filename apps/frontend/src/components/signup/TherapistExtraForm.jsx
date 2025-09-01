import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';

function TherapistExtraForm({
  formData,
  setFormData,
  handleChange,
  handleCareerChange,
  handleAddCareer,
  handleRemoveCareer,
  errors,
}) {
  return (
    <div>
      <h5>자격 및 경력 정보</h5>

      <Form.Group controlId="qualification_image_file" className="mb-3">
        <Form.Label>자격증 이미지</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file && file.size > 5 * 1024 * 1024) {
              alert('⚠️ 자격증 파일은 5MB 이하만 업로드 가능합니다.');
              return;
            }
            setFormData((prev) => ({ ...prev, qualification_image_file: file }));
          }}
          isInvalid={!!errors.qualification_image_file}
        />
        <Form.Control.Feedback type="invalid">
          {errors.qualification_image_file}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="careerYears" className="mb-3">
        <Form.Label>총 경력 연차</Form.Label>
        <Form.Control
          type="number"
          name="careerYears"
          value={formData.careerYears}
          onChange={handleChange}
          isInvalid={!!errors.careerYears}
          min={0}
        />
        <Form.Control.Feedback type="invalid">
          {errors.careerYears}
        </Form.Control.Feedback>
      </Form.Group>

      <h6>경력 목록</h6>
      {formData.careerHistory.map((career, index) => (
        <div key={index} className="border rounded p-3 mb-3">
          <Row className="mb-2">
            <Col>
              <Form.Label>기관명</Form.Label>
              <Form.Control
                type="text"
                value={career.company}
                onChange={(e) => handleCareerChange(index, 'company', e.target.value)}
                isInvalid={!!errors[`career-${index}-company`]}
              />
              <Form.Control.Feedback type="invalid">
                {errors[`career-${index}-company`]}
              </Form.Control.Feedback>
            </Col>
            <Col>
              <Form.Label>직책</Form.Label>
              <Form.Control
                type="text"
                value={career.position}
                onChange={(e) => handleCareerChange(index, 'position', e.target.value)}
                isInvalid={!!errors[`career-${index}-position`]}
              />
              <Form.Control.Feedback type="invalid">
                {errors[`career-${index}-position`]}
              </Form.Control.Feedback>
            </Col>
          </Row>

          <Row>
            <Col>
              <Form.Label>시작일</Form.Label>
              <Form.Control
                type="date"
                value={career.startDate}
                onChange={(e) => handleCareerChange(index, 'startDate', e.target.value)}
                max="2099-12-31"
                onInput={(e) => {
                  if (!/^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(e.target.value)) {
                    e.preventDefault();
                  }
                }}
                isInvalid={!!errors[`career-${index}-startDate`]}
              />
              <Form.Control.Feedback type="invalid">
                {errors[`career-${index}-startDate`]}
              </Form.Control.Feedback>
            </Col>
            <Col>
              <Form.Label>종료일</Form.Label>
              <Form.Control
                type="date"
                value={career.endDate}
                onChange={(e) => handleCareerChange(index, 'endDate', e.target.value)}
                max="2099-12-31"
                onInput={(e) => {
                  if (!/^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(e.target.value)) {
                    e.preventDefault();
                  }
                }}
              />
            </Col>
          </Row>

          {formData.careerHistory.length > 1 && (
            <div className="text-end mt-2">
              <Button variant="danger" size="sm" onClick={() => handleRemoveCareer(index)}>
                삭제
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="text-end">
        <Button variant="secondary" size="sm" onClick={handleAddCareer}>
          + 경력 추가
        </Button>
      </div>
    </div>
  );
}

export default TherapistExtraForm;
