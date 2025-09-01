import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';

// 컴포넌트 import 경로
import AacItemList from '../../../components/TherapistToolTap/AacItemList';
import AacSetList from '../../../components/TherapistToolTap/AacSetList';
import FilterList from '../../../components/TherapistToolTap/FilterList';
import FilterSetList from '../../../components/TherapistToolTap/FilterSetList';
import ToolBundleList from '../../../components/TherapistToolTap/ToolBundleList';
import AacItemModal from '../../../components/TherapistToolTap/AacItemModal';
import AacSetModal from '../../../components/TherapistToolTap/AacSetModal';
import FilterModal from '../../../components/TherapistToolTap/FilterModal';
import FilterSetModal from '../../../components/TherapistToolTap/FilterSetModal';
import ToolBundleModal from '../../../components/TherapistToolTap/ToolBundleModal';
import AacItemDetailModal from '../../../components/TherapistToolTap/AacItemDetailModal';

import api from '../../../api/axios'

// CSS 임포트
import './TherapistToolsPage.css';

function TherapistToolsPage() {
    // 상태 관리
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [aacItems, setAacItems] = useState([]);
    const [aacSets, setAacSets] = useState([]);
    const [filters, setFilters] = useState([]);
    const [filterSets, setFilterSets] = useState([]);
    const [toolBundles, setToolBundles] = useState([]);
    const [modalState, setModalState] = useState({ type: null, data: null });
    
    const [refreshKey, setRefreshKey] = useState(0);

    const getAuthHeader = useCallback(() => {
        const storedUserString = localStorage.getItem('currentUser');
        const storedUser = storedUserString ? JSON.parse(storedUserString) : null;
        const token = storedUser?.accessToken;
        
        if (!token) {
            setError("로그인이 필요합니다. 로그인 페이지로 이동해주세요.");
            setLoading(false);
            return null;
        }
        return { 'Authorization': `Bearer ${token}` };
    }, []);
    
    // 데이터 로드 함수들 (API 연동)
    const loadAacItems = useCallback(async (headers) => {
        const response = await fetch('/api/v1/aacs?page=0&size=1000', { headers });
        if (!response.ok) throw new Error('AAC 아이템 목록 로딩 실패');
        const data = await response.json();
        setAacItems(data.content.map(item => ({ ...item, imageUrl: item.fileUrl })));
    }, []);

    const loadAacSets = useCallback(async (headers) => {
        const response = await fetch('/api/v1/aacs/sets/my', { headers });
        if (!response.ok) throw new Error('AAC 묶음 목록 로딩 실패');
        setAacSets(await response.json());
    }, []);

    // [수정] 필터 로드 로직을 AAC 아이템과 유사하게 단순화
    const loadFilters = useCallback(async (headers) => {
        const response = await fetch('/api/v1/filters', { headers });
        if (!response.ok) throw new Error('필터 목록 로딩 실패');
        const data = await response.json();
        // 백엔드에서 내려주는 fileUrl을 바로 사용
        setFilters(data.filters || []);
        console.log("서버로부터 받은 필터 목록:", data.filters);
    }, []);


    const loadFilterSets = useCallback(async (headers) => {
        const response = await fetch('/api/v1/filters/sets/my', { headers });
        if (response.status === 404) {
            console.warn("필터 묶음 API(/api/v1/filters/sets/my)를 찾을 수 없습니다. 백엔드 서버를 확인해주세요.");
            setFilterSets([]); // 404 오류 시 빈 배열로 설정하여 앱 중단 방지
            return;
        }
        if (!response.ok) throw new Error('필터 묶음 목록 로딩 실패');
        setFilterSets(await response.json());
    }, []);

    const loadToolBundles = useCallback(async (headers) => {
        const response = await fetch('/api/v1/tool-bundles/my', { headers });
        if (!response.ok) throw new Error('수업 세트 목록 로딩 실패');
        setToolBundles(await response.json());
    }, []);

    // 페이지 초기화 (모든 데이터 로드)
    useEffect(() => {
        const initializePage = async () => {
            setLoading(true);
            setError('');
            const headers = getAuthHeader();
            if (headers) {
                try {
                    const userResponse = await fetch('/api/v1/members/me', { headers });
                    if (!userResponse.ok) throw new Error("사용자 정보 로딩 실패");
                    setCurrentUser(await userResponse.json());

                    await Promise.all([
                        loadAacItems(headers),
                        loadAacSets(headers),
                        loadFilters(headers),
                        loadFilterSets(headers),
                        loadToolBundles(headers)
                    ]);
                    
                } catch (e) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            }
        };
        initializePage();
    }, [getAuthHeader, refreshKey, loadAacItems, loadAacSets, loadFilters, loadFilterSets, loadToolBundles]);

    const forceRefresh = () => setRefreshKey(prevKey => prevKey + 1);
    
    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });
    const handleViewDetails = (item) => openModal('AAC_item_detail', item);

    // 공통 API 요청 함수
    const apiRequest = async (url, method, body, isFormData = false) => {
        const headers = getAuthHeader();
        if (!headers) return;
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const options = { method, headers };
        if (body) {
            options.body = isFormData ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `${method} 요청 실패: ${url}`);
        }
        return response;
    };

    // 필터 핸들러 (API 연동)
    const handleSaveFilter = async (filterToSave) => {
        try {
            const formData = new FormData();
            formData.append('name', filterToSave.name);
            
            if (filterToSave.imageFile) {
                formData.append('filter', filterToSave.imageFile);
            }
            
            await apiRequest('/api/v1/filters', 'POST', formData, true);
            closeModal();
            forceRefresh();
        } catch (e) { setError(e.message); }
    };

    const handleDeleteFilter = async (filterId) => {
        if (window.confirm('정말로 이 필터를 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/api/v1/filters?filterId=${filterId}`, 'DELETE');
                forceRefresh();
            } catch(e) { setError(e.message); }
        }
    };


    // AAC 아이템 핸들러
    // const handleSaveAacItem = async (itemToSave) => {
    //     try {
    //         const formData = new FormData();
    //         Object.keys(itemToSave).forEach(key => {
    //             if (key === 'imageFile' && itemToSave[key]) {
    //                 formData.append('file', itemToSave[key]);
    //             } else if (key !== 'imageFile' && itemToSave[key] !== null) {
    //                 formData.append(key, itemToSave[key]);
    //             }
    //         });
    //         await apiRequest('/api/v1/aacs/custom', 'POST', formData, true);
    //         closeModal();
    //         forceRefresh();
    //     } catch (e) { setError(e.message); }
    // };

    // AAC 아이템 핸들러 (모달이 생성까지 끝내고 '호출'만 해줌)
    const handleSaveAacItem = async () => {
    try {
        closeModal();     // 모달 닫고
        forceRefresh();   // 목록 새로고침 트리거
    } catch (e) {
        setError(e.message);
    }
    };

    const handleDeleteAacItem = async (itemId) => {
        if (window.confirm('정말로 이 AAC 아이템을 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/api/v1/aacs/custom/${itemId}`, 'PATCH');
                forceRefresh();
            } catch(e) { setError(e.message); }
        }
    };
    
    const handleGenerateAacImage = async (promptData) => {
        //const AI_SERVER_URL = 'http://localhost:8000';
        try {
            //const response = await apiRequest('/api/v1/aacs/generate', 'POST', promptData);
            //const response2 = await api.post('/aacs/generate', promptData);
            const { data } = await api.post('/aacs/generate', promptData); // baseURL: '/api/v1' 가정
            const url =
            (data && (data.previewUrl || data.preview_url)) ??
            (typeof data === 'string' ? data : null);

            if (!url) throw new Error('미리보기 URL이 응답에 없습니다.');
            return url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
            
            //const result = await response.json();
            //return AI_SERVER_URL + result.previewUrl;
        } catch (error) {
            const msg = error?.response?.data?.message || error.message || '이미지 생성 실패';
            throw new Error(msg);
        }
    };

    // AAC 묶음 핸들러
    const handleSaveAacSet = async (set) => {
        const isEditing = !!set.id;
        const url = isEditing ? `/api/v1/aacs/sets/${set.id}` : '/api/v1/aacs/sets/create';
        const method = isEditing ? 'PATCH' : 'POST';
        const payload = { name: set.name, description: set.description, aacItemIds: set.aacItemIds };
        try {
            await apiRequest(url, method, payload);
            closeModal();
            forceRefresh();
        } catch (e) { setError(e.message); }
    };
    
    const handleDeleteAacSet = async (setId) => {
        if (window.confirm('정말로 이 AAC 묶음을 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/api/v1/aacs/sets/${setId}`, 'DELETE');
                forceRefresh();
            } catch(e) { setError(e.message); }
        }
    };

    // 필터 묶음 핸들러
    const handleSaveFilterSet = async (set) => {
        const isEditing = !!set.id;
        const url = isEditing ? `/api/v1/filters/sets/${set.id}` : '/api/v1/filters/sets/create';
        const method = isEditing ? 'PATCH' : 'POST';
        const payload = { name: set.name, description: set.description, filterIds: set.filterIds };
        try {
            await apiRequest(url, method, payload);
            closeModal();
            forceRefresh();
        } catch(e) { setError(e.message); }
    };

    const handleDeleteFilterSet = async (setId) => {
        if (window.confirm('정말로 이 필터 묶음을 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/api/v1/filters/sets/${setId}`, 'DELETE');
                forceRefresh();
            } catch(e) { setError(e.message); }
        }
    };

    // 수업 세트 핸들러
    const handleSaveToolBundle = async (bundle) => {
        const isEditing = !!bundle.id;
        const url = isEditing ? `/api/v1/tool-bundles/${bundle.id}` : '/api/v1/tool-bundles/create';
        const method = isEditing ? 'PATCH' : 'POST';
        const payload = { 
            name: bundle.name, 
            description: bundle.description, 
            aacSetId: bundle.aacSetId, 
            filterSetId: bundle.filterSetId 
        };
        try {
            await apiRequest(url, method, payload);
            closeModal();
            forceRefresh();
        } catch(e) { setError(e.message); }
    };

    const handleDeleteToolBundle = async (bundleId) => {
        if (window.confirm('정말로 이 수업 세트를 삭제하시겠습니까?')) {
            try {
                await apiRequest(`/api/v1/tool-bundles/${bundleId}`, 'DELETE');
                forceRefresh();
            } catch(e) { setError(e.message); }
        }
    };

    if (loading) return <Container className="my-5 text-center"><Spinner animation="border" /> <p>데이터 로딩 중...</p></Container>;

    return (
        <Container fluid className="tools-management-section">
            <h2>수업 도구 관리</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <Tabs defaultActiveKey="AAC_item" id="therapist-tools-tabs" className="mb-3" justify>
                <Tab eventKey="AAC_item" title="AAC 아이템 관리">
                    <div className="tools-section">
                        <div className="tools-section-header">
                            <h4 className="page-section-title">AAC 아이템 목록</h4>
                            <Button className="btn-tool-add" onClick={() => openModal('AAC_item')}>새 AAC 아이템 추가</Button>
                        </div>
                        <AacItemList aacItems={aacItems} currentUser={currentUser} onEdit={(item) => openModal('AAC_item', item)} onDelete={handleDeleteAacItem} onViewDetails={handleViewDetails} />
                    </div>
                </Tab>

                <Tab eventKey="AAC_set" title="AAC 묶음 관리">
                    <div className="tools-section">
                        <div className="tools-section-header">
                            <h4 className="page-section-title">AAC 묶음 목록</h4>
                            <Button className="btn-tool-add" onClick={() => openModal('AAC_set')}>새 AAC 묶음 추가</Button>
                        </div>
                        <AacSetList aacSets={aacSets} onEdit={(set) => openModal('AAC_set', set)} onDelete={handleDeleteAacSet} />
                    </div>
                </Tab>

                <Tab eventKey="Filter" title="필터 관리">
                    <div className="tools-section">
                        <div className="tools-section-header">
                            <h4 className="page-section-title">필터 목록</h4>
                            <Button className="btn-tool-add" onClick={() => openModal('filter')}>새 필터 추가</Button>
                        </div>
                        <FilterList filters={filters} onDelete={handleDeleteFilter} />
                    </div>
                </Tab>

                <Tab eventKey="Filter_set" title="필터 묶음 관리">
                    <div className="tools-section">
                         <div className="tools-section-header">
                            <h4 className="page-section-title">필터 묶음 목록</h4>
                            <Button className="btn-tool-add" onClick={() => openModal('Filter_set')}>새 필터 묶음 추가</Button>
                        </div>
                        <FilterSetList filterSets={filterSets} onEdit={(set) => openModal('Filter_set', set)} onDelete={handleDeleteFilterSet} />
                    </div>
                </Tab>

                <Tab eventKey="tool_bundle" title="수업 세트 관리">
                     <div className="tools-section">
                        <div className="tools-section-header">
                            <h4 className="page-section-title">수업 세트 목록</h4>
                            <Button className="btn-tool-add" onClick={() => openModal('tool_bundle')}>새 수업 세트 추가</Button>
                        </div>
                        <ToolBundleList toolBundles={toolBundles} allAacSets={aacSets} allFilterSets={filterSets} onEdit={(bundle) => openModal('tool_bundle', bundle)} onDelete={handleDeleteToolBundle} />
                    </div>
                </Tab>
            </Tabs>
            
            {/* 모달 렌더링 (이 부분은 수정 없음) */}
            <AacItemDetailModal show={modalState.type === 'AAC_item_detail'} onHide={closeModal} item={modalState.data} />
            <AacItemModal show={modalState.type === 'AAC_item'} onHide={closeModal} onSave={handleSaveAacItem} itemData={modalState.data} onGenerate={handleGenerateAacImage} />
            <AacSetModal show={modalState.type === 'AAC_set'} onHide={closeModal} onSave={handleSaveAacSet} initialData={modalState.data} allAacItems={aacItems} getAuthHeader={getAuthHeader} />
            <FilterModal show={modalState.type === 'filter'} onHide={closeModal} onSave={handleSaveFilter} filterData={modalState.data} />
            <FilterSetModal show={modalState.type === 'Filter_set'} onHide={closeModal} onSave={handleSaveFilterSet} initialData={modalState.data} allFilters={filters} getAuthHeader={getAuthHeader} />
            <ToolBundleModal show={modalState.type === 'tool_bundle'} onHide={closeModal} onSave={handleSaveToolBundle} bundleData={modalState.data} allAacSets={aacSets} allFilterSets={filterSets} />
        </Container>
    );
}

export default TherapistToolsPage;
