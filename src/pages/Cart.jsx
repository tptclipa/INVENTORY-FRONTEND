import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { requestsAPI } from '../services/api';
import Toast from '../components/Toast';
import { MdDelete, MdShoppingCart } from 'react-icons/md';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    notes: '',
    requestedByName: '',
    requestedByDesignation: '',
    receivedByName: '',
    receivedByDesignation: '',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = cartItems.find(ci => ci.item._id === itemId);
    if (item && newQuantity > item.item.quantity) {
      setToast({ 
        message: `Cannot exceed available stock (${item.item.quantity})`, 
        type: 'error' 
      });
      return;
    }
    updateCartItemQuantity(itemId, parseInt(newQuantity));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setToast({ message: 'Your cart is empty', type: 'error' });
      return;
    }

    setIsCheckingOut(true);

    try {
      // Create a single request with all items from the cart
      const requestData = {
        items: cartItems.map(cartItem => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
          unit: cartItem.unit
        })),
        purpose: formData.purpose,
        notes: formData.notes,
        requestedByName: formData.requestedByName,
        requestedByDesignation: formData.requestedByDesignation,
        receivedByName: formData.receivedByName,
        receivedByDesignation: formData.receivedByDesignation,
      };

      await requestsAPI.create(requestData);

      setToast({ 
        message: `Successfully submitted request with ${cartItems.length} item(s)!`, 
        type: 'success' 
      });

      // Clear cart and redirect after a short delay
      clearCart();
      setTimeout(() => {
        navigate('/requests');
      }, 1500);

    } catch (error) {
      setToast({ 
        message: error.message || 'Error submitting requests', 
        type: 'error' 
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h2>Shopping Cart</h2>
        </div>
        <div className="empty-cart-message">
          <MdShoppingCart size={80} className="empty-cart-icon" />
          <h3>Your cart is empty</h3>
          <p>Add items from the inventory to get started</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Shopping Cart ({getCartTotal()} items)</h2>
        <button 
          className="btn btn-secondary" 
          onClick={clearCart}
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-layout">
        {/* Cart Items Section */}
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cartItems.map((cartItem) => (
              <div key={cartItem.item._id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{cartItem.item.name}</h4>
                  {cartItem.item.sku && (
                    <p className="text-muted">SKU: {cartItem.item.sku}</p>
                  )}
                  <p className="text-muted">Available: {cartItem.item.quantity}</p>
                  {cartItem.item.quantity <= cartItem.item.minStockLevel && (
                    <p className="text-warning">⚠️ Low stock</p>
                  )}
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <label>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={cartItem.item.quantity}
                      value={cartItem.quantity}
                      onChange={(e) => handleQuantityChange(cartItem.item._id, e.target.value)}
                      style={{ width: '80px', marginLeft: '10px' }}
                    />
                    <span style={{ marginLeft: '10px' }}>{cartItem.unit}</span>
                  </div>
                  
                  <button
                    className="btn btn-danger btn-icon"
                    onClick={() => removeFromCart(cartItem.item._id)}
                    title="Remove from cart"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Form Section */}
        <div className="checkout-section">
          <div className="checkout-card">
            <h3>Checkout Information</h3>
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label htmlFor="purpose">Purpose *</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows="3"
                  value={formData.purpose}
                  onChange={handleFormChange}
                  placeholder="Please describe why you need these items..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Any additional information..."
                />
              </div>

              <div className="form-section-divider">
                <h4>RIS Form Information</h4>
              </div>

              <div className="form-group">
                <label htmlFor="requestedByName">Requested By (Name) *</label>
                <input
                  type="text"
                  id="requestedByName"
                  name="requestedByName"
                  value={formData.requestedByName}
                  onChange={handleFormChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="requestedByDesignation">Designation/Position *</label>
                <input
                  type="text"
                  id="requestedByDesignation"
                  name="requestedByDesignation"
                  value={formData.requestedByDesignation}
                  onChange={handleFormChange}
                  placeholder="e.g., Instructor, Staff"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="receivedByName">Received By (Name) *</label>
                <input
                  type="text"
                  id="receivedByName"
                  name="receivedByName"
                  value={formData.receivedByName}
                  onChange={handleFormChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="receivedByDesignation">Designation/Position *</label>
                <input
                  type="text"
                  id="receivedByDesignation"
                  name="receivedByDesignation"
                  value={formData.receivedByDesignation}
                  onChange={handleFormChange}
                  placeholder="e.g., Instructor, Staff"
                  required
                />
              </div>

              <div className="checkout-summary">
                <p><strong>Total Items:</strong> {getCartTotal()}</p>
                <p><strong>Total Requests:</strong> {cartItems.length}</p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Processing...' : 'Submit All Requests'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Cart;
