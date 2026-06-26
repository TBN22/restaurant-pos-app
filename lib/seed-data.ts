import type {
  AuditLog,
  InventoryLog,
  MenuCategory,
  MenuItem,
  Sale,
  StaffUser,
} from "@/lib/types"

export const categories: MenuCategory[] = [
  { id: "salan", name: "Salan", description: "Daily curry and gravy items" },
  { id: "karahi", name: "Karahi", description: "Chicken and mutton karahi" },
  { id: "rice", name: "Rice", description: "Biryani, pulao, and plain rice" },
  { id: "bread", name: "Bread", description: "Roti and naan" },
  { id: "drinks", name: "Drinks", description: "Cold drinks and water" },
  { id: "tea", name: "Tea", description: "Hot tea service" },
  { id: "extras", name: "Extras", description: "Sides and service items" },
]

export const initialMenuItems: MenuItem[] = [
  { id: "chicken-karahi", name: "Chicken Karahi", categoryId: "karahi", price: 1200, costPrice: 760, currentStock: 18, minimumStock: 6, status: "available" },
  { id: "mutton-karahi", name: "Mutton Karahi", categoryId: "karahi", price: 1800, costPrice: 1180, currentStock: 8, minimumStock: 5, status: "available" },
  { id: "daal", name: "Daal", categoryId: "salan", price: 220, costPrice: 95, currentStock: 35, minimumStock: 10, status: "available" },
  { id: "white-chana", name: "White Chana", categoryId: "salan", price: 260, costPrice: 120, currentStock: 24, minimumStock: 8, status: "available" },
  { id: "nihari", name: "Nihari", categoryId: "salan", price: 520, costPrice: 310, currentStock: 11, minimumStock: 6, status: "available" },
  { id: "biryani", name: "Biryani", categoryId: "rice", price: 420, costPrice: 235, currentStock: 45, minimumStock: 12, status: "available" },
  { id: "pulao", name: "Pulao", categoryId: "rice", price: 380, costPrice: 210, currentStock: 21, minimumStock: 8, status: "available" },
  { id: "salan", name: "Salan Plate", categoryId: "salan", price: 300, costPrice: 150, currentStock: 30, minimumStock: 10, status: "available" },
  { id: "roti", name: "Roti", categoryId: "bread", price: 30, costPrice: 12, currentStock: 140, minimumStock: 40, status: "available" },
  { id: "naan", name: "Naan", categoryId: "bread", price: 60, costPrice: 24, currentStock: 65, minimumStock: 25, status: "available" },
  { id: "tea", name: "Tea", categoryId: "tea", price: 120, costPrice: 45, currentStock: 70, minimumStock: 20, status: "available" },
  { id: "soft-drinks", name: "Soft Drinks", categoryId: "drinks", price: 150, costPrice: 95, currentStock: 36, minimumStock: 15, status: "available" },
  { id: "water", name: "Water", categoryId: "drinks", price: 80, costPrice: 45, currentStock: 48, minimumStock: 20, status: "available" },
  { id: "salad", name: "Salad", categoryId: "extras", price: 100, costPrice: 38, currentStock: 16, minimumStock: 8, status: "available" },
  { id: "extra-plate", name: "Extra Plate", categoryId: "extras", price: 50, costPrice: 8, currentStock: 90, minimumStock: 25, status: "available" },
]

export const users: StaffUser[] = [
  { id: "owner", name: "Restaurant Owner", email: "owner@karahipos.com", role: "admin", status: "active", lastLogin: "Today, 10:20 AM" },
  { id: "ali", name: "Ali Cashier", email: "ali@karahipos.com", role: "staff", status: "active", lastLogin: "Today, 09:05 AM" },
  { id: "sana", name: "Sana Counter", email: "sana@karahipos.com", role: "staff", status: "active", lastLogin: "Yesterday, 08:50 PM" },
]

