import { useState, useEffect } from 'react';
import { transactionsAPI, itemsAPI, documentsAPI, excelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdFileDownload, MdTableChart, MdFilterList, MdExpandLess, MdExpandMore } from 'react-icons/md';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

const Transactions = () => {
  const { isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const pageSize = 10;

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };
  const [formData, setFormData] = useState({
    item: '',
    type: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters, currentPage]);

  const loadTransactions = async () => {
    try {
      const params = { page: currentPage, limit: pageSize };
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await transactionsAPI.getAll(params);
      setTransactions(data.data);
      setTotalCount(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      setToast({ message: 'Error loading transactions', type: 'error' });
    }
  };

  const loadItems = async () => {
    try {
      const data = await itemsAPI.getAll();
      setItems(data.data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTransaction = () => {
    setFormData({
      item: '',
      type: '',
      quantity: 1,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await transactionsAPI.create(formData);
      setToast({ message: 'Transaction created successfully', type: 'success' });
      setIsModalOpen(false);
      setCurrentPage(1);
      loadItems(); // Reload items to update stock counts
      // useEffect will refetch transactions (page 1) when currentPage updates
    } catch (error) {
      setToast({ message: error.message || 'Error creating transaction', type: 'error' });
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const getVisiblePageNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const startPage = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    return [startPage, startPage + 1, startPage + 2].filter((p) => p <= totalPages);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  const handleGenerateTransactionReport = async () => {
    try {
      setToast({ message: 'Generating transaction report...', type: 'info' });
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const blob = await documentsAPI.generateTransactionReport(params);
      downloadBlob(blob, `transaction-report-${new Date().toISOString().split('T')[0]}.docx`);
      setToast({ message: 'Report generated successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error generating report', type: 'error' });
    }
  };

  const handleExportTransactionExcel = async () => {
    try {
      setToast({ message: 'Exporting to Excel...', type: 'info' });
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const blob = await excelAPI.exportTransactionReport(params);
      downloadBlob(blob, `transaction-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast({ message: 'Excel file exported successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error exporting to Excel', type: 'error' });
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isAdmin ? 'All Transaction History' : 'My Transaction History'}</h2>
        <div className="page-header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary filters-toggle-btn"
            onClick={() => setShowFilters((s) => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            aria-expanded={showFilters}
          >
            <MdFilterList size={18} />
            {showFilters ? (
              <>Hide filters <MdExpandLess size={18} /></>
            ) : (
              <>Show filters <MdExpandMore size={18} /></>
            )}
          </button>
          {isAdmin && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={handleGenerateTransactionReport}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <MdFileDownload size={20} />
                Word Report
              </button>
              <button 
                className="btn btn-excel"
                onClick={handleExportTransactionExcel}
              >
                <MdTableChart size={18} />
                Excel Export
              </button>
              <button className="btn btn-primary" onClick={handleAddTransaction}>
                New Transaction
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`filters ${!showFilters ? 'filters-hidden' : ''}`}>
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <button className="btn btn-secondary" onClick={handleFilter}>
          Filter
        </button>
        <button className="btn btn-secondary" onClick={handleClearFilters}>
          Clear
        </button>
      </div>

      <div className="table-container transactions-table-wrap">
        <table className="data-table transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Type</th>
              <th className="mobile-hide-th">Quantity</th>
              <th className="mobile-hide-th">Performed By</th>
              <th className="mobile-hide-th">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const isExpanded = expandedId === transaction._id;
                return [
                  <tr
                      key={transaction._id}
                      className={`transaction-main-row ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleExpanded(transaction._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpanded(transaction._id);
                        }
                      }}
                      aria-expanded={isExpanded}
                    >
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td>{transaction.item?.name || 'Unknown Item'}</td>
                      <td className="transaction-type-cell">
                        <span
                          className={`badge ${
                            transaction.type === 'in'
                              ? 'badge-success'
                              : transaction.type === 'out'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {transaction.type === 'in'
                            ? 'Stock In'
                            : transaction.type === 'out'
                            ? 'Stock Out'
                            : 'Rejected'}
                        </span>
                        <span className="transaction-row-expand-icon mobile-only-expand" aria-hidden>
                          <MdExpandMore size={20} className={isExpanded ? 'icon-rotated' : ''} />
                        </span>
                      </td>
                      <td className="mobile-hide-col">{transaction.quantity}</td>
                      <td className="mobile-hide-col">{transaction.performedBy?.username || 'Unknown'}</td>
                      <td className="mobile-hide-col">{transaction.notes || 'N/A'}</td>
                    </tr>,
                  <tr
                      key={`${transaction._id}-details`}
                      className={`transaction-details-row ${isExpanded ? 'expanded' : ''}`}
                      aria-hidden={!isExpanded}
                    >
                      <td colSpan="6" className="transaction-details-cell">
                        <div className="transaction-details-inner">
                          <div className="transaction-detail-item">
                            <span className="transaction-detail-label">Quantity</span>
                            <span className="transaction-detail-value">{transaction.quantity}</span>
                          </div>
                          <div className="transaction-detail-item">
                            <span className="transaction-detail-label">Performed By</span>
                            <span className="transaction-detail-value">{transaction.performedBy?.username || 'Unknown'}</span>
                          </div>
                          <div className="transaction-detail-item">
                            <span className="transaction-detail-label">Remarks</span>
                            <span className="transaction-detail-value">{transaction.notes || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <span className="pagination-info" style={{ marginRight: 'auto' }}>
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            className="pagination-arrow"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            title="Previous page"
            aria-label="Previous page"
          >
            <IoIosArrowBack size={22} />
          </button>
          <div className="pagination-dots">
            {getVisiblePageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-dot ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
                title={`Page ${page} of ${totalPages}`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              />
            ))}
          </div>
          <button
            className="pagination-arrow"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            title="Next page"
            aria-label="Next page"
          >
            <IoIosArrowForward size={22} />
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Transaction">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="item">Item *</label>
            <select
              id="item"
              name="item"
              value={formData.item}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Type</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Transaction
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Transactions;
