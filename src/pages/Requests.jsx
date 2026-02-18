import { useState, useEffect } from 'react';
import { requestsAPI, risAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdDescription, MdMenu, MdMoreVert } from 'react-icons/md';

const Requests = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewCartModalOpen, setIsViewCartModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedForBatch, setSelectedForBatch] = useState([]);
  const [showBatchSelect, setShowBatchSelect] = useState(false);
  const [activeRequestMenu, setActiveRequestMenu] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;

      const data = await requestsAPI.getAll(params);
      setRequests(data.data);
    } catch (error) {
      setToast({ message: 'Error loading requests', type: 'error' });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleViewCart = (request) => {
    setSelectedRequest(request);
    setIsViewCartModalOpen(true);
  };

  const handleViewQuantities = (request) => {
    setSelectedRequest(request);
    setIsQuantityModalOpen(true);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;

    try {
      await requestsAPI.approve(id);
      setToast({ message: 'Request approved successfully', type: 'success' });
      loadRequests();
    } catch (error) {
      setToast({ message: error.message || 'Error approving request', type: 'error' });
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    try {
      await requestsAPI.reject(selectedRequest._id, { rejectionReason });
      setToast({ message: 'Request rejected', type: 'success' });
      setIsRejectModalOpen(false);
      loadRequests();
    } catch (error) {
      setToast({ message: error.message || 'Error rejecting request', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      await requestsAPI.delete(id);
      setToast({ message: 'Request deleted successfully', type: 'success' });
      loadRequests();
    } catch (error) {
      setToast({ message: error.message || 'Error deleting request', type: 'error' });
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateRIS = async (requestId) => {
    try {
      setToast({ message: 'Generating RIS document...', type: 'info' });
      const blob = await risAPI.generateRIS(requestId);
      downloadBlob(blob, `RIS-${requestId}-${Date.now()}.xlsx`);
      setToast({ message: 'RIS generated successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error generating RIS', type: 'error' });
    }
  };

  const handleBatchCheckboxChange = (requestId) => {
    setSelectedForBatch(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleGenerateBatchRIS = async () => {
    if (selectedForBatch.length < 2) {
      setToast({ message: 'Please select at least 2 requests', type: 'error' });
      return;
    }

    try {
      const worksheetsNeeded = Math.ceil(selectedForBatch.length / 2);
      setToast({ message: `Generating ${selectedForBatch.length} RIS in ${worksheetsNeeded} worksheet(s)...`, type: 'info' });
      const blob = await risAPI.generateRISBatch(selectedForBatch);
      downloadBlob(blob, `RIS-Batch-${Date.now()}.xlsx`);
      setToast({ message: 'Batch RIS generated successfully!', type: 'success' });
      setSelectedForBatch([]);
    } catch (error) {
      setToast({ message: error.message || 'Error generating batch RIS', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge badge-neutral',
      approved: 'badge badge-neutral',
      rejected: 'badge badge-neutral',
    };
    return <span className={statusClasses[status]}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isAdmin ? 'Manage Requests' : 'My Requests'}</h2>
      </div>

      <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="button"
          className={showBatchSelect ? 'btn btn-action-outline' : 'btn btn-action'}
          onClick={() => setShowBatchSelect(prev => !prev)}
        >
          {showBatchSelect ? 'Hide selection' : 'Generate multiple RIS'}
        </button>
      </div>

      {selectedForBatch.length > 0 && (
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-action"
            onClick={handleGenerateBatchRIS}
            disabled={selectedForBatch.length < 2}
          >
            Download RIS Set ({selectedForBatch.length} selected)
          </button>
          {selectedForBatch.length < 2 && (
            <span className="text-muted" style={{ fontSize: '0.9em' }}>
              Select at least 2 reviewed requests (approved or rejected) to generate batch RIS
            </span>
          )}
          {selectedForBatch.length >= 2 && (
            <span className="text-muted" style={{ fontSize: '0.9em' }}>
              Will create {Math.ceil(selectedForBatch.length / 2)} worksheet(s) - 2 RIS per sheet
            </span>
          )}
          <button
            className="btn btn-action-outline"
            onClick={() => setSelectedForBatch([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {showBatchSelect && <th style={{ width: '50px' }}>Select</th>}
              <th>Item</th>
              <th>Purpose</th>
              {isAdmin && <th>Requested By</th>}
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={showBatchSelect ? (isAdmin ? "6" : "5") : (isAdmin ? "5" : "4")} className="text-center">
                  No requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                // Safe extraction of item name
                const getItemName = () => {
                  try {
                    if (request.items && Array.isArray(request.items) && request.items.length > 0) {
                      return `${request.items.length} items`;
                    }
                    return request.item?.name || 'N/A';
                  } catch (e) {
                    return 'Error loading item';
                  }
                };

                const hasMultipleItems = request.items && Array.isArray(request.items) && request.items.length > 0;

                return (
                  <>
                    <tr key={request._id}>
                      {showBatchSelect && (
                        <td style={{ textAlign: 'center' }}>
                          {(request.status === 'approved' || request.status === 'rejected') ? (
                            <input
                              type="checkbox"
                              checked={selectedForBatch.includes(request._id)}
                              onChange={() => handleBatchCheckboxChange(request._id)}
                              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                          ) : null}
                        </td>
                      )}
                      <td>
                        <div>
                          <strong>{getItemName()}</strong>
                          {request.item?.sku && <div className="text-muted">{request.item.sku}</div>}
                        </div>
                      </td>
                      <td>{request.purpose}</td>
                      {isAdmin && (
                        <td>
                          <div>{request.requestedByName || request.requestedBy?.name || 'N/A'}</div>
                          <div className="text-muted">{request.requestedBy?.email || ''}</div>
                        </td>
                      )}
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td className={`action-buttons requests-action-cell ${activeRequestMenu === request._id ? 'menu-active' : ''}`}>
                        <div className="requests-actions-desktop">
                          {isAdmin && request.status === 'pending' && (
                            <>
                              {request.items && Array.isArray(request.items) && request.items.length > 0 ? (
                                <>
                                  <button
                                    className="btn btn-action-outline"
                                    onClick={() => handleViewCart(request)}
                                  >
                                    View Cart
                                  </button>
                                  <button
                                    className="btn btn-icon btn-action-outline"
                                    onClick={() => handleViewQuantities(request)}
                                    title="View Item Details"
                                  >
                                    <MdMenu size={18} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-action"
                                    onClick={() => handleApprove(request._id)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-action-outline"
                                    onClick={() => handleRejectClick(request)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {(request.status === 'approved' || request.status === 'rejected') && (
                            <>
                              <button
                                className="btn btn-icon btn-action-outline"
                                onClick={() => handleGenerateRIS(request._id)}
                                title="Download RIS Document"
                              >
                                <MdDescription size={18} />
                              </button>
                              {hasMultipleItems && (
                                <button
                                  className="btn btn-icon btn-action-outline"
                                  onClick={() => handleViewQuantities(request)}
                                  title="View Item Details"
                                >
                                  <MdMenu size={18} />
                                </button>
                              )}
                            </>
                          )}
                          {!isAdmin && request.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-action-outline"
                                onClick={() => handleDelete(request._id)}
                              >
                                Cancel
                              </button>
                              {hasMultipleItems && (
                                <button
                                  className="btn btn-icon btn-action-outline"
                                  onClick={() => handleViewQuantities(request)}
                                  title="View Item Details"
                                >
                                  <MdMenu size={18} />
                                </button>
                              )}
                            </>
                          )}
                          {request.status === 'rejected' && request.rejectionReason && (
                            <>
                              <button
                                className="btn btn-action-outline"
                                onClick={() => {
                                  setToast({
                                    message: `Rejection reason: ${request.rejectionReason}`,
                                    type: 'info'
                                  });
                                }}
                              >
                                View Reason
                              </button>
                              {hasMultipleItems && (
                                <button
                                  className="btn btn-icon btn-action-outline"
                                  onClick={() => handleViewQuantities(request)}
                                  title="View Item Details"
                                >
                                  <MdMenu size={18} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div className="requests-actions-mobile item-menu-container">
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRequestMenu(activeRequestMenu === request._id ? null : request._id);
                            }}
                            title="Actions"
                            aria-label="Open actions menu"
                          >
                            <MdMoreVert size={20} />
                          </button>
                          {activeRequestMenu === request._id && (
                            <div className="dropdown-menu">
                              {isAdmin && request.status === 'pending' && (
                                <>
                                  {request.items && Array.isArray(request.items) && request.items.length > 0 ? (
                                    <>
                                      <button
                                        type="button"
                                        className="dropdown-menu-item"
                                        onClick={() => { handleViewCart(request); setActiveRequestMenu(null); }}
                                      >
                                        <MdDescription size={18} />
                                        View Cart
                                      </button>
                                      <button
                                        type="button"
                                        className="dropdown-menu-item"
                                        onClick={() => { handleViewQuantities(request); setActiveRequestMenu(null); }}
                                      >
                                        <MdMenu size={18} />
                                        View Item Details
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="dropdown-menu-item"
                                        onClick={() => { handleApprove(request._id); setActiveRequestMenu(null); }}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        className="dropdown-menu-item"
                                        onClick={() => { handleRejectClick(request); setActiveRequestMenu(null); }}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {(request.status === 'approved' || request.status === 'rejected') && (
                                <>
                                  <button
                                    type="button"
                                    className="dropdown-menu-item"
                                    onClick={() => { handleGenerateRIS(request._id); setActiveRequestMenu(null); }}
                                  >
                                    <MdDescription size={18} />
                                    Download RIS
                                  </button>
                                  {hasMultipleItems && (
                                    <button
                                      type="button"
                                      className="dropdown-menu-item"
                                      onClick={() => { handleViewQuantities(request); setActiveRequestMenu(null); }}
                                    >
                                      <MdMenu size={18} />
                                      View Item Details
                                    </button>
                                  )}
                                </>
                              )}
                              {!isAdmin && request.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    className="dropdown-menu-item"
                                    onClick={() => { handleDelete(request._id); setActiveRequestMenu(null); }}
                                  >
                                    Cancel
                                  </button>
                                  {hasMultipleItems && (
                                    <button
                                      type="button"
                                      className="dropdown-menu-item"
                                      onClick={() => { handleViewQuantities(request); setActiveRequestMenu(null); }}
                                    >
                                      <MdMenu size={18} />
                                      View Item Details
                                    </button>
                                  )}
                                </>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <>
                                  <button
                                    type="button"
                                    className="dropdown-menu-item"
                                    onClick={() => {
                                      setToast({ message: `Rejection reason: ${request.rejectionReason}`, type: 'info' });
                                      setActiveRequestMenu(null);
                                    }}
                                  >
                                    View Reason
                                  </button>
                                  {hasMultipleItems && (
                                    <button
                                      type="button"
                                      className="dropdown-menu-item"
                                      onClick={() => { handleViewQuantities(request); setActiveRequestMenu(null); }}
                                    >
                                      <MdMenu size={18} />
                                      View Item Details
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Cart Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isViewCartModalOpen}
          onClose={() => setIsViewCartModalOpen(false)}
          title={`Request Items - ${selectedRequest.items?.length || 0} items`}
        >
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Purpose:</strong> {selectedRequest.purpose}</p>
            <p><strong>Requested by:</strong> {selectedRequest.requestedByName || selectedRequest.requestedBy?.name}</p>
            {selectedRequest.notes && <p><strong>Notes:</strong> {selectedRequest.notes}</p>}
          </div>

          <div className="cart-items-list" style={{ marginBottom: '20px' }}>
            {selectedRequest.items && selectedRequest.items.map((reqItem, idx) => (
              <div key={idx} className="request-item-detail" style={{ 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{reqItem.item?.name || 'N/A'}</h4>
                    <p className="text-muted" style={{ margin: '3px 0' }}>
                      SKU: {reqItem.item?.sku || 'N/A'}
                    </p>
                    <p className="text-muted" style={{ margin: '3px 0' }}>
                      Quantity: {reqItem.quantity || 0} {reqItem.unit || 'pcs'}
                    </p>
                    {reqItem.status === 'approved' && (
                      <span className="badge badge-neutral" style={{ marginTop: '5px' }}>✓ Approved</span>
                    )}
                    {reqItem.status === 'rejected' && (
                      <div>
                        <span className="badge badge-neutral" style={{ marginTop: '5px' }}>✗ Rejected</span>
                        {reqItem.rejectionReason && (
                          <p className="text-muted" style={{ margin: '5px 0 0 0', fontSize: '0.85em' }}>
                            Reason: {reqItem.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {reqItem.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                      <button
                        className="btn btn-action"
                        style={{ padding: '5px 10px', fontSize: '0.9em' }}
                        onClick={async () => {
                          try {
                            const itemId = reqItem._id || idx; // Use index as fallback
                            await requestsAPI.approveItem(selectedRequest._id, itemId);
                            setToast({ message: `${reqItem.item?.name} approved`, type: 'success' });
                            loadRequests();
                            // Refresh the selectedRequest
                            const updated = await requestsAPI.getOne(selectedRequest._id);
                            setSelectedRequest(updated.data);
                          } catch (error) {
                            setToast({ message: error.message || 'Error approving item', type: 'error' });
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-action-outline"
                        style={{ padding: '5px 10px', fontSize: '0.9em' }}
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            const itemId = reqItem._id || idx;
                            requestsAPI.rejectItem(selectedRequest._id, itemId, { rejectionReason: reason })
                              .then(async () => {
                                setToast({ message: `${reqItem.item?.name} rejected`, type: 'success' });
                                loadRequests();
                                const updated = await requestsAPI.getOne(selectedRequest._id);
                                setSelectedRequest(updated.data);
                              })
                              .catch(error => {
                                setToast({ message: error.message || 'Error rejecting item', type: 'error' });
                              });
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-action-outline" 
              onClick={() => setIsViewCartModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Reject Request Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Request"
      >
        <form onSubmit={handleRejectSubmit}>
          <div className="form-group">
            <label htmlFor="rejectionReason">Rejection Reason *</label>
            <textarea
              id="rejectionReason"
              name="rejectionReason"
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-action-outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-action">
              Reject Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Quantity Details Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isQuantityModalOpen}
          onClose={() => setIsQuantityModalOpen(false)}
          title="Quantity Details"
        >
          <div className="quantity-details-content">
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Total Items:</strong> {selectedRequest.items?.length || 0}</p>
              <p><strong>Date:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-primary)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Item Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Stock No.</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items && selectedRequest.items.map((reqItem, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{reqItem.item?.name || 'N/A'}</td>
                      <td style={{ padding: '12px 8px' }} className="text-muted">{reqItem.item?.sku || 'N/A'}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-primary)', textAlign: 'right' }}>
                        <strong>{reqItem.quantity || 0}</strong> {reqItem.unit || 'pcs'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn btn-action-outline" 
                onClick={() => setIsQuantityModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Requests;