export const initialSales: Sale[] = [
  {
    id: "sale-1008",
    invoiceNumber: "KP-1008",
    createdAt: new Date().toISOString(),
    cashierId: "ali",
    cashierName: "Ali Cashier",
    items: [
      { itemId: "biryani", name: "Biryani", quantity: 3, unitPrice: 420, lineTotal: 1260 },
      { itemId: "roti", name: "Roti", quantity: 6, unitPrice: 30, lineTotal: 180 },
      { itemId: "water", name: "Water", quantity: 2, unitPrice: 80, lineTotal: 160 },
    ],
    subtotal: 1600,
    discount: 0,
    tax: 0,
    grandTotal: 1600,
    paymentMethod: "cash",
    status: "completed",
  },
  {
    id: "sale-1007",
    invoiceNumber: "KP-1007",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    cashierId: "sana",
    cashierName: "Sana Counter",
    items: [
      { itemId: "chicken-karahi", name: "Chicken Karahi", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
      { itemId: "naan", name: "Naan", quantity: 4, unitPrice: 60, lineTotal: 240 },
      { itemId: "soft-drinks", name: "Soft Drinks", quantity: 2, unitPrice: 150, lineTotal: 300 },
    ],
    subtotal: 1740,
    discount: 100,
    tax: 0,
    grandTotal: 1640,
    paymentMethod: "card",
    status: "completed",
  },
  {
    id: "sale-1006",
    invoiceNumber: "KP-1006",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    cashierId: "ali",
    cashierName: "Ali Cashier",
    items: [
      { itemId: "daal", name: "Daal", quantity: 2, unitPrice: 220, lineTotal: 440 },
      { itemId: "roti", name: "Roti", quantity: 8, unitPrice: 30, lineTotal: 240 },
      { itemId: "tea", name: "Tea", quantity: 3, unitPrice: 120, lineTotal: 360 },
    ],
    subtotal: 1040,
    discount: 0,
    tax: 0,
    grandTotal: 1040,
    paymentMethod: "wallet",
    status: "completed",
  },
]

export const initialInventoryLogs: InventoryLog[] = [
  { id: "inv-1", itemId: "biryani", itemName: "Biryani", type: "sale_reduction", quantityChanged: -3, reason: "Sale KP-1008", userName: "Ali Cashier", createdAt: new Date().toISOString() },
  { id: "inv-2", itemId: "naan", itemName: "Naan", type: "sale_reduction", quantityChanged: -4, reason: "Sale KP-1007", userName: "Sana Counter", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "inv-3", itemId: "mutton-karahi", itemName: "Mutton Karahi", type: "stock_added", quantityChanged: 6, reason: "Morning preparation", userName: "Restaurant Owner", createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: "inv-4", itemId: "salad", itemName: "Salad", type: "waste", quantityChanged: -2, reason: "Spoiled garnish", userName: "Ali Cashier", createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString() },
]

export const initialAuditLogs: AuditLog[] = [
  { id: "audit-1", action: "Sale Created", userName: "Ali Cashier", detail: "Created invoice KP-1008", createdAt: new Date().toISOString() },
  { id: "audit-2", action: "Inventory Updated", userName: "System", detail: "Reduced Biryani stock by 3", createdAt: new Date().toISOString() },
  { id: "audit-3", action: "Login", userName: "Restaurant Owner", detail: "Owner viewed dashboard remotely", createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
]

export const revenueTrend = [
  { day: "Mon", revenue: 18500, orders: 38 },
  { day: "Tue", revenue: 21200, orders: 44 },
  { day: "Wed", revenue: 19600, orders: 41 },
  { day: "Thu", revenue: 23800, orders: 50 },
  { day: "Fri", revenue: 28600, orders: 61 },
  { day: "Sat", revenue: 34200, orders: 73 },
  { day: "Sun", revenue: 30900, orders: 67 },
]

export const monthlyRevenue = [
  { month: "Jan", revenue: 620000 },
  { month: "Feb", revenue: 670000 },
  { month: "Mar", revenue: 715000 },
  { month: "Apr", revenue: 690000 },
  { month: "May", revenue: 748000 },
  { month: "Jun", revenue: 802000 },
]
