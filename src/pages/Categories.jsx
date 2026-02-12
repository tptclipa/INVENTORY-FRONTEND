import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { MdEdit, MdDelete } from 'react-icons/md';

const Categories = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [toast, setToast] = useState(null);
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
      setCategories(data.data);
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

  return (
    <div className="container">
      <div className="page-header">
        <h2>Categories Management</h2>
        <button className="btn btn-primary" onClick={handleAddCategory}>
          Add New Category
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.description || 'N/A'}</td>
                  <td>{formatDate(category.createdAt)}</td>
                  <td className="action-buttons">
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
