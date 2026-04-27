import { items, customers, orders } from '../db/DB.js';
import { Order } from '../model/Order.js';

let cart = [];

// Initialize Order page
export function initOrderPage() {
    // Auto-generate Order ID
    let nextNum = orders.length + 1;
    $('#orderId').val('ORD-' + nextNum.toString().padStart(3, '0'));

    // Set today's date
    $('#orderDate').val(new Date().toISOString().split('T')[0]);

    // Reset cart & payment
    cart = [];
    renderCart();
    $('#discountAmount, #cashAmount').val('');
    updatePaymentDisplay(0, 0, 0, 0);

    // Reload combos in case customers/items changed
    loadCombos();

    // Reset customer & item display panels
    $('#customerNameDisplay, #customerAddressDisplay, #customerSalaryDisplay').text('-');
    $('#itemDetailsSection').hide();
}

// Load customer & item
function loadCombos() {
    $('#orderCustomer').empty().append('<option value="">-- Select Customer --</option>');
    customers.forEach(c => {
        $('#orderCustomer').append(`<option value="${c._id}">${c._id} - ${c._name}</option>`);
    });

    $('#orderItem').empty().append('<option value="">-- Select Item --</option>');
    items.forEach(i => {
        $('#orderItem').append(`<option value="${i._code}">${i._code} - ${i._name}</option>`);
    });
}

// Update customer info panel when dropdown changes
window.updateCustomerInfo = function () {
    let id = $('#orderCustomer').val();
    let c  = customers.find(c => c._id === id);
    if (c) {
        $('#customerNameDisplay').text(c._name);
        $('#customerAddressDisplay').text(c._address);
        $('#customerSalaryDisplay').text('Rs. ' + c._salary.toLocaleString());
    } else {
        $('#customerNameDisplay, #customerAddressDisplay, #customerSalaryDisplay').text('-');
    }
};

// Update item info panel when dropdown changes
window.updateItemInfo = function () {
    let code = $('#orderItem').val();
    let item = items.find(i => i._code === code);
    if (item) {
        $('#itemNameDisplay').text(item._name);
        $('#itemPriceDisplay').text('Rs. ' + item._price.toFixed(2));
        $('#itemQtyDisplay').text(item._qty + ' units');
        $('#orderQuantity').val('');
        $('#itemDetailsSection').show();
    } else {
        $('#itemDetailsSection').hide();
    }
};

// ── Add item to cart ──────────────────────────────────────────
export function addToCart() {
    let code = $('#orderItem').val();
    let qtyInput = parseInt($('#orderQuantity').val());
    let item = items.find(i => i._code === code);

    if (!code || !item) { alert('Please select an item.'); return; }
    if (!qtyInput || qtyInput < 1) { alert('Enter a valid quantity.'); return; }
    if (qtyInput > item._qty) { alert(`Only ${item._qty} units in stock!`); return; }

    // Check if already in cart → merge
    let existing = cart.find(c => c.code === code);
    if (existing) {
        let newQty = existing.qty + qtyInput;
        if (newQty > (item._qty + existing.qty)) {
            alert('Not enough stock for that quantity!'); return;
        }
        // Give back old qty to stock then deduct new total
        item._qty += existing.qty;
        existing.qty   = newQty;
        existing.total = newQty * existing.price;
        item._qty -= newQty;
    } else {
        cart.push({ code, name: item._name, price: item._price, qty: qtyInput, total: qtyInput * item._price });
        item._qty -= qtyInput;
    }

    // Refresh item qty display
    $('#itemQtyDisplay').text(item._qty + ' units');
    renderCart();
    calculateTotal();
    $('#orderQuantity').val('');
    showToast('Item added to cart!', 'success');
}

// ── Remove item from cart ─────────────────────────────────────
window.removeFromCart = function (code) {
    let idx   = cart.findIndex(c => c.code === code);
    if (idx === -1) return;
    let cartItem = cart[idx];
    // Return stock
    let item = items.find(i => i._code === code);
    if (item) item._qty += cartItem.qty;
    cart.splice(idx, 1);
    renderCart();
    calculateTotal();
    // Refresh panel if same item is still selected
    if ($('#orderItem').val() === code && item) {
        $('#itemQtyDisplay').text(item._qty + ' units');
    }
};

