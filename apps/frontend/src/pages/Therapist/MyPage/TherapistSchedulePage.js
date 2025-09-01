import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Modal, Tab, Tabs, Image, Badge, Form } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid'; // 고유 ID 생성을 위해 사용
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TherapistSchedulePage.css';
import api from '../../../api/axios';

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function TherapistSchedulePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [schedules, setSchedules] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState('');
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeStartDate, setActiveStartDate] = useState(new Date());
    const [monthlyScheduledDates, setMonthlyScheduledDates] = useState(new Set());

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionRoomId, setSessionRoomId] = useState(null);

    // 도구 선택 모달 관련 상태
    const [showToolSelectionModal, setShowToolSelectionModal] = useState(false);
    const [currentSessionSchedule, setCurrentSessionSchedule] = useState(null); // 현재 수업 시작하려는 일정 정보
    const [selectedToolsForSession, setSelectedToolsForSession] = useState([]); // 현재 세션에 선택된 도구 ID 목록
    const [modalInnerTabKey, setModalInnerTabKey] = useState('aacSets'); // 도구 선택 모달 내 탭 상태

    // 동화책 관련 상태
    const [fairyTaleClassifications, setFairyTaleClassifications] = useState([]);
    const [selectedClassification, setSelectedClassification] = useState('');
    const [fairyTaleTitles, setFairyTaleTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedFairyTaleInfo, setSelectedFairyTaleInfo] = useState(null); // { title, minPage, maxPage }
    const [fairyTaleStartPage, setFairyTaleStartPage] = useState(1);
    const [fairyTaleEndPage, setFairyTaleEndPage] = useState(1);
    const [fairyTaleCurrentPage, setFairyTaleCurrentPage] = useState(1);

    // 모든 개별 도구 데이터 (AAC, Filter) 및 도구 묶음 (세트) 데이터
    const [allIndividualTools, setAllIndividualTools] = useState([]);
    const [allToolSets, setAllToolSets] = useState([]);

    // 월별 일정 불러오기 (캘린더 점 표시용)
    useEffect(() => {
        const fetchMonthlySchedules = async (date) => {
            if (!user || !user.accessToken) return;

            const year = date.getFullYear();
            const month = date.getMonth();
            const startDate = formatDate(new Date(year, month, 1));
            const endDate = formatDate(new Date(year, month + 1, 0));

            try {
                const response = await api.get(`/schedule?therapistId=${user.memberId}&startDate=${startDate}&endDate=${endDate}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                
                const scheduledDates = new Set(response.data.map(schedule => formatDate(new Date(schedule.date))));
                setMonthlyScheduledDates(scheduledDates);

            } catch (err) {
                // console.error('월별 일정 로딩 실패:', err);
            }
        };

        fetchMonthlySchedules(activeStartDate);
    }, [user, activeStartDate]);

    // 선택된 날짜의 상세 일정 불러오기
    useEffect(() => {
        const fetchSchedulesForDate = async () => {
            if (!user || !user.accessToken) {
                setDailyError('로그인이 필요합니다.');
                return;
            }
            setDailyLoading(true);
            setDailyError('');
            try {
                const dateString = formatDate(selectedDate);
                const response = await api.get(`/schedule/therapist/date?date=${dateString}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                setSchedules(response.data || []);
            } catch (err) {
                setDailyError('일정을 불러오는 데 실패했습니다.');
                setSchedules([]);
            } finally {
                setDailyLoading(false);
            }
        };

        fetchSchedulesForDate();
    }, [user, selectedDate]);

    // 도구 및 동화책 분류 불러오기 (초기 로딩)
    useEffect(() => {
        const fetchToolsAndFairyTales = async () => {
            if (!user || !user.accessToken) return;

            try {
                // AAC 묶음 (Tool Bundles) 불러오기
                const toolBundlesResponse = await api.get('/tool-bundles/my', {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                setAllToolSets(toolBundlesResponse.data || []);
            } catch (err) {
                console.error('Tool Bundles 로딩 실패:', err);
                setAllToolSets([]);
            }

            // 동화책 장르 목록 불러오기
            try {
                const response = await api.get('/storybooks/classifications', {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                setFairyTaleClassifications(response.data.classifications || []);
            } catch (err) {
                // console.error('동화책 장르 불러오기 오류:', err);
            }
        };
        fetchToolsAndFairyTales();
    }, [user]);

    // 선택된 장르가 변경될 때 동화책 제목 목록 불러오기
    useEffect(() => {
        if (!selectedClassification) {
            setFairyTaleTitles([]);
            setSelectedTitle('');
            setFairyTaleCurrentPage(1);
            return;
        }

        const fetchTitles = async () => {
            try {
                const response = await api.get(`/storybooks/titles?classification=${selectedClassification}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                setFairyTaleTitles(response.data.titles || []);
                setSelectedTitle(''); // 장르 변경 시 제목 선택 초기화
                setFairyTaleCurrentPage(1);
            } catch (err) {
                // console.error('동화책 제목 목록 불러오기 오류:', err);
            }
        };

        fetchTitles();
    }, [selectedClassification, user]);

    // 선택된 제목이 변경될 때 페이지 범위 불러오기
    useEffect(() => {
        if (!selectedTitle) {
            setSelectedFairyTaleInfo(null);
            return;
        }

        const fetchPageRange = async () => {
            try {
                                const response = await api.get(`/storybooks/pages?title=${encodeURIComponent(selectedTitle)}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                console.log("DEBUG: /storybooks/pages API response data:", response.data);
                const { minPage, maxPage, storybookId } = response.data;
                setSelectedFairyTaleInfo({ title: selectedTitle, minPage, maxPage, storybookId });
                setFairyTaleStartPage(minPage);
                setFairyTaleEndPage(maxPage);
            } catch (err) {
                // console.error('페이지 범위 불러오기 오류:', err);
                setSelectedFairyTaleInfo({ title: selectedTitle, minPage: 1, maxPage: 1 });
                setFairyTaleStartPage(1);
                setFairyTaleEndPage(1);
            }
        };

        fetchPageRange();
    }, [selectedTitle, user]);

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = formatDate(date);
            if (monthlyScheduledDates.has(dateString)) {
                return <div className="dot-marker-container"><span className="dot-marker schedule-marker"></span></div>;
            }
        }
        return null;
    };

    // 수업 시작 가능 여부 확인 함수
    const isSessionReady = (scheduleTime) => {
        const now = new Date();
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        const scheduleDateTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes);
        const diffMinutes = (scheduleDateTime.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes <= 30 && diffMinutes >= -60;
    };

    // '수업 시작' 버튼 클릭 핸들러: 도구 선택 모달 표시
    const handleStartSessionClick = (schedule) => {
        setCurrentSessionSchedule(schedule);
        setSelectedToolsForSession(schedule.assignedTools || []); // assignedTools는 현재 더미 데이터에만 있음
        setModalInnerTabKey('aacSets');
        setShowToolSelectionModal(true);
    };

    // 도구 선택 모달 내 도구/묶음 선택 핸들러
    const handleToolSelectionInModal = (toolId) => {
        setSelectedToolsForSession(prev =>
            prev.includes(toolId)
                ? [] // 이미 선택된 항목이면 선택 해제
                : [toolId] // 아니면 단독으로 선택
        );
    };

    // 도구 선택 모달에서 '수업 시작 (방 생성)' 버튼 클릭 핸들러
    const handleCreateSessionRoom = () => {
        if (!currentSessionSchedule) {
            alert('시작할 수업 일정이 선택되지 않았습니다.');
            return;
        }

        // --- 이 부분을 추가해주세요 ---
        console.log("DEBUG: currentSessionSchedule:", currentSessionSchedule);
        console.log("DEBUG: currentSessionSchedule.memberId:", currentSessionSchedule.memberId);
        console.log("DEBUG: selectedFairyTaleInfo:", selectedFairyTaleInfo);
        console.log("DEBUG: selectedFairyTaleInfo.storybookId:", selectedFairyTaleInfo?.storybookId);
        // --- 여기까지 추가 ---

        const roomId = uuidv4();
        // console.log(`RTC 방 생성 요청: ${roomId}, 선택된 도구:`, selectedToolsForSession);

        setSessionRoomId(roomId);
        setIsSessionActive(true);

        setShowToolSelectionModal(false);

        let navPath = `/session/${roomId}?clientId=${currentSessionSchedule.memberId}&tools=${selectedToolsForSession.join(',')}`;
        if (selectedFairyTaleInfo) {
            navPath += `&fairyTaleTitle=${encodeURIComponent(selectedFairyTaleInfo.title)}&fairyTaleClassification=${selectedClassification}&startPage=${fairyTaleStartPage}&endPage=${fairyTaleEndPage}&storybookId=${selectedFairyTaleInfo.storybookId}`;
        }
        navigate(navPath);
    };

    // 동화책 페이지네이션 로직
    const fairyTalesPerPage = 5;
    const totalFairyTalePages = Math.ceil(fairyTaleTitles.length / fairyTalesPerPage);
    const paginatedFairyTaleTitles = fairyTaleTitles.slice(
        (fairyTaleCurrentPage - 1) * fairyTalesPerPage,
        fairyTaleCurrentPage * fairyTalesPerPage
    );

    const handleFairyTalePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalFairyTalePages) {
            setFairyTaleCurrentPage(pageNumber);
        }
    };

    if (!user || user.userType !== 'therapist') {
        return (
            <Container className="my-5 text-center">
                <Alert variant="warning">치료사만 접근할 수 있는 페이지입니다.</Alert>
            </Container>
        );
    }

    const aacTools = allIndividualTools.filter(tool => tool.type === 'AAC');
    const filterTools = allIndividualTools.filter(tool => tool.type === 'Filter');

    return (
        <Container fluid className="therapist-schedule-page-container">
      <Row className="h-100">
        <Col md={5} className="calendar-panel d-flex flex-column p-4">
          {isSessionActive && (
            <Alert variant="success" className="mb-4">
              현재 수업이 진행 중입니다! 방 ID: {sessionRoomId}
            </Alert>
          )}
          <Card className="shadow-sm card-base calendar-card flex-grow-1">
            <Card.Body className="d-flex flex-column">
              <div className="title-container mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title">치료 일정</h2>
                <Button
                  className="btn-soft-primary ms-auto"
                  onClick={() => navigate("/therapist/register-schedule")}
                >
                  일정 등록
                </Button>
              </div>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                onActiveStartDateChange={({ activeStartDate }) =>
                  setActiveStartDate(activeStartDate)
                }
                activeStartDate={activeStartDate}
                tileContent={tileContent}
                className="react-calendar-custom"
                locale="ko-KR"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={7} className="schedule-detail-panel p-4">
          <Card className="shadow-sm p-3 card-base schedule-list-card flex-grow-1">
            <Card.Body>
              <div className="selected-date-display mb-3 position-relative text-center">
                <span>
                  {selectedDate.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                  요일 일정
                </span>
                {schedules.length > 0 && (
                  <Badge className="count-badge">총 {schedules.length}건</Badge>
                )}
              </div>
              {dailyLoading ? (
                <p>일정을 불러오는 중...</p>
              ) : dailyError ? (
                <Alert variant="danger">{dailyError}</Alert>
              ) : schedules.length === 0 ? (
                <Alert variant="info" className="text-center">
                  등록된 일정이 없습니다.
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {schedules
                    .sort((a, b) => a.time - b.time)
                    .map((schedule) => {
                      return (
                        <ListGroup.Item
                          key={`${schedule.clientId}-${schedule.time}`}
                          className="schedule-item-card mb-3"
                        >
                          <Row className="align-items-center">
                            <Col xs={8}>
                              <div className="schedule-info">
                                <div className="schedule-time">{`${
                                  schedule.memberName
                                } - ${String(schedule.time).padStart(
                                  2,
                                  "0"
                                )}:00`}</div>
                              </div>
                            </Col>
                            <Col xs={4} className="text-end">
                              <Button
                                className="btn-soft-primary"
                                onClick={() =>
                                  handleStartSessionClick(schedule)
                                }
                                disabled={isSessionActive}
                                size="sm"
                              >
                                수업 시작
                              </Button>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      );
                    })}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>


            <Modal show={showToolSelectionModal} onHide={() => setShowToolSelectionModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{currentSessionSchedule ? `'${currentSessionSchedule.memberName}'님과의 수업 도구 선택` : '수업에 사용할 도구 선택'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs
                        id="tool-selection-for-session-tabs"
                        activeKey={modalInnerTabKey}
                        onSelect={(k) => setModalInnerTabKey(k)}
                        className="mb-3"
                        justify
                    >
                        <Tab eventKey="aacSets" title="도구 세트">
                            <div className="p-3">
                                {allToolSets.length === 0 ? (
                                    <Alert variant="info">등록된 도구 세트가 없습니다.</Alert>
                                ) : (
                                    <ListGroup>
                                        {allToolSets.map(set => (
                                            <ListGroup.Item
                                                key={set.toolBundleId} // Use toolBundleId as key
                                                action
                                                onClick={() => handleToolSelectionInModal(String(set.toolBundleId))} // Convert to string
                                                active={selectedToolsForSession.includes(String(set.toolBundleId))}
                                            >
                                                {set.name} - {set.description}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                            </div>
                        </Tab>
                        <Tab eventKey="fairyTale" title="동화 선택">
                            <div className="p-3">
                                <Form.Group className="mb-3">
                                    <Form.Label>동화 장르 선택</Form.Label>
                                    <Form.Select
                                        value={selectedClassification}
                                        onChange={(e) => setSelectedClassification(e.target.value)}
                                    >
                                        <option value="">장르를 선택하세요</option>
                                        {fairyTaleClassifications.map(c => <option key={c} value={c}>{c}</option>)}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>동화 제목 선택</Form.Label>
                                    {!selectedClassification ? (
                                        <Alert variant="light">먼저 장르를 선택해주세요.</Alert>
                                    ) : fairyTaleTitles.length > 0 ? (
                                        <>
                                            <ListGroup className="fairy-tale-title-list mb-3">
                                                {paginatedFairyTaleTitles.map(title => (
                                                    <ListGroup.Item
                                                        key={title}
                                                        action
                                                        active={selectedTitle === title}
                                                        onClick={() => setSelectedTitle(title)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {title}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                            {totalFairyTalePages > 1 && (
                                                <div className="d-flex justify-content-center align-items-center">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => handleFairyTalePageChange(fairyTaleCurrentPage - 1)}
                                                        disabled={fairyTaleCurrentPage === 1}
                                                    >
                                                        이전
                                                    </Button>
                                                    <span className="mx-3">
                                                        {fairyTaleCurrentPage} / {totalFairyTalePages}
                                                    </span>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => handleFairyTalePageChange(fairyTaleCurrentPage + 1)}
                                                        disabled={fairyTaleCurrentPage === totalFairyTalePages}
                                                    >
                                                        다음
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Alert variant="light">해당 장르에 동화책이 없습니다.</Alert>
                                    )}
                                </Form.Group>

                                {selectedFairyTaleInfo && (
                                    <Card className="mt-3 p-3 shadow-sm">
                                        <Card.Title>{selectedFairyTaleInfo.title}</Card.Title>
                                        <Card.Text>총 페이지: {selectedFairyTaleInfo.maxPage} 페이지</Card.Text>
                                        <Row>
                                            <Col>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>시작 페이지</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={fairyTaleStartPage}
                                                        onChange={(e) => setFairyTaleStartPage(Math.max(selectedFairyTaleInfo.minPage, Math.min(parseInt(e.target.value), selectedFairyTaleInfo.maxPage)))}
                                                        min={selectedFairyTaleInfo.minPage}
                                                        max={selectedFairyTaleInfo.maxPage}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>끝 페이지</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={fairyTaleEndPage}
                                                        onChange={(e) => setFairyTaleEndPage(Math.max(fairyTaleStartPage, Math.min(parseInt(e.target.value), selectedFairyTaleInfo.maxPage)))}
                                                        min={fairyTaleStartPage}
                                                        max={selectedFairyTaleInfo.maxPage}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                    <div className="mt-3 p-3 border-top">
                        <p>현재 수업에 선택된 도구 ({selectedToolsForSession.length}개) 및 동화:</p>
                        <div className="d-flex flex-wrap">
                            {selectedToolsForSession.length === 0 && !selectedFairyTaleInfo ? (
                                <Badge bg="secondary">선택된 항목이 없습니다.</Badge>
                            ) : (
                                <>
                                    {selectedToolsForSession.map(toolId => {
                                        const toolSet = allToolSets.find(set => String(set.toolBundleId) === toolId);
                                        if (toolSet) {
                                            return (
                                                <Badge key={toolId} bg="primary" className="me-2 mb-2">
                                                    {toolSet.name}
                                                    <Button variant="link" className="p-0 ms-2 text-decoration-none" style={{ color: 'white', fontSize: '0.8em' }} onClick={() => handleToolSelectionInModal(toolId)}>&times;</Button>
                                                </Badge>
                                            );
                                        }
                                        return null;
                                    })}
                                    {selectedFairyTaleInfo && (
                                        <Badge bg="info" className="me-2 mb-2">
                                            {selectedFairyTaleInfo.title} ({fairyTaleStartPage}p ~ {fairyTaleEndPage}p)
                                            <Button variant="link" className="p-0 ms-2 text-decoration-none" style={{ color: 'white', fontSize: '0.8em' }} onClick={() => { setSelectedTitle(''); setSelectedFairyTaleInfo(null); }}>&times;</Button>
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => setShowToolSelectionModal(false)}>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleCreateSessionRoom} disabled={selectedToolsForSession.length === 0 && !selectedFairyTaleInfo}>
                        수업 시작 (방 생성)
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default TherapistSchedulePage;
