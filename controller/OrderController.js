import { items, customers, orders } from '../db/DB.js';
import { Order } from '../model/Order.js';

let cart = [];

export function initOrderPage() {
    let nextNum = orders.length + 1;
    $('#orderId').val('ORD-' + nextNum.toString().padStart(3, '0'));
    $('#orderDate').val(new Date().toISOString().split('T')[0]);

    cart = [];
    renderCart();
    $('#discountAmount, #cashAmount').val('');
    updatePaymentDisplay(0, 0, 0, 0);
    loadCombos();

    $('#customerNameDisplay, #customerAddressDisplay, #customerSalaryDisplay').text('-');
    $('#itemDetailsSection').hide();
}

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

export function addToCart() {
    let code = $('#orderItem').val();
    let qtyInput = parseInt($('#orderQuantity').val());
    let item = items.find(i => i._code === code);

    if (!code || !item) { alert('Please select an item.'); return; }
    if (!qtyInput || qtyInput < 1) { alert('Enter a valid quantity.'); return; }
    if (qtyInput > item._qty) { alert(`Only ${item._qty} units in stock!`); return; }

    let existing = cart.find(c => c.code === code);
    if (existing) {
        let newQty = existing.qty + qtyInput;
        item._qty += existing.qty;
        existing.qty   = newQty;
        existing.total = newQty * existing.price;
        item._qty -= newQty;
    } else {
        cart.push({ code, name: item._name, price: item._price, qty: qtyInput, total: qtyInput * item._price });
        item._qty -= qtyInput;
    }

    $('#itemQtyDisplay').text(item._qty + ' units');
    renderCart();
    calculateTotal();
    $('#orderQuantity').val('');
}

window.removeFromCart = function (code) {
    let idx   = cart.findIndex(c => c.code === code);
    if (idx === -1) return;
    let cartItem = cart[idx];
    let item = items.find(i => i._code === code);
    if (item) item._qty += cartItem.qty;
    cart.splice(idx, 1);
    renderCart();
    calculateTotal();
};

function renderCart() {
    let tbody = $('#cartTableBody').empty();
    if (cart.length === 0) {
        $('#emptyCartMessage').show();
        $('#cartTable').hide();
    } else {
        $('#emptyCartMessage').hide();
        $('#cartTable').show();
        cart.forEach(i => {
            tbody.append(`<tr><td>${i.name}
                </td><td>Rs. ${i.price.toFixed(2)}
                </td><td>${i.qty}
                </td><td style="color:#a855f7;font-weight:600;">Rs. ${i.total.toFixed(2)}
                </td><td><button class="btn btn-danger btn-sm" onclick="removeFromCart('${i.code}')"><i class="fas fa-times"></i></button>
                </td></tr>`);
        });
    }
}

export function calculateTotal() {
    let subtotal = cart.reduce((s, i) => s + i.total, 0);
    let discount = parseFloat($('#discountAmount').val()) || 0;
    let total    = Math.max(subtotal - discount, 0);
    let cash    = parseFloat($('#cashAmount').val()) || 0;
    let balance = cash - total;
    updatePaymentDisplay(subtotal, discount, total, balance);
}

window.updatePayment = calculateTotal;

function updatePaymentDisplay(subtotal, discount, total, balance) {
    $('#subtotal').text('Rs. ' + subtotal.toFixed(2));
    $('#total').text('Rs. ' + total.toFixed(2));
    $('#balance').text('Rs. ' + balance.toFixed(2));
}

window.purchaseOrder = function () {
    let custId = $('#orderCustomer').val();
    if (!custId || cart.length === 0) { alert('Missing data!'); return; }

    let cash = parseFloat($('#cashAmount').val()) || 0;
    let subtotal = cart.reduce((s, i) => s + i.total, 0);
    let discount = parseFloat($('#discountAmount').val()) || 0;
    let total = Math.max(subtotal - discount, 0);

    if (cash < total) { alert('Insufficient Cash!'); return; }

    let customer = customers.find(c => c._id === custId);
    let orderId  = $('#orderId').val();
    let date     = $('#orderDate').val();
    let balance  = cash - total;

    let snapshot = cart.map(c => ({ ...c }));
    let order = new Order(orderId, date, { id: customer._id, name: customer._name, address: customer._address }, snapshot, subtotal, discount, total, cash, balance);
    orders.push(order);

    alert(`Order ${orderId} Placed!`);
    if (typeof loadOrderHistory === 'function') loadOrderHistory();
    initOrderPage();
};

export function loadOrderHistory() { renderOrderHistory(orders); }
window.loadOrderHistory = loadOrderHistory;

function renderOrderHistory(data) {
    let tbody = $('#orderHistoryTableBody').empty();
    data.forEach(o => {
        tbody.append(`<tr><td style="color:#a855f7; font-weight:600;">${o._id}</td><td>${o._date}</td><td>${o._customer.name}</td><td>Rs. ${o._total.toFixed(2)}</td><td><button class="btn btn-sm btn-info" onclick="viewOrderDetails('${o._id}')"><i class="fas fa-eye"></i></button></td></tr>`);
    });
}

window.viewOrderDetails = function (orderId) {
    let o = orders.find(ord => ord._id === orderId);
    if (!o) return;

    // Modal labels values fill
    $('#lblOrderId').text("Receipt: " + o._id);
    $('#lblOrderDate').text(o._date);
    $('#lblCustName').text(o._customer.name + " (" + o._customer.id + ")");
    $('#lblSubtotal').text(o._subtotal.toFixed(2));
    $('#lblDiscount').text(o._discount.toFixed(2));
    $('#lblNetTotal').text(o._total.toFixed(2));
    $('#lblBalance').text(o._balance.toFixed(2));

    // Table rows fill
    let rows = "";
    o._cartItems.forEach(item => {
        rows += "<tr>" +
                "<td style='padding:8px;'>" + item.name + "</td>" +
                "<td style='padding:8px;'>" + item.qty + "</td>" +
                "<td style='padding:8px;'>Rs. " + item.price.toFixed(2) + "</td>" +
                "<td style='padding:8px;'>Rs. " + item.total.toFixed(2) + "</td>" +
                "</tr>";
    });
    $('#lblOrderTableBody').html(rows);

    // 3. Modal එක පෙන්වන්න
    $('#orderDetailModal').css('display', 'flex');
};