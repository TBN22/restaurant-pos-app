export type Role = "admin" | "staff"

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "wallet"

export type ItemStatus = "available" | "unavailable"

export type InventoryLogType =
  | "stock_added"
  | "sale_reduction"
  | "manual_correction"
  | "waste"

export type MenuCategory = {
  id: string
  name: string
  description: string
}

export type MenuItem = {
  id: string
  name: string
  categoryId: string
  price: number
  costPrice: number
  currentStock: number
  minimumStock: number
  status: ItemStatus
}

export type StaffUser = {
  id: string
  name: string
  email: string
  role: Role
  status: "active" | "disabled"
  lastLogin: string
}

export type SaleItem = {
  itemId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type Sale = {
  id: string
  invoiceNumber: string
  createdAt: string
  cashierId: string
  cashierName: string
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  grandTotal: number
  paymentMethod: PaymentMethod
  status: "completed" | "void"
  notes?: string
}

export type InventoryLog = {
  id: string
  itemId: string
  itemName: string
  type: InventoryLogType
  quantityChanged: number
  reason: string
  userName: string
  createdAt: string
}

export type AuditLog = {
  id: string
  action: string
  userName: string
  detail: string
  createdAt: string
}
