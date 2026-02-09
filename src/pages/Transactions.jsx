import { useState, useEffect } from 'react';
import { transactionsAPI, itemsAPI, documentsAPI, excelAPI } from '../services/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdFileDownload, MdTableChart } from 'react-icons/md';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [formData, setFormData] = useState({
    item: '',
    type: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadTransactions();
    loadItems();
  }, []);

  const loadTransactions = async () => {
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await transactionsAPI.getAll(params);
      setTransactions(data.data);
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
      loadTransactions();
      loadItems(); // Reload items to update stock counts
    } catch (error) {
      setToast({ message: error.message || 'Error creating transaction', type: 'error' });
    }
  };

  const handleFilter = () => {
    loadTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => loadTransactions(), 100);
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
        <h2>Transaction History</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleGenerateTransactionReport}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <MdFileDownload size={20} />
            Word Report
          </button>
          <button 
            className="btn"
            onClick={handleExportTransactionExcel}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              backgroundColor: '#217346',
              color: 'white'
            }}
          >
            <MdTableChart size={18} />
            Excel Export
          </button>
          <button className="btn btn-primary" onClick={handleAddTransaction}>
            New Transaction
          </button>
        </div>
      </div>

      <div className="filters">
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Performed By</th>
              <th>Notes</th>
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
              transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{formatDate(transaction.createdAt)}</td>
                  <td>{transaction.item.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        transaction.type === 'in' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>
                  <td>{transaction.quantity}</td>
                  <td>{transaction.performedBy.username}</td>
                  <td>{transaction.notes || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
