export class OrderDetail {
    constructor(itemCode, itemName, qty, unitPrice, lineTotal) {
        this._itemCode = itemCode;
        this._itemName = itemName;
        this._qty = qty;
        this._unitPrice = unitPrice;
        this._lineTotal = lineTotal;
    }
}
