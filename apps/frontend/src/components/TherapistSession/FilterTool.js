import React, { useState } from 'react';
import { Button, Card, Row, Col } from 'react-bootstrap';
import './FilterTool.css';

function FilterTool({
  selectedBackgroundImage, // 부모로부터 받은, 현재 "실제로 적용된" 필터 이미지 URL
  isFilterActive,
  applyBackgroundFilter,   // 필터 적용 함수
  removeBackgroundFilter,  // 필터 제거 함수
  applyLensById,
  allFilters,
  activeLensId, // 새로 추가된 prop: 현재 적용된 렌즈 필터의 ID
}) {
  // 사용자가 선택했지만 아직 적용은 안 한 필터 (이 컴포넌트가 가져야 할 유일한 상태)
  const [stagedFilter, setStagedFilter] = useState(null);
  // 렌즈 필터용 staged 상태
  const [stagedLensId, setStagedLensId] = useState(null);
  // 알림 메시지 상태
  const [notification, setNotification] = useState('');

  // 알림 메시지를 2초간 보여주는 헬퍼 함수
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification('');
    }, 2000);
  };

  // --- 로직 재설계: 불필요한 state와 useEffect를 제거하고 props로부터 직접 값을 계산 ---

  // "현재 적용된 필터"의 ID를 props를 기반으로 매 렌더링 시 계산합니다.
  const appliedFilter = allFilters.find(f => f.imageUrl === selectedBackgroundImage);
  const appliedFilterId = appliedFilter ? String(appliedFilter.filterId) : null;

  // 사용자가 필터 썸네일을 클릭했을 때 (선택/선택해제)
  const handleFilterSelection = (filterId, imageUrl) => {
    const newFilterId = String(filterId);
    // 이미 선택된 필터를 다시 클릭하면 선택 해제
    if (stagedFilter && stagedFilter.filterId === newFilterId) {
      setStagedFilter(null);
    } else {
      // 새로운 필터를 선택
      setStagedFilter({ filterId: newFilterId, imageUrl });
    }
  };

  // [필터 적용] 버튼 클릭 핸들러
  const handleApplyFilter = () => {
    if (stagedFilter) {
      applyBackgroundFilter(stagedFilter.imageUrl);
      showNotification('필터가 적용되었습니다.');
    }
  };

  // [필터 제거] 버튼 클릭 핸들러
  const handleRemoveFilterClick = () => {
    removeBackgroundFilter();
    setStagedFilter(null);
    showNotification('필터가 제거되었습니다.');
  };

  // 렌즈 필터 클릭 핸들러
  const handleLensClick = (lensId) => {
    setStagedLensId(lensId);
    applyLensById(lensId);
  };

  // [필터 적용] 버튼 활성화 조건: 선택된(staged) 필터가 있고, 그 필터가 현재 적용된 필터와 다를 때
  const isApplyButtonEnabled = stagedFilter && stagedFilter.filterId !== appliedFilterId;

  return (
    <div className="p-2" style={{ position: 'relative', height: '100%' }}>
      {/* 알림 창 렌더링 */}
      {notification && (
        <div className="filter-notification show">
          {notification}
        </div>
      )}

      <h6 className="text-center mb-3">배경 필터 선택</h6>
      <Row xs={2} className="g-2 text-center">
        {allFilters.filter(f => !f.filterLensId).map(filter => {
          const filterIdStr = String(filter.filterId);
          // "적용됨"과 "선택됨" 상태를 props와 state로부터 직접 판단
          const isApplied = appliedFilterId === filterIdStr;
          const isStaged = stagedFilter && stagedFilter.filterId === filterIdStr;
          
          let cardClass = 'filter-thumb-card';
          if (isApplied) {
            cardClass += ' active-applied'; // 현재 적용된 필터
          } else if (isStaged) {
            cardClass += ' active-staged'; // 선택되었지만 아직 적용되지 않은 필터
          }

          return (
            <Col key={filter.filterId}>
              <Card
                onClick={() => handleFilterSelection(filter.filterId, filter.imageUrl)}
                className={cardClass}
              >
                <Card.Img variant="top" src={filter.imageUrl} style={{height: '80px', objectFit: 'cover'}} />
                <Card.Body className="p-1"><Card.Text>{filter.name}</Card.Text></Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <div className="d-grid gap-2 mt-3">
        <Button variant="primary" onClick={handleApplyFilter} disabled={!isApplyButtonEnabled}>
          필터 적용
        </Button>
        <Button variant="secondary" onClick={handleRemoveFilterClick} disabled={!isFilterActive}>
          필터 제거
        </Button>
      </div>

      <hr />
      <h6 className="text-center mb-3">렌즈 필터</h6>
      <Row xs={2} className="g-2 text-center">
        {allFilters
          .filter(filter => filter.filterLensId)
          .map(filter => {
            const isLensApplied = activeLensId && activeLensId === filter.filterLensId;
            const isLensStaged = stagedLensId === filter.filterLensId;

            let cardClass = 'filter-thumb-card';
            if (isLensApplied) {
              cardClass += ' active-applied';
            } else if (isLensStaged) {
              cardClass += ' active-staged';
            }

            return (
              <Col key={filter.filterId}>
                <Card
                  onClick={() => handleLensClick(filter.filterLensId)}
                  className={cardClass}
                >
                  <Card.Img variant="top" src={filter.imageUrl} style={{height: '80px', objectFit: 'cover'}} />
                  <Card.Body className="p-1"><Card.Text>{filter.name}</Card.Text></Card.Body>
                </Card>
              </Col>
            );
          })
        }
      </Row>
    </div>
  );
}

export default FilterTool;
