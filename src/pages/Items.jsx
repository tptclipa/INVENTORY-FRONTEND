import { useState, useEffect } from 'react';
import { itemsAPI, categoriesAPI, requestsAPI, documentsAPI, excelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdAddShoppingCart, MdFileDownload, MdPrint, MdTableChart } from 'react-icons/md';

const Items = () => {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [addingToCartItem, setAddingToCartItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    customUnit: '',
    minStockLevel: 10,
  });
  const [addToCartFormData, setAddToCartFormData] = useState({
    quantity: 1,
    unit: '',
  });
  const [showReportMenu, setShowReportMenu] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showReportMenu && !event.target.closest('.report-menu-container')) {
        setShowReportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReportMenu]);

  const loadItems = async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.lowStock) params.lowStock = 'true';

      const data = await itemsAPI.getAll(params);
      setItems(data.data);
    } catch (error) {
      setToast({ message: 'Error loading items', type: 'error' });
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      quantity: 0,
      unit: 'pcs',
      customUnit: '',
      minStockLevel: 10,
    });
    setIsModalOpen(true);
  };

  const handleEditItem = async (id) => {
    try {
      const data = await itemsAPI.getOne(id);
      setEditingItem(data.data);
      setFormData({
        name: data.data.name,
        description: data.data.description || '',
        sku: data.data.sku || '',
        category: data.data.category._id,
        quantity: data.data.quantity,
        unit: data.data.unit || 'pcs',
        customUnit: '',
        minStockLevel: data.data.minStockLevel,
      });
      setIsModalOpen(true);
    } catch (error) {
      setToast({ message: 'Error loading item', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        unit: formData.unit === 'others' ? formData.customUnit : formData.unit,
      };
      // Remove customUnit from submission
      delete submitData.customUnit;

      if (editingItem) {
        await itemsAPI.update(editingItem._id, submitData);
        setToast({ message: 'Item updated successfully', type: 'success' });
      } else {
        await itemsAPI.create(submitData);
        setToast({ message: 'Item created successfully', type: 'success' });
      }
      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      setToast({ message: error.message || 'Error saving item', type: 'error' });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await itemsAPI.delete(id);
      setToast({ message: 'Item deleted successfully', type: 'success' });
      loadItems();
    } catch (error) {
      setToast({ message: error.message || 'Error deleting item', type: 'error' });
    }
  };

  const handleAddToCartClick = (item) => {
    setAddingToCartItem(item);
    setAddToCartFormData({
      quantity: 1,
      unit: item.unit || 'pcs',
    });
    setIsAddToCartModalOpen(true);
  };

  const handleAddToCartFormChange = (e) => {
    setAddToCartFormData({
      ...addToCartFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddToCartSubmit = (e) => {
    e.preventDefault();

    try {
      addToCart(
        addingToCartItem, 
        parseInt(addToCartFormData.quantity), 
        addToCartFormData.unit
      );
      setToast({ message: `${addingToCartItem.name} added to cart!`, type: 'success' });
      setIsAddToCartModalOpen(false);
    } catch (error) {
      setToast({ message: 'Error adding to cart', type: 'error' });
    }
  };

  // Document generation functions
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

  const handleGenerateInventoryReport = async () => {
    try {
      setToast({ message: 'Generating inventory report...', type: 'info' });
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.lowStock) params.lowStockOnly = true;
      
      const blob = await documentsAPI.generateInventoryReport(params);
      downloadBlob(blob, `inventory-report-${new Date().toISOString().split('T')[0]}.docx`);
      setToast({ message: 'Report generated successfully!', type: 'success' });
      setShowReportMenu(false);
    } catch (error) {
      setToast({ message: 'Error generating report', type: 'error' });
    }
  };

  const handleGenerateLowStockAlert = async () => {
    try {
      setToast({ message: 'Generating low stock alert...', type: 'info' });
      const blob = await documentsAPI.generateLowStockAlert();
      downloadBlob(blob, `low-stock-alert-${new Date().toISOString().split('T')[0]}.docx`);
      setToast({ message: 'Alert generated successfully!', type: 'success' });
      setShowReportMenu(false);
    } catch (error) {
      setToast({ message: 'Error generating alert', type: 'error' });
    }
  };

  const handleGenerateItemLabel = async (itemId) => {
    try {
      setToast({ message: 'Generating item label...', type: 'info' });
      const blob = await documentsAPI.generateItemLabel(itemId);
      downloadBlob(blob, `item-label-${itemId}.docx`);
      setToast({ message: 'Label generated successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error generating label', type: 'error' });
    }
  };

  // Excel export functions
  const handleExportInventoryExcel = async () => {
    try {
      setToast({ message: 'Exporting to Excel...', type: 'info' });
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.lowStock) params.lowStockOnly = true;
      
      const blob = await excelAPI.exportInventoryReport(params);
      downloadBlob(blob, `inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast({ message: 'Excel file exported successfully!', type: 'success' });
      setShowReportMenu(false);
    } catch (error) {
      setToast({ message: 'Error exporting to Excel', type: 'error' });
    }
  };

  const handleExportLowStockExcel = async () => {
    try {
      setToast({ message: 'Exporting to Excel...', type: 'info' });
      const blob = await excelAPI.exportLowStockAlert();
      downloadBlob(blob, `low-stock-alert-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast({ message: 'Excel file exported successfully!', type: 'success' });
      setShowReportMenu(false);
    } catch (error) {
      setToast({ message: 'Error exporting to Excel', type: 'error' });
    }
  };

  const handleExportFullData = async () => {
    try {
      setToast({ message: 'Exporting full data to Excel...', type: 'info' });
      const blob = await excelAPI.exportFullData();
      downloadBlob(blob, `full-inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      setToast({ message: 'Full data exported successfully!', type: 'success' });
      setShowReportMenu(false);
    } catch (error) {
      setToast({ message: 'Error exporting data', type: 'error' });
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isAdmin ? 'Items Management' : 'View Items'}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <>
              <div className="report-menu-container" style={{ position: 'relative' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <MdFileDownload size={20} />
                  Generate Reports
                </button>
                {showReportMenu && (
                  <div className="dropdown-menu">
                    {/* Word Documents Section */}
                    <div className="dropdown-menu-header">
                      Word Documents (.docx)
                    </div>
                    <button
                      onClick={handleGenerateInventoryReport}
                      className="dropdown-menu-item"
                    >
                      <MdFileDownload size={18} />
                      Inventory Report (Word)
                    </button>
                    <button
                      onClick={handleGenerateLowStockAlert}
                      className="dropdown-menu-item"
                    >
                      <MdFileDownload size={18} />
                      Low Stock Alert (Word)
                    </button>
                    
                    {/* Divider */}
                    <div className="dropdown-menu-divider" />
                    
                    {/* Excel Section */}
                    <div className="dropdown-menu-header">
                      Excel Spreadsheets (.xlsx)
                    </div>
                    <button
                      onClick={handleExportInventoryExcel}
                      className="dropdown-menu-item excel-item"
                    >
                      <MdTableChart size={18} />
                      Inventory Report (Excel)
                    </button>
                    <button
                      onClick={handleExportLowStockExcel}
                      className="dropdown-menu-item excel-item"
                    >
                      <MdTableChart size={18} />
                      Low Stock Alert (Excel)
                    </button>
                    <button
                      onClick={handleExportFullData}
                      className="dropdown-menu-item excel-item"
                    >
                      <MdTableChart size={18} />
                      Full Data Export (Excel)
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleAddItem}>
                Add New Item
              </button>
            </>
          )}
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search by name, Stock No., or description..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select name="lowStock" value={filters.lowStock} onChange={handleFilterChange}>
          <option value="">All Stock Levels</option>
          <option value="true">Low Stock Only</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock No.</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Min Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLowStock = item.quantity <= item.minStockLevel;
                return (
                  <tr key={item._id} className={isLowStock ? 'low-stock-row' : ''}>
                    <td>{item.name}</td>
                    <td>{item.sku || 'N/A'}</td>
                    <td>{item.category.name}</td>
                    <td>
                      {item.quantity} {item.unit || 'pcs'}{' '}
                      {isLowStock && <span className="badge badge-warning">Low</span>}
                    </td>
                    <td>{item.minStockLevel}</td>
                    <td className="action-buttons">
                      {isAdmin ? (
                        <>
                          <button className="btn btn-secondary" onClick={() => handleEditItem(item._id)}>
                            Edit
                          </button>
                          <button 
                            className="btn btn-success btn-icon" 
                            onClick={() => handleGenerateItemLabel(item._id)}
                            title="Generate Label"
                          >
                            <MdPrint size={18} />
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDeleteItem(item._id)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn btn-icon btn-primary" 
                          onClick={() => handleAddToCartClick(item)}
                          title="Add to cart"
                          disabled={item.quantity === 0}
                        >
                          <MdAddShoppingCart size={20} />
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

      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Item' : 'Add New Item'}
        >
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sku">Stock No.</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="0"
                value={formData.quantity}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit *</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleFormChange}
                required
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="set">Set</option>
                <option value="unit">Unit</option>
                <option value="dozen">Dozen</option>
                <option value="ream">Ream</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter</option>
                <option value="meter">Meter</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="minStockLevel">Min Stock Level *</label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                min="0"
                value={formData.minStockLevel}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          {formData.unit === 'others' && (
            <div className="form-group">
              <label htmlFor="customUnit">Specify Unit *</label>
              <input
                type="text"
                id="customUnit"
                name="customUnit"
                value={formData.customUnit}
                onChange={handleFormChange}
                placeholder="Enter custom unit (e.g., carton, bundle, sack)"
                required
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Item
            </button>
          </div>
          </form>
        </Modal>
      )}

      {/* Add to Cart Modal */}
      {!isAdmin && addingToCartItem && (
        <Modal
          isOpen={isAddToCartModalOpen}
          onClose={() => setIsAddToCartModalOpen(false)}
          title={`Add to Cart: ${addingToCartItem.name}`}
        >
          <form onSubmit={handleAddToCartSubmit}>
            <div className="info-box">
              <p><strong>Item:</strong> {addingToCartItem.name}</p>
              <p><strong>Available Stock:</strong> {addingToCartItem.quantity}</p>
              {addingToCartItem.quantity <= addingToCartItem.minStockLevel && (
                <p className="text-warning">⚠️ This item is low in stock</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max={addingToCartItem.quantity}
                  value={addToCartFormData.quantity}
                  onChange={handleAddToCartFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit">Unit</label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={addToCartFormData.unit}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddToCartModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add to Cart
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Items;
