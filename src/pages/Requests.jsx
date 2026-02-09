import { useState, useEffect } from 'react';
import { requestsAPI, risAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdDescription } from 'react-icons/md';

const Requests = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewCartModalOpen, setIsViewCartModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedForBatch, setSelectedForBatch] = useState([]);

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
        if (prev.length >= 2) {
          setToast({ message: 'You can only select 2 requests at a time', type: 'info' });
          return prev;
        }
        return [...prev, requestId];
      }
    });
  };

  const handleGenerateBatchRIS = async () => {
    if (selectedForBatch.length !== 2) {
      setToast({ message: 'Please select exactly 2 requests', type: 'error' });
      return;
    }

    try {
      setToast({ message: 'Generating batch RIS document...', type: 'info' });
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

      <div className="filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {selectedForBatch.length > 0 && (
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-action"
            onClick={handleGenerateBatchRIS}
            disabled={selectedForBatch.length !== 2}
          >
            Download RIS Set ({selectedForBatch.length}/2 selected)
          </button>
          {selectedForBatch.length < 2 && (
            <span style={{ color: '#6c757d', fontSize: '0.9em' }}>
              Select 2 approved requests to generate batch RIS
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
              {filters.status === 'approved' && <th style={{ width: '50px' }}>Select</th>}
              <th>Item</th>
              <th>Quantity</th>
              <th>Purpose</th>
              {isAdmin && <th>Requested By</th>}
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={filters.status === 'approved' ? (isAdmin ? "8" : "7") : (isAdmin ? "7" : "6")} className="text-center">
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

                // Safe extraction of quantity
                const getQuantity = () => {
                  try {
                    if (request.items && Array.isArray(request.items) && request.items.length > 0) {
                      return 'Multiple';
                    }
                    if (request.quantity) {
                      return `${request.quantity} ${request.unit || ''}`;
                    }
                    return 'N/A';
                  } catch (e) {
                    return 'N/A';
                  }
                };

                return (
                  <tr key={request._id}>
                    {filters.status === 'approved' && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedForBatch.includes(request._id)}
                          onChange={() => handleBatchCheckboxChange(request._id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                    )}
                    <td>
                      <strong>{getItemName()}</strong>
                      {request.item?.sku && <div className="text-muted">{request.item.sku}</div>}
                    </td>
                    <td>{getQuantity()}</td>
                  <td>{request.purpose}</td>
                  {isAdmin && (
                    <td>
                      <div>{request.requestedBy?.username || 'N/A'}</div>
                      <div className="text-muted">{request.requestedBy?.email || ''}</div>
                    </td>
                  )}
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    {isAdmin && request.status === 'pending' && (
                      <>
                        {request.items && Array.isArray(request.items) && request.items.length > 0 ? (
                          <button
                            className="btn btn-action-outline"
                            onClick={() => handleViewCart(request)}
                          >
                            View Cart
                          </button>
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
                    {request.status === 'approved' && (
                      <button
                        className="btn btn-icon btn-action-outline"
                        onClick={() => handleGenerateRIS(request._id)}
                        title="Download RIS Document"
                      >
                        <MdDescription size={18} />
                      </button>
                    )}
                    {!isAdmin && request.status === 'pending' && (
                      <button
                        className="btn btn-action-outline"
                        onClick={() => handleDelete(request._id)}
                      >
                        Cancel
                      </button>
                    )}
                    {request.status === 'rejected' && request.rejectionReason && (
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
                    )}
                  </td>
                </tr>
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
            <p><strong>Requested by:</strong> {selectedRequest.requestedByName || selectedRequest.requestedBy?.username}</p>
            {selectedRequest.notes && <p><strong>Notes:</strong> {selectedRequest.notes}</p>}
          </div>

          <div className="cart-items-list" style={{ marginBottom: '20px' }}>
            {selectedRequest.items && selectedRequest.items.map((reqItem, idx) => (
              <div key={idx} style={{ 
                padding: '15px', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                marginBottom: '10px',
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{reqItem.item?.name || 'N/A'}</h4>
                    <p style={{ margin: '3px 0', color: '#6c757d' }}>
                      SKU: {reqItem.item?.sku || 'N/A'}
                    </p>
                    <p style={{ margin: '3px 0', color: '#6c757d' }}>
                      Quantity: {reqItem.quantity || 0} {reqItem.unit || 'pcs'}
                    </p>
                    {reqItem.status === 'approved' && (
                      <span className="badge badge-neutral" style={{ marginTop: '5px' }}>✓ Approved</span>
                    )}
                    {reqItem.status === 'rejected' && (
                      <div>
                        <span className="badge badge-neutral" style={{ marginTop: '5px' }}>✗ Rejected</span>
                        {reqItem.rejectionReason && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#6c757d' }}>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Requests;
