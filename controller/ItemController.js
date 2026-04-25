import { Item } from '../model/Item.js';
import { items } from '../db/DB.js';

// Regex Patterns (Assignment Requirement)
// ID එක I00-001 format එකට සහ Name එක අකුරු 3කට වඩා වැඩි විය යුතුයි
const codeRegEx = /^(I00-)[0-9]{3}$/;
const itemNameRegEx = /^[A-z0-9 ]{3,30}$/;
const priceRegEx = /^[0-9]{1,10}(\.[0-9]{2})?$/;
const qtyRegEx = /^[0-9]{1,5}$/;

// Item එකක් Save කිරීමේ function එක
export function saveItem() {
    let code = $('#itemCode').val();
    let name = $('#itemName').val();
    let price = $('#itemPrice').val();
    let qty = $('#itemQuantity').val();

    // Validations
    if (!codeRegEx.test(code)) { 
        alert("Invalid Item Code (Ex: I00-001)"); 
        $('#itemCode').focus();
        return; 
    }
    if (!itemNameRegEx.test(name)) { 
        alert("Invalid Item Name (3-30 chars)"); 
        $('#itemName').focus();
        return; 
    }
    if (!priceRegEx.test(price)) { 
        alert("Invalid Price (Ex: 120.00)"); 
        $('#itemPrice').focus();
        return; 
    }
    if (!qtyRegEx.test(qty)) { 
        alert("Invalid Quantity"); 
        $('#itemQuantity').focus();
        return; 
    }

    // අලුත් Item Object එකක් සෑදීම
    let newItem = new Item(code, name, parseFloat(price), parseInt(qty));
    
    // Array එකට දත්ත ඇතුළත් කිරීම (In-memory DB)
    items.push(newItem);
    
    loadItems(); // Table එක Refresh කිරීම
    updateStoreStats(); // Dashboard එකේ ගණන් හිලව් Update කිරීම
    clearItemFields();
}

// Array එකේ ඇති දත්ත Table එකට Load කිරීම
export function loadItems() {
    $('#itemsTableBody').empty();
    items.forEach(item => {
        let isLowStock = item._qty < 10; // Stock එක 10ට අඩු නම් warning එකක් පෙන්වීමට
        let row = `<tr>
            <td>${item._code}</td>
            <td>${item._name}</td>
            <td style="color: #a855f7; font-weight: 600;">Rs. ${item._price.toFixed(2)}</td>
            <td>
                <span style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; 
                background: ${isLowStock ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; 
                color: ${isLowStock ? '#dc2626' : '#16a34a'};">
                    ${item._qty} ${isLowStock ? '⚠️' : ''}
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

// Dashboard එකේ Stats update කරන function එක
export function updateStoreStats() {
    const totalItems = items.length;
    const lowStockCount = items.filter(i => i._qty < 10).length;
    const totalValue = items.reduce((sum, i) => sum + (i._price * i._qty), 0);

    $('#totalItems').text(totalItems);
    $('#lowStockCount').text(lowStockCount);
    $('#inventoryValue').text('Rs. ' + totalValue.toLocaleString());
}

// Field හිස් කිරීමේ function එක
function clearItemFields() {
    $('#itemCode, #itemName, #itemPrice, #itemQuantity').val("");
    $('#itemCode').focus();
}

// Item එකක් Delete කිරීම
window.deleteItem = function(code) {
    if (confirm('Are you sure you want to remove this item?')) {
        let index = items.findIndex(i => i._code === code);
        items.splice(index, 1);
        loadItems();
        updateStoreStats();
    }
}

// Item search
$('#itemSearch').on('input', function() {
    let value = $(this).val().toLowerCase();
    $('#itemsTableBody tr').filter(function() {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
});