import { initialSales } from "@/lib/seed-data"

export async function GET() {
  const header = "invoice,date,cashier,payment,total\n"
  const rows = initialSales
    .map((sale) =>
      [
        sale.invoiceNumber,
        new Date(sale.createdAt).toISOString(),
        sale.cashierName,
        sale.paymentMethod,
        sale.grandTotal,
      ].join(",")
    )
    .join("\n")

  return new Response(header + rows, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=restaurant-sales.csv",
    },
  })
}
