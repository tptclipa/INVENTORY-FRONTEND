import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdEdit, MdDelete, MdChevronLeft, MdChevronRight, MdAdd } from 'react-icons/md';

const Categories = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.data || []);
      setCurrentPage(1);
    } catch (error) {
      setToast({ message: 'Error loading categories', type: 'error' });
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCategory = () => {
    if (!isAdmin) {
      setToast({ message: 'Only admins can add categories', type: 'error' });
      return;
    }
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEditCategory = async (id) => {
    if (!isAdmin) {
      setToast({ message: 'Only admins can edit categories', type: 'error' });
      return;
    }

    try {
      const data = await categoriesAPI.getOne(id);
      setEditingCategory(data.data);
      setFormData({
        name: data.data.name,
        description: data.data.description || '',
      });
      setIsModalOpen(true);
    } catch (error) {
      setToast({ message: 'Error loading category', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setToast({ message: 'Only admins can manage categories', type: 'error' });
      return;
    }

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        setToast({ message: 'Category updated successfully', type: 'success' });
      } else {
        await categoriesAPI.create(formData);
        setToast({ message: 'Category created successfully', type: 'success' });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error) {
      setToast({ message: error.message || 'Error saving category', type: 'error' });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!isAdmin) {
      setToast({ message: 'Only admins can delete categories', type: 'error' });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoriesAPI.delete(id);
      setToast({ message: 'Category deleted successfully', type: 'success' });
      loadCategories();
    } catch (error) {
      setToast({ message: error.message || 'Error deleting category', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Filter categories by search (name + description)
  const filteredCategories = searchQuery.trim()
    ? categories.filter((cat) => {
        const q = searchQuery.toLowerCase().trim();
        const name = (cat.name || '').toLowerCase();
        const desc = (cat.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : categories;

  // Pagination (based on filtered list)
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const hasCategories = categories.length > 0;
  const hasFilteredResults = filteredCategories.length > 0;

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 3;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages, currentPage + 1);
      if (currentPage === 1) endPage = 3;
      else if (currentPage === totalPages) startPage = totalPages - 2;
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="container categories-page">
      <div className="page-header">
        <h2>Categories Management</h2>
        <button
          type="button"
          className="btn btn-primary btn-icon btn-add-category"
          onClick={handleAddCategory}
          title="Add New Category"
        >
          <MdAdd size={20} />
        </button>
      </div>

      <div className="filters categories-filters">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search categories"
        />
      </div>

      <div className="table-container categories-table-container">
        <table className="data-table categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!hasCategories ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No categories found
                </td>
              </tr>
            ) : !hasFilteredResults ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No categories match your search
                </td>
              </tr>
            ) : (
              currentCategories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.description || 'N/A'}</td>
                  <td>{formatDate(category.createdAt)}</td>
                  <td className="action-buttons td-actions">
                    {isAdmin ? (
                      <>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleEditCategory(category._id)}
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => handleDeleteCategory(category._id)}
                          title="Delete"
                        >
                          <MdDelete size={18} />
                        </button>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container pagination-container-categories">
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn arrow"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || !hasFilteredResults}
            title="Previous page"
          >
            <MdChevronLeft size={22} />
          </button>
          {hasFilteredResults ? (
            getPageNumbers().map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
                title={`Page ${page}`}
              >
                {page}
              </button>
            ))
          ) : (
            <span className="pagination-empty-label">1</span>
          )}
          <button
            type="button"
            className="pagination-btn arrow"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || !hasFilteredResults}
            title="Next page"
          >
            <MdChevronRight size={22} />
          </button>
        </div>
        <div className="pagination-info">
          <span>
            {!hasFilteredResults
              ? '0 of 0'
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredCategories.length)} of ${filteredCategories.length}`}
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="pagination-select"
            title="Items per page"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
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

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Categories;
