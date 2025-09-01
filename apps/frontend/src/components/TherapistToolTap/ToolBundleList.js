import React from 'react';
import { ListGroup, Button, Badge } from 'react-bootstrap';
import './ToolBundleList.css';

const ToolBundleList = ({ toolBundles, allAacSets, allFilterSets, onEdit, onDelete }) => {
    if (!toolBundles || toolBundles.length === 0) {
        return (
            <div className="empty-list-placeholder">
                <h5>아직 수업 세트가 없어요</h5>
                <p>새로운 수업 세트를 추가하여 관리해보세요.</p>
            </div>
        );
    }
    
    const findNameById = (list, id, key, nameKey) => {
        const item = list.find(i => i[key] === id);
        return item ? item[nameKey] : '알 수 없음';
    };

    const BundleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-box-seam item-title-icon" viewBox="0 0 16 16">
            <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
        </svg>
    );
    const AacIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.5 3.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m-.861 1.542 1.33.886 1.854-1.855a.25.25 0 0 1 .289-.047L11 4.75V7a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 7v-.5s1.54-1.274 1.639-1.208M5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
  <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2"/>
  <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z"/></svg>);
    const FilterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
  <path d="M6 11.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>);


    return (
        <div className="tool-bundle-list-container">
            <div className="tool-bundle-list-group">
                {toolBundles.map(bundle => (
                    <div key={bundle.toolBundleId} className="tool-bundle-list-item">
                        <div className="list-item-content">
                            <div className="tool-bundle-text-content">
                                <div className="item-title-container">
                                    <BundleIcon />
                                    <h5 className="tool-bundle-item-title">{bundle.name}</h5>
                                </div>
                                <p className="tool-bundle-item-description">{bundle.description}</p>
                                
                                <div className="tool-bundle-details">
                                    {bundle.aacSetId && (
                                        <div className="bundle-detail-item">
                                            <AacIcon />
                                            <span>
                                                <Badge>
                                                    {findNameById(allAacSets, bundle.aacSetId, 'id', 'name')}
                                                </Badge>
                                            </span>
                                        </div>
                                    )}
                                    {bundle.filterSetId && (
                                        <div className="bundle-detail-item">
                                            <FilterIcon />
                                            <span>
                                                <Badge>
                                                    {findNameById(allFilterSets, bundle.filterSetId, 'filterSetId', 'name')}
                                                </Badge>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="tool-bundle-actions">
                                <Button className="btn-tool-edit" onClick={() => onEdit(bundle)}>편집</Button>
                                <Button className="btn-tool-delete" onClick={() => onDelete(bundle.toolBundleId)}>삭제</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ToolBundleList;