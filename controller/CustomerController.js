import { Customer } from '../model/Customer.js';
import { customers } from '../db/DB.js';

// Tab key disable කිරීම
$(document).on('keydown', function (e) {
    if (e.which === 9) e.preventDefault();
});

const idRegEx = /^(C00-)[0-9]{3}$/;
const nameRegEx = /^[A-z ]{5,20}$/;

export function saveCustomer() {
    let id = $('#customerId').val();
    let name = $('#customerName').val();
    let address = $('#customerAddress').val();
    let salary = $('#customerSalary').val();

    if (!idRegEx.test(id)) { alert("Invalid ID (Ex: C00-001)"); return; }
    if (!nameRegEx.test(name)) { alert("Invalid Name (5-20 chars)"); return; }

    let newCustomer = new Customer(id, name, address, parseFloat(salary));
    customers.push(newCustomer);
    loadCustomers();
    clearFields();
}

// Table එකේ Row එකක් click කරද්දී Data පිරවීමට
window.bindCustomerRow = function (id) {
    let customer = customers.find(c => c._id === id);
    if (customer) {
        $('#customerId').val(customer._id).prop('disabled', true);
        $('#customerName').val(customer._name);
        $('#customerAddress').val(customer._address);
        $('#customerSalary').val(customer._salary);

        // Save button එක Update button එකක් බවට පත් කිරීම
        $('#customerSaveBtn').html('<i class="fas fa-edit"></i> Update');
        // පරණ onclick එක අයින් කරලා updateCustomer function එකට සම්බන්ධ කිරීම
        $('#customerSaveBtn').attr('onclick', 'updateCustomer()');
    }
}

// Update Logic
window.updateCustomer = function () {
    let id = $('#customerId').val();
    let customer = customers.find(c => c._id === id);

    if (customer) {
        customer._name = $('#customerName').val();
        customer._address = $('#customerAddress').val();
        customer._salary = parseFloat($('#customerSalary').val());

        alert("Customer Updated!");
        loadCustomers();
        clearCustomerFields();
    }
}

// Delete Logic
window.deleteCust = function (id) {
    // Event එක stop කරන්න නැත්නම් row click එකත් වැඩ කරනවා
    event.stopPropagation();

    if (confirm("Are you sure you want to delete this customer?")) {
        let index = customers.findIndex(c => c._id === id);
        if (index > -1) {
            customers.splice(index, 1);
            loadCustomers();
            clearCustomerFields();
            alert("Customer Deleted!");
        }
    }
}

// Form එක Clear කිරීම
window.clearCustomerForm = function () {
    $('#customerId').val("").prop('disabled', false);
    $('#customerName').val("");
    $('#customerAddress').val("");
    $('#customerSalary').val("");
    $('#customerSaveBtn').html('<i class="fas fa-save"></i> Save');
    $('#customerSaveBtn').attr('onclick', 'saveCustomer()');
}

export function loadCustomers() {
    $('#customersTableBody').empty();
    customers.forEach(c => {
        let row = `<tr onclick="bindCustomerRow('${c._id}')" style="cursor:pointer">
            <td>${c._id}</td>
            <td>${c._name}</td>
            <td>${c._address}</td>
            <td>Rs. ${c._salary.toLocaleString()}</td>
            <td>
                <button class='btn btn-danger btn-sm' onclick="deleteCust('${c._id}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
        $('#customersTableBody').append(row);
    });
    $('#customersCount').text(customers.length);
}

function clearFields() {
    $('#customerId, #customerName, #customerAddress, #customerSalary').val("");
}

// Live search 
$(document).on('input', '#customerSearch', function () {
    let q = $(this).val().toLowerCase();
    $('#customersTableBody tr').each(function () {
        $(this).toggle($(this).text().toLowerCase().includes(q));
    });
});
