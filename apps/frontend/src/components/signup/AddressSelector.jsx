import React, { useEffect, useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function AddressSelector({ address, onChange, error }) {
  const [data, setData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dongs, setDongs] = useState([]);

  useEffect(() => {
    axios.get('/data/addressData.json')
      .then((res) => setData(res.data))
      .catch((err) => console.error('주소 데이터 로드 실패:', err));
  }, []);

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    const cityObj = data.find(c => c.city === selectedCity);
    setDistricts(cityObj ? cityObj.districts : []);
    setDongs([]);
    onChange({
      city: selectedCity,
      district: '',
      dong: '',
      detail: '',
    });
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    const cityObj = data.find(c => c.city === address.city);
    const districtObj = cityObj?.districts.find(d => d.district === selectedDistrict);
    setDongs(districtObj ? districtObj.dongs : []);
    onChange({
      ...address,
      district: selectedDistrict,
      dong: '',
      detail: '',
    });
  };

  const handleDongChange = (e) => {
    onChange({
      ...address,
      dong: e.target.value,
    });
  };

  const handleDetailChange = (e) => {
    const value = e.target.value.slice(0, 30); // ✅ 30자 제한
    onChange({
      ...address,
      detail: value,
    });
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>주소 선택</Form.Label>
      <Row className="mb-2">
        <Col>
          <Form.Select
            value={address.city}
            onChange={handleCityChange}
            isInvalid={!!error}
          >
            <option value="">시/도 선택</option>
            {data.map((c) => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
          </Form.Select>
        </Col>
        <Col>
          <Form.Select
            value={address.district}
            onChange={handleDistrictChange}
            disabled={!address.city}
            isInvalid={!!error}
          >
            <option value="">구/군 선택</option>
            {districts.map((d) => (
              <option key={d.district} value={d.district}>{d.district}</option>
            ))}
          </Form.Select>
        </Col>
        <Col>
          <Form.Select
            value={address.dong}
            onChange={handleDongChange}
            disabled={!address.district}
            isInvalid={!!error}
          >
            <option value="">동 선택</option>
            {dongs.map((dong) => (
              <option key={dong} value={dong}>{dong}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* 상세 주소 입력 필드 (30자 제한 적용됨) */}
      <Form.Control
        type="text"
        placeholder="상세 주소 (예: 아파트 이름, 동/호수)"
        value={address.detail}
        maxLength={30}
        onChange={handleDetailChange}
      />

      {error && <div className="text-danger small mt-1">{error}</div>}
    </Form.Group>
  );
}

export default AddressSelector;
