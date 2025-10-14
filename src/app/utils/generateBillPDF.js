import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function generateBillPDF(customer, products, paymentMode, setLoading) {
  const doc = new jsPDF();
  

  const img = new Image();
  img.src = "/logo.png"; // ensure this file exists in /public

  img.onload = () => {
    // Add logo
    doc.addImage(img, "PNG", 10, 10, 40, 10);



    // Current date
    const today = new Date().toLocaleDateString();
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${today}`, 160, 18);

    // Customer Details
    doc.setFontSize(12);
    doc.text(`Customer: ${customer.name}`, 12, 35);
    doc.text(`Email: ${customer.email}`, 12, 42);
    doc.text(`Phone: ${customer.phone}`, 12, 48);
    doc.text(`Address: ${customer.address}`, 12, 54);

    // Payment Mode
    doc.text(`Payment Mode: ${paymentMode || "N/A"}`, 12, 60);

    // Product Table
    const tableData = products.map((p, i) => [
      i + 1,
      p.category,
      p.productName,
      p.price.toFixed(2),
      p.quantity,
      (p.price * p.quantity).toFixed(2),
    ]);

    autoTable(doc, {
      head: [["#", "Category", "Product", "Price", "Quantity", "Total"]],
      body: tableData,
      startY: 70,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 46, 184] },
    });

    // Total Amount
    const finalY = doc.lastAutoTable?.finalY || 80;
    const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Final Bill: Rs. ${totalAmount.toFixed(2)} `, 140, finalY + 10);

    // Footer Note
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for shopping with BillDesk!", 70, finalY + 25);

    // Save the PDF
    doc.save(`Bill_${new Date().toISOString()}.pdf`);
    if (setLoading) setLoading(false); // stop loader when PDF is ready
  };

}
