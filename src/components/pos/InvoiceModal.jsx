import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function InvoiceModal({ invoice, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-table th { background-color: #f3f4f6; }
            .totals { text-align: right; margin-top: 20px; }
            .totals div { margin: 5px 0; }
            .total-amount { font-size: 18px; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  const handleDownload = () => {
    // Simple download as HTML (can be enhanced to PDF)
    const content = printRef.current.innerHTML;
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #10b981; }
            .invoice-number { font-size: 20px; font-weight: bold; margin: 10px 0; }
            .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #374151; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            .invoice-table th { background-color: #f3f4f6; font-weight: 600; }
            .totals { text-align: right; margin-top: 20px; }
            .totals div { margin: 8px 0; padding: 5px 0; }
            .total-amount { font-size: 20px; font-weight: bold; color: #10b981; border-top: 2px solid #10b981; padding-top: 10px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sale Completed Successfully</h2>
                <p className="text-green-100 text-sm">Transaction processed and inventory updated</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Print Invoice
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div ref={printRef}>
            {/* Invoice Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-green-600">
              <div className="text-3xl font-bold text-green-600 mb-2">AgriStock</div>
              <div className="text-sm text-slate-600">{invoice.seller.region}</div>
              <div className="text-2xl font-bold text-slate-900 mt-4">{invoice.invoiceNumber}</div>
              <div className="text-sm text-slate-500 mt-1">
                {new Date(invoice.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Farmer Details */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Farmer Details</div>
                <div className="text-sm font-semibold text-slate-900">{invoice.farmerName}</div>
                <div className="text-sm text-slate-600">{invoice.farmerPhone}</div>
                {invoice.farmerLocation && (
                  <div className="text-sm text-slate-600">{invoice.farmerLocation}</div>
                )}
              </div>

              {/* Advisor Attribution */}
              {invoice.advisorCode && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-xs font-semibold text-amber-700 uppercase mb-2">Advisor Attribution</div>
                  <div className="text-sm font-semibold text-slate-900">{invoice.advisorCode}</div>
                  <div className="text-sm text-slate-600">Commission Eligible</div>
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-xs font-semibold text-green-700 uppercase mb-2">Payment Method</div>
                <div className="text-sm font-semibold text-slate-900">{invoice.paymentMethod}</div>
                <div className="text-sm text-green-600 font-semibold">✓ Transaction Verified</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 text-xs font-semibold text-slate-500 uppercase">Product Name</th>
                  <th className="text-center py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                  <th className="text-right py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="text-sm font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                    </td>
                    <td className="text-center py-3 text-sm font-semibold">{item.quantity}</td>
                    <td className="text-right py-3 text-sm">{formatCurrency(item.price)}</td>
                    <td className="text-right py-3 text-sm font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Discount</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}

                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-semibold">{formatCurrency(invoice.tax)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg pt-3 border-t-2 border-green-600">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-bold text-green-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-xs text-slate-500 space-y-1">
                <p><strong>Notes & Terms:</strong></p>
                <p>• All agriculture chemical sales are final. Seed returns accepted within 48 hours in original sealed packaging.</p>
                <p>• Store credit only for returns.</p>
                <p>• Thank you for your business!</p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="mt-6 text-center text-xs text-slate-400">
              <p>Sold by: {invoice.seller.name} ({invoice.seller.role})</p>
              <p className="mt-1">This is a computer-generated invoice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
