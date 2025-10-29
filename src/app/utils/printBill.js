export default function printBill(customer, products, session, printRef) {
  if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;

    // Merchant details
    const merchantName = session?.user?.name || "Quick Bill Merchant";
    const merchantEmail = session?.user?.email || "merchant@quickbill.com";

    // Customer details
    const customerDetails = `
    <p><strong>Customer Name:</strong> ${customer.name}</p>
    <p><strong>Customer Email:</strong> ${customer.email}</p>
    <p><strong>Customer Phone:</strong> ${customer.phone || "-"}</p>
    
  `;

    // Calculate total amount
    const totalAmount = products.reduce((acc, p) => acc + p.price * p.quantity, 0).toFixed(2);

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
    <html>
      <head>
        <title>Quick Bill</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h4 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
          .merchant, .customer { margin-bottom: 20px; }
          .total { margin-top: 20px; font-weight: bold; font-size: 16px; text-align: right; }
          .footer { text-align: center; margin-top: 40px; font-style: italic; }
        </style>
      </head>


      <body>
        

        ${printContent}

        <p class="total">Total Amount: ₹${totalAmount}</p>

        <div class="footer">
          Quick Bill Billing Application
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };