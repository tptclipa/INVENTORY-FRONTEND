import { useState, useEffect } from 'react';
import { itemsAPI, categoriesAPI, requestsAPI, documentsAPI, excelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdAddShoppingCart, MdFileDownload, MdPrint, MdTableChart, MdEdit, MdDelete, MdAdd, MdMoreVert, MdFilterList } from 'react-icons/md';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

const MOBILE_BREAKPOINT = 768;
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

const Items = () => {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [addingToCartItem, setAddingToCartItem] = useState(null);
  const [restockingItem, setRestockingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
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
  const [restockFormData, setRestockFormData] = useState({
    quantityToAdd: 1,
  });
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [activeItemMenu, setActiveItemMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadItems();
    loadCategories();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showReportMenu && !event.target.closest('.report-menu-container')) {
        setShowReportMenu(false);
      }
      if (activeItemMenu && !event.target.closest('.item-menu-container')) {
        setActiveItemMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReportMenu, activeItemMenu]);

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
        category: data.data.category?._id || '',
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

  const handleRestockClick = async (id) => {
    try {
      const data = await itemsAPI.getOne(id);
      setRestockingItem(data.data);
      setRestockFormData({
        quantityToAdd: 1,
      });
      setIsRestockModalOpen(true);
    } catch (error) {
      setToast({ message: 'Error loading item', type: 'error' });
    }
  };

  const handleRestockFormChange = (e) => {
    setRestockFormData({
      ...restockFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();

    try {
      const quantityToAdd = parseInt(restockFormData.quantityToAdd);
      
      if (quantityToAdd <= 0) {
        setToast({ message: 'Quantity to add must be greater than 0', type: 'error' });
        return;
      }

      const newTotalQuantity = restockingItem.quantity + quantityToAdd;

      // Update the item with the new total quantity
      await itemsAPI.update(restockingItem._id, {
        ...restockingItem,
        quantity: newTotalQuantity,
        category: restockingItem.category?._id || restockingItem.category, // Send category ID
      });

      setToast({ 
        message: `Successfully added ${quantityToAdd} ${restockingItem.unit || 'pcs'}. New total: ${newTotalQuantity}`, 
        type: 'success' 
      });
      setIsRestockModalOpen(false);
      loadItems();
    } catch (error) {
      setToast({ message: error.message || 'Error restocking item', type: 'error' });
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

  // Pagination calculations
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  // Show at most 3 page dots (window around current page)
  const getVisiblePageNumbers = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const startPage = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    return [startPage, startPage + 1, startPage + 2];
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setActiveItemMenu(null); // Close any open menus when changing page
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setActiveItemMenu(null);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setActiveItemMenu(null);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isAdmin ? 'Items Management' : 'View Items'}</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? 'Hide filters' : 'Show filters'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MdFilterList size={20} />
            Filters
          </button>
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

      {/* Search always visible */}
      <div className="items-search-wrap">
        <input
          type="text"
          name="search"
          placeholder="Search by name, Stock No., or description..."
          value={filters.search}
          onChange={handleFilterChange}
          className="items-search-input"
          aria-label="Search items"
        />
      </div>

      {showFilters && (
        <div className="items-filters-panel">
          <div className="filters">
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
        </div>
      )}

      {isMobile ? (
        <div className="items-card-list">
          {items.length === 0 ? (
            <p className="items-card-empty">No items found</p>
          ) : (
            currentItems.map((item) => {
              const isLowStock = item.quantity <= item.minStockLevel;
              return (
                <div
                  key={item._id}
                  className={`item-card ${isLowStock ? 'item-card-low-stock' : ''} ${activeItemMenu === item._id ? 'item-card-menu-open' : ''}`}
                >
                  <div className="item-card-main">
                    <div className="item-card-header">
                      <h3 className="item-card-name">{item.name}</h3>
                      {isLowStock && <span className="badge badge-warning">Low</span>}
                    </div>
                    <dl className="item-card-details">
                      <div className="item-card-row">
                        <dt>Stock No.</dt>
                        <dd>{item.sku || 'N/A'}</dd>
                      </div>
                      <div className="item-card-row">
                        <dt>Category</dt>
                        <dd>{item.category?.name || 'N/A'}</dd>
                      </div>
                      <div className="item-card-row">
                        <dt>Quantity</dt>
                        <dd>{item.quantity} {item.unit || 'pcs'}</dd>
                      </div>
                      <div className="item-card-row">
                        <dt>Min Stock</dt>
                        <dd>{item.minStockLevel}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className={`item-card-actions ${activeItemMenu === item._id ? 'menu-active' : ''}`}>
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-icon"
                          onClick={() => handleRestockClick(item._id)}
                          title="Restock"
                        >
                          <MdAdd size={20} />
                        </button>
                        <div className="item-menu-container">
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            onClick={() => setActiveItemMenu(activeItemMenu === item._id ? null : item._id)}
                            title="More options"
                          >
                            <MdMoreVert size={20} />
                          </button>
                          {activeItemMenu === item._id && (
                            <div className="dropdown-menu dropdown-menu-card">
                              <button
                                type="button"
                                onClick={() => { handleEditItem(item._id); setActiveItemMenu(null); }}
                                className="dropdown-menu-item"
                              >
                                <MdEdit size={18} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { handleGenerateItemLabel(item._id); setActiveItemMenu(null); }}
                                className="dropdown-menu-item"
                              >
                                <MdPrint size={18} /> Print Label
                              </button>
                              <div className="dropdown-menu-divider" />
                              <button
                                type="button"
                                onClick={() => { handleDeleteItem(item._id); setActiveItemMenu(null); }}
                                className="dropdown-menu-item dropdown-menu-item-danger"
                              >
                                <MdDelete size={18} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-icon"
                        onClick={() => handleAddToCartClick(item)}
                        title="Add to cart"
                        disabled={item.quantity === 0}
                      >
                        <MdAddShoppingCart size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="table-container" style={{ position: 'relative' }}>
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
                currentItems.map((item) => {
                  const isLowStock = item.quantity <= item.minStockLevel;
                  return (
                    <tr key={item._id} className={`${isLowStock ? 'low-stock-row' : ''} ${activeItemMenu === item._id ? 'row-menu-active' : ''}`}>
                      <td>{item.name}</td>
                      <td>{item.sku || 'N/A'}</td>
                      <td>{item.category?.name || 'N/A'}</td>
                      <td>
                        {item.quantity} {item.unit || 'pcs'}{' '}
                        {isLowStock && <span className="badge badge-warning">Low</span>}
                      </td>
                      <td>{item.minStockLevel}</td>
                      <td className={`action-buttons ${activeItemMenu === item._id ? 'menu-active' : ''}`}>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', position: 'relative' }}>
                            <button 
                              className="btn btn-primary btn-icon" 
                              onClick={() => handleRestockClick(item._id)}
                              title="Restock"
                            >
                              <MdAdd size={18} />
                            </button>
                            <div className="item-menu-container">
                              <button 
                                className="btn btn-secondary btn-icon" 
                                onClick={() => setActiveItemMenu(activeItemMenu === item._id ? null : item._id)}
                                title="More options"
                              >
                                <MdMoreVert size={18} />
                              </button>
                              {activeItemMenu === item._id && (
                                <div className="dropdown-menu">
                                  <button
                                    onClick={() => {
                                      handleEditItem(item._id);
                                      setActiveItemMenu(null);
                                    }}
                                    className="dropdown-menu-item"
                                  >
                                    <MdEdit size={18} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleGenerateItemLabel(item._id);
                                      setActiveItemMenu(null);
                                    }}
                                    className="dropdown-menu-item"
                                  >
                                    <MdPrint size={18} />
                                    Print Label
                                  </button>
                                  <div className="dropdown-menu-divider" />
                                  <button
                                    onClick={() => {
                                      handleDeleteItem(item._id);
                                      setActiveItemMenu(null);
                                    }}
                                    className="dropdown-menu-item"
                                    style={{ color: '#e74c3c' }}
                                  >
                                    <MdDelete size={18} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
      )}

      {/* Pagination Controls */}
      {items.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
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

      {/* Restock Modal */}
      {isAdmin && restockingItem && (
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title={`Restock: ${restockingItem.name}`}
        >
          <form onSubmit={handleRestockSubmit}>
            <div className="info-box">
              <p><strong>Item:</strong> {restockingItem.name}</p>
              <p><strong>Current Stock:</strong> {restockingItem.quantity} {restockingItem.unit || 'pcs'}</p>
              {restockingItem.quantity <= restockingItem.minStockLevel && (
                <p className="text-warning">⚠️ This item is low in stock</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="quantityToAdd">Quantity to Add *</label>
              <input
                type="number"
                id="quantityToAdd"
                name="quantityToAdd"
                min="1"
                value={restockFormData.quantityToAdd}
                onChange={handleRestockFormChange}
                required
                autoFocus
              />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                New total will be: {restockingItem.quantity + parseInt(restockFormData.quantityToAdd || 0)} {restockingItem.unit || 'pcs'}
              </small>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsRestockModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Restock Item
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