// ── Render cart table ─────────────────────────────────────────
function renderCart() {
    let tbody = $('#cartTableBody').empty();

    if (cart.length === 0) {
        $('#emptyCartMessage').show();
        $('#cartTable').hide();
    } else {
        $('#emptyCartMessage').hide();
        $('#cartTable').show();
        cart.forEach(i => {
            tbody.append(`
                <tr>
                    <td>${i.name}</td>
                    <td>Rs. ${i.price.toFixed(2)}</td>
                    <td>${i.qty}</td>
                    <td style="color:#a855f7;font-weight:600;">Rs. ${i.total.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart('${i.code}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>`);
        });
    }
}

// Calculate totals
export function calculateTotal() {
    let subtotal = cart.reduce((s, i) => s + i.total, 0);
    let discount = parseFloat($('#discountAmount').val()) || 0;
    let total    = subtotal - discount;
    if (total < 0) total = 0;
    let cash    = parseFloat($('#cashAmount').val()) || 0;
    let balance = cash - total;
    updatePaymentDisplay(subtotal, discount, total, balance);
}

// Update payment display
window.updatePayment = function () { calculateTotal(); };

function updatePaymentDisplay(subtotal, discount, total, balance) {
    $('#subtotal').text('Rs. ' + subtotal.toFixed(2));
    $('#total').text('Rs. ' + total.toFixed(2));
    $('#balance').text('Rs. ' + balance.toFixed(2));

    // Highlight balance box
    if (balance < 0) {
        $('#balanceBox').css({ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)' });
        $('#balance').css('color', '#dc2626');
    } else {
        $('#balanceBox').css({ background: '', borderColor: '' });
        $('#balance').css('color', '#16a34a');
    }
}

// Purchase (Place Order)
window.purchaseOrder = function () {
    let custId = $('#orderCustomer').val();
    if (!custId) { alert('Please select a customer.'); return; }
    if (cart.length === 0) { alert('Cart is empty! Add items first.'); return; }

    let cash = parseFloat($('#cashAmount').val()) || 0;
    let subtotal = cart.reduce((s, i) => s + i.total, 0);
    let discount = parseFloat($('#discountAmount').val()) || 0;
    let total    = Math.max(subtotal - discount, 0);
    let balance  = cash - total;

    if (cash < total) {
        alert(`Cash amount (Rs. ${cash.toFixed(2)}) is less than total (Rs. ${total.toFixed(2)})!`);
        return;
    }

    let customer = customers.find(c => c._id === custId);
    let orderId  = $('#orderId').val();
    let date     = $('#orderDate').val();

    // Snapshot cart for history
    let snapshot = cart.map(c => ({ ...c }));

    let order = new Order(orderId, date,
        { id: customer._id, name: customer._name, address: customer._address },
        snapshot, subtotal, discount, total, cash, balance
    );
    orders.push(order);

    showToast(`✅ Order ${orderId} placed! Change: Rs. ${balance.toFixed(2)}`, 'success');

    // Refresh order history if already loaded
    if (typeof loadOrderHistory === 'function') loadOrderHistory();

    // Reset page for next order
    setTimeout(() => initOrderPage(), 800);
};

// Order History: Load table
export function loadOrderHistory() {
    renderOrderHistory(orders);
}

window.loadOrderHistory = loadOrderHistory;

function renderOrderHistory(data) {
    let tbody = $('#orderHistoryTableBody').empty();

    if (data.length === 0) {
        $('#emptyOrderHistory').show();
        tbody.closest('div.table-container').hide();
    } else {
        $('#emptyOrderHistory').hide();
        tbody.closest('div.table-container').show();
        data.forEach(o => {
            let itemSummary = o._cartItems.map(i => `${i.name} ×${i.qty}`).join(', ');
            tbody.append(`
                <tr>
                    <td style="font-weight:600;color:#a855f7;">${o._id}</td>
                    <td>${o._date}</td>
                    <td>${o._customer.name}<br><small style="color:#6b7280;">${o._customer.id}</small></td>
                    <td style="max-width:180px;font-size:0.8rem;color:#374151;">${itemSummary}</td>
                    <td>Rs. ${o._subtotal.toFixed(2)}</td>
                    <td>${o._discount > 0 ? 'Rs. ' + o._discount.toFixed(2) : '-'}</td>
                    <td style="font-weight:700;color:#a855f7;">Rs. ${o._total.toFixed(2)}</td>
                    <td>
                        <span style="font-size:0.75rem;">Cash: Rs. ${o._cash.toFixed(2)}</span><br>
                        <span style="color:#16a34a;font-weight:600;">Change: Rs. ${o._balance.toFixed(2)}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm" style="background:rgba(168,85,247,0.15);color:#a855f7;"
                            onclick="viewOrderDetails('${o._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>`);
        });
    }
    $('#totalOrders').text(data.length);
}

// Order History: Search & filter
$(document).on('input', '#orderHistorySearch', filterOrders);
$(document).on('change', '#orderHistoryDate', filterOrders);

function filterOrders() {
    let q    = $('#orderHistorySearch').val().toLowerCase();
    let date = $('#orderHistoryDate').val();
    let filtered = orders.filter(o => {
        let matchText = (o._id + o._customer.name + o._customer.id).toLowerCase().includes(q);
        let matchDate = !date || o._date === date;
        return matchText && matchDate;
    });
    renderOrderHistory(filtered);
}

window.clearOrderHistoryFilters = function () {
    $('#orderHistorySearch').val('');
    $('#orderHistoryDate').val('');
    renderOrderHistory(orders);
};

// View Order Details modal
window.viewOrderDetails = function (orderId) {
    let o = orders.find(o => o._id === orderId);
    if (!o) return;

    let itemRows = o._cartItems.map(i => `
        <tr>
            <td>${i.code}</td>
            <td>${i.name}</td>
            <td>${i.qty}</td>
            <td>Rs. ${i.price.toFixed(2)}</td>
            <td style="font-weight:600;">Rs. ${i.total.toFixed(2)}</td>
        </tr>`).join('');

    let modal = $(`
        <div id="orderModal" style="
            position:fixed;inset:0;z-index:10000;
            background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
            display:flex;align-items:center;justify-content:center;padding:1rem;">
            <div style="
                background:#fff;border-radius:1.25rem;padding:2rem;
                max-width:620px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);
                max-height:85vh;overflow-y:auto;">

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="font-size:1.25rem;font-weight:700;color:#1f2937;">
                        <i class="fas fa-receipt" style="color:#a855f7;margin-right:0.5rem;"></i>
                        Order Receipt — ${o._id}
                    </h3>
                    <button onclick="$('#orderModal').remove()"
                        style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#6b7280;">✕</button>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                    <div style="background:rgba(168,85,247,0.06);border-radius:0.75rem;padding:1rem;">
                        <p style="font-size:0.75rem;color:#6b7280;margin-bottom:0.25rem;">Date</p>
                        <p style="font-weight:600;">${o._date}</p>
                    </div>
                    <div style="background:rgba(168,85,247,0.06);border-radius:0.75rem;padding:1rem;">
                        <p style="font-size:0.75rem;color:#6b7280;margin-bottom:0.25rem;">Customer</p>
                        <p style="font-weight:600;">${o._customer.name}</p>
                        <p style="font-size:0.75rem;color:#a855f7;">${o._customer.id}</p>
                    </div>
                </div>

                <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.875rem;">
                    <thead>
                        <tr style="background:rgba(168,85,247,0.08);">
                            <th style="padding:0.6rem;text-align:left;border-bottom:1px solid #e5e7eb;">Code</th>
                            <th style="padding:0.6rem;text-align:left;border-bottom:1px solid #e5e7eb;">Item</th>
                            <th style="padding:0.6rem;text-align:left;border-bottom:1px solid #e5e7eb;">Qty</th>
                            <th style="padding:0.6rem;text-align:left;border-bottom:1px solid #e5e7eb;">Price</th>
                            <th style="padding:0.6rem;text-align:left;border-bottom:1px solid #e5e7eb;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>

                <div style="border-top:2px solid rgba(168,85,247,0.2);padding-top:1rem;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
                        <span style="color:#6b7280;">Subtotal</span>
                        <span>Rs. ${o._subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
                        <span style="color:#6b7280;">Discount</span>
                        <span style="color:#dc2626;">- Rs. ${o._discount.toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;color:#a855f7;margin-bottom:0.4rem;">
                        <span>Total</span>
                        <span>Rs. ${o._total.toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;">
                        <span style="color:#6b7280;">Cash Paid</span>
                        <span>Rs. ${o._cash.toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-weight:600;color:#16a34a;">
                        <span>Change</span>
                        <span>Rs. ${o._balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>`);

    $('body').append(modal);
    // Close on backdrop click
    modal.on('click', function (e) {
        if ($(e.target).is('#orderModal')) modal.remove();
    });
};
