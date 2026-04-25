import { items, customers, orders } from '../db/DB.js';

let cart = [];

export function initOrderPage() {
    // Auto-Generate Order ID
    $('#orderId').val('ORD-' + (orders.length + 1).toString().padStart(3, '0'));
    $('#orderDate').val(new Date().toISOString().split('T')[0]);

    // Load Combos
    loadCombos();
}

function loadCombos() {
    $('#orderCustomer, #orderItem').empty().append('<option>Select...</option>');
    customers.forEach(c => $('#orderCustomer').append(`<option value="${c._id}">${c._id}</option>`));
    items.forEach(i => $('#orderItem').append(`<option value="${i._code}">${i._code}</option>`));
}

export function addToCart() {
    let code = $('#orderItem').val();
    let qty = parseInt($('#orderQuantity').val());
    let item = items.find(i => i._code === code);

    if (qty > item._qty) { alert("Not enough stock!"); return; }

    let cartItem = cart.find(c => c.code === code);
    if (cartItem) {
        cartItem.qty += qty;
        cartItem.total = cartItem.qty * cartItem.price;
    } else {
        cart.push({ code: code, name: item._name, price: item._price, qty: qty, total: qty * item._price });
    }

    item._qty -= qty; // Stock update (In-memory)
    renderCart();
}

export function calculateTotal() {
    let subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    let discount = parseFloat($('#discountAmount').val()) || 0;
    let total = subtotal - (subtotal * discount / 100);
    $('#subtotal').text('Rs. ' + subtotal.toFixed(2));
    $('#total').text('Rs. ' + total.toFixed(2));
}

function renderCart() {
    $('#cartTableBody').empty();
    cart.forEach(i => {
        $('#cartTableBody').append(`<tr><td>${i.name}</td><td>${i.price}</td><td>${i.qty}</td><td>${i.total}</td></tr>`);
    });
    calculateTotal();
}