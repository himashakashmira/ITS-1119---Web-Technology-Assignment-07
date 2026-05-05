export class Order {
    constructor(id, date, customer, cartItems, subtotal, discount, total, cash, balance) {
        this._id = id;
        this._date = date;
        this._customer = customer;   // Full customer object
        this._cartItems = cartItems; // { code, name, price, qty, total }
        this._subtotal = subtotal;
        this._discount = discount;
        this._total = total;
        this._cash = cash;
        this._balance = balance;
    }
}
