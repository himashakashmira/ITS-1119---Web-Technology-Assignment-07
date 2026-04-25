import { Item } from '../model/Item.js';
import { items } from '../db/DB.js';

// Regex Patterns
const codeRegEx     = /^(I00-)[0-9]{3}$/;
const itemNameRegEx = /^[A-Za-z0-9 ]{3,30}$/;
const priceRegEx    = /^[0-9]{1,10}(\.[0-9]{1,2})?$/;
const qtyRegEx      = /^[0-9]{1,5}$/;

// Save (Add new item)
export function saveItem() {
    let code  = $('#itemCode').val().trim();
    let name  = $('#itemName').val().trim();
    let price = $('#itemPrice').val().trim();
    let qty   = $('#itemQuantity').val().trim();

    if (!codeRegEx.test(code))     { alert('Invalid Item Code (Ex: I00-001)'); $('#itemCode').focus(); return; }
    if (items.find(i => i._code === code)) { alert('Item Code already exists!'); $('#itemCode').focus(); return; }
    if (!itemNameRegEx.test(name)) { alert('Invalid Item Name (3-30 chars)');  $('#itemName').focus(); return; }
    if (!priceRegEx.test(price))   { alert('Invalid Price (Ex: 120.00)');      $('#itemPrice').focus(); return; }
    if (!qtyRegEx.test(qty))       { alert('Invalid Quantity (numbers only)'); $('#itemQuantity').focus(); return; }

    items.push(new Item(code, name, parseFloat(price), parseInt(qty)));
    loadItems();
    updateStoreStats();
    clearItemFields();
    showToast('Item added successfully!', 'success');
}

window.bindItemRow = function (code) {
    let item = items.find(i => i._code === code);
    if (!item) return;

    $('#itemCode').val(item._code).prop('disabled', true);
    $('#itemName').val(item._name);
    $('#itemPrice').val(item._price.toFixed(2));
    $('#itemQuantity').val(item._qty);

    $('#itemFormTitle').text('Edit Item');
    $('#itemSaveBtn').html('<i class="fas fa-edit"></i> Update');
    // Swap onclick to updateItem
    $('.btn-primary[onclick="saveItem()"]').attr('onclick', 'updateItem()');
};

// Update existing item
window.updateItem = function () {
    let code = $('#itemCode').val();
    let item = items.find(i => i._code === code);
    if (!item) return;

    let name  = $('#itemName').val().trim();
    let price = $('#itemPrice').val().trim();
    let qty   = $('#itemQuantity').val().trim();

    if (!itemNameRegEx.test(name)) { alert('Invalid Item Name (3-30 chars)');  return; }
    if (!priceRegEx.test(price))   { alert('Invalid Price (Ex: 120.00)');      return; }
    if (!qtyRegEx.test(qty))       { alert('Invalid Quantity');                return; }

    item._name  = name;
    item._price = parseFloat(price);
    item._qty   = parseInt(qty);

    loadItems();
    updateStoreStats();
    clearItemFields();
    showToast('Item updated!', 'info');
};

// Delete item
window.deleteItem = function (code) {
    event.stopPropagation();
    if (!confirm('Remove this item from inventory?')) return;
    let idx = items.findIndex(i => i._code === code);
    if (idx > -1) {
        items.splice(idx, 1);
        loadItems();
        updateStoreStats();
        clearItemFields();
        showToast('Item deleted.', 'danger');
    }
};

// Clear form
window.clearItemForm = function () { clearItemFields(); };

function clearItemFields() {
    $('#itemCode').val('').prop('disabled', false);
    $('#itemName, #itemPrice, #itemQuantity').val('');
    $('#itemFormTitle').text('Add New Item');
    $('#itemSaveBtn').html('<i class="fas fa-save"></i> Add Item');
    $('.btn-primary[onclick="updateItem()"]').attr('onclick', 'saveItem()');
    $('#itemCode').focus();
}

// Load items into table
export function loadItems() {
    $('#itemsTableBody').empty();
    items.forEach(item => {
        let low = item._qty < 10;
        let badgeStyle = low
            ? 'background:rgba(239,68,68,0.15);color:#dc2626;'
            : 'background:rgba(34,197,94,0.15);color:#16a34a;';
        let row = `
            <tr onclick="bindItemRow('${item._code}')" style="cursor:pointer">
                <td>${item._code}</td>
                <td>${item._name}</td>
                <td style="color:#a855f7;font-weight:600;">Rs. ${item._price.toFixed(2)}</td>
                <td>
                    <span style="padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.8rem;font-weight:600;${badgeStyle}">
                        ${item._qty} ${low ? '⚠️' : ''}
                    </span>
                </td>
                <td>Rs. ${(item._price * item._qty).toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteItem('${item._code}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        $('#itemsTableBody').append(row);
    });
    $('#itemsCount').text(items.length);
}

// Update store stats dashboard
export function updateStoreStats() {
    $('#totalItems').text(items.length);
    $('#lowStockCount').text(items.filter(i => i._qty < 10).length);
    $('#inventoryValue').text('Rs. ' + items.reduce((s, i) => s + i._price * i._qty, 0).toLocaleString());
}

// Live search
$(document).on('input', '#itemSearch', function () {
    let q = $(this).val().toLowerCase();
    $('#itemsTableBody tr').each(function () {
        $(this).toggle($(this).text().toLowerCase().includes(q));
    });
});

// Toast helper (shared utility)
window.showToast = function (msg, type = 'success') {
    let colors = { success: '#16a34a', danger: '#dc2626', info: '#a855f7' };
    let toast = $(`<div style="
        position:fixed;bottom:2rem;right:2rem;z-index:9999;
        background:${colors[type] || colors.success};color:#fff;
        padding:0.75rem 1.5rem;border-radius:0.75rem;
        font-weight:600;font-size:0.9rem;
        box-shadow:0 4px 16px rgba(0,0,0,0.15);
        animation:fadeInUp 0.3s ease;
    ">${msg}</div>`);
    $('body').append(toast);
    setTimeout(() => toast.fadeOut(400, () => toast.remove()), 2500);
};
