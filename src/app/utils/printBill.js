export default function printBill(customer, products, session, printRef) {
  if (!printRef.current) return;

  const printContent = printRef.current.innerHTML;

  const merchantName = session?.user?.name || "Quick Bill Merchant";
  const merchantEmail = session?.user?.email || "merchant@quickbill.com";

  const totalAmount = products
    .reduce((acc, p) => acc + (p.price || 0) * (p.quantity || 0), 0)
    .toFixed(2);

  const totalGST = products.reduce((acc, p) => acc + (p.taxAmount || 0), 0);
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const subtotal = totalAmount - totalGST;

  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>Quick Bill</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            padding: 10px;
            color: #000;
            line-height: 1.3;
          }

          h3, h4 {
            margin: 3px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            font-size: 11px;
          }

          th {
            background: #f2f2f2;
          }

          /* Invoice Header */
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }

          .invoice-header img {
            height: 40px;
          }

          .invoice-company {
            text-align: right;
          }

          /* Billing + Shipping side by side */
          .billing-shipping {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 10px;
          }

          .billing, .shipping {
            width: 48%;
          }

          .billing p, .shipping p {
            margin: 2px 0;
            font-size: 11px;
          }

          /* Summary row (Subtotal, GST, etc.) */
          .summary-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            font-weight: bold;
            gap: 30px;
          }

          .summary-row div {
            text-align: right;
            font-size: 12px;
          }

          /* Terms section small font */
          .terms {
            margin-top: 15px;
            font-size: 10px;
            font-style: italic;
          }

          /* Footer */
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
            font-style: italic;
          }

          /* Avoid page breaks in important parts */
          .billing-shipping, table, .summary-row, .terms {
            page-break-inside: avoid;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        

        

        ${printContent}

        
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
