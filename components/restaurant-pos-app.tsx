"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownToLine,
  Banknote,
  BarChart3,
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  MenuIcon,
  Minus,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  categories,
  initialAuditLogs,
  initialInventoryLogs,
  initialMenuItems,
  initialSales,
  monthlyRevenue,
  revenueTrend,
  users,
} from "@/lib/seed-data"
import type {
  AuditLog,
  InventoryLog,
  MenuItem,
  PaymentMethod,
  Role,
  Sale,
  SaleItem,
} from "@/lib/types"

type Screen =
  | "dashboard"
  | "pos"
  | "menu"
  | "inventory"
  | "transactions"
  | "reports"
  | "users"
  | "settings"

type CartLine = {
  item: MenuItem
  quantity: number
}

const currency = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
})

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

const paymentColors = ["#0f7b4c", "#f97316", "#2563eb", "#7c3aed"]

const paymentOptions: Array<{
  method: PaymentMethod
  icon: LucideIcon
  label: string
}> = [
    { method: "cash", icon: Banknote, label: "Cash" },
    { method: "card", icon: CreditCard, label: "Card" },
    { method: "bank_transfer", icon: Banknote, label: "Bank" },
    { method: "wallet", icon: WalletCards, label: "Wallet" },
  ]

const navItems: Array<{
  id: Screen
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  adminOnly?: boolean
}> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pos", label: "POS", icon: ShoppingCart },
    { id: "menu", label: "Menu", icon: ChefHat, adminOnly: true },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "transactions", label: "Transactions", icon: ReceiptText, adminOnly: true },
    { id: "reports", label: "Reports", icon: BarChart3, adminOnly: true },
    { id: "users", label: "Users", icon: Users, adminOnly: true },
    { id: "settings", label: "Settings", icon: Settings, adminOnly: true },
  ]

export function RestaurantPosApp() {
  const [loggedIn, setLoggedIn] = React.useState(false)
  const [role, setRole] = React.useState<Role>("admin")
  const [activeScreen, setActiveScreen] = React.useState<Screen>("dashboard")
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>(initialMenuItems)
  const [sales, setSales] = React.useState<Sale[]>(initialSales)
  const [inventoryLogs, setInventoryLogs] =
    React.useState<InventoryLog[]>(initialInventoryLogs)
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(initialAuditLogs)
  const [cart, setCart] = React.useState<CartLine[]>([])
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("cash")
  const [discount, setDiscount] = React.useState(0)
  const [tax, setTax] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const currentUser = role === "admin" ? users[0] : users[1]
  const isAdmin = role === "admin"

  const visibleNav = navItems.filter((item) => isAdmin || !item.adminOnly)
  const lowStock = menuItems.filter(
    (item) => item.currentStock <= item.minimumStock
  )
  const todayRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0)
  const todayOrders = sales.length
  const monthlyTotal = monthlyRevenue.at(-1)?.revenue ?? 0
  const weeklyTotal = revenueTrend.reduce((sum, item) => sum + item.revenue, 0)
  const paymentSummary = sales.reduce<Record<PaymentMethod, number>>(
    (summary, sale) => {
      summary[sale.paymentMethod] += sale.grandTotal
      return summary
    },
    { cash: 0, card: 0, bank_transfer: 0, wallet: 0 }
  )
  const paymentChart = Object.entries(paymentSummary).map(([method, value]) => ({
    method: method.replace("_", " "),
    value,
  }))
  const itemSales = buildItemSales(sales)
  const staffSales = users
    .filter((user) => user.role === "staff")
    .map((user) => {
      const userSales = sales.filter((sale) => sale.cashierId === user.id)
      return {
        ...user,
        orders: userSales.length,
        revenue: userSales.reduce((sum, sale) => sum + sale.grandTotal, 0),
      }
    })

  const cartSubtotal = cart.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  )
  const grandTotal = Math.max(cartSubtotal + tax - discount, 0)

  function selectRole(nextRole: Role) {
    setRole(nextRole)
    setActiveScreen(nextRole === "admin" ? "dashboard" : "pos")
  }

  function navigate(screen: Screen) {
    if (!isAdmin && navItems.find((item) => item.id === screen)?.adminOnly) {
      toast.error("Staff users do not have access to this screen.")
      return
    }
    setActiveScreen(screen)
    setMobileNavOpen(false)
  }

  function addToCart(item: MenuItem) {
    if (item.status === "unavailable" || item.currentStock <= 0) {
      toast.error(`${item.name} is unavailable.`)
      return
    }
    setCart((current) => {
      const existing = current.find((line) => line.item.id === item.id)
      if (existing) {
        return current.map((line) =>
          line.item.id === item.id
            ? {
              ...line,
              quantity: Math.min(line.quantity + 1, line.item.currentStock),
            }
            : line
        )
      }
      return [...current, { item, quantity: 1 }]
    })
  }

  function updateQuantity(itemId: string, quantity: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.item.id === itemId
            ? {
              ...line,
              quantity: Math.max(0, Math.min(quantity, line.item.currentStock)),
            }
            : line
        )
        .filter((line) => line.quantity > 0)
    )
  }

  function completeSale() {
    if (!cart.length) {
      toast.error("Add at least one item before completing a sale.")
      return
    }

    const invoiceNumber = `KP-${1000 + sales.length + 1}`
    const saleItems: SaleItem[] = cart.map((line) => ({
      itemId: line.item.id,
      name: line.item.name,
      quantity: line.quantity,
      unitPrice: line.item.price,
      lineTotal: line.item.price * line.quantity,
    }))
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      items: saleItems,
      subtotal: cartSubtotal,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      status: "completed",
      notes,
    }

    setSales((current) => [sale, ...current])
    setMenuItems((current) =>
      current.map((item) => {
        const sold = saleItems.find((line) => line.itemId === item.id)
        return sold
          ? { ...item, currentStock: item.currentStock - sold.quantity }
          : item
      })
    )
    setInventoryLogs((current) => [
      ...saleItems.map((line) => ({
        id: `inv-${Date.now()}-${line.itemId}`,
        itemId: line.itemId,
        itemName: line.name,
        type: "sale_reduction" as const,
        quantityChanged: -line.quantity,
        reason: `Sale ${invoiceNumber}`,
        userName: currentUser.name,
        createdAt: new Date().toISOString(),
      })),
      ...current,
    ])
    setAuditLogs((current) => [
      {
        id: `audit-${Date.now()}`,
        action: "Sale Created",
        userName: currentUser.name,
        detail: `Created invoice ${invoiceNumber}`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setCart([])
    setDiscount(0)
    setTax(0)
    setNotes("")
    toast.success(`Sale ${invoiceNumber} saved and inventory updated.`)
  }

  function adjustStock(item: MenuItem, quantity: number, reason: string) {
    if (!isAdmin) {
      toast.error("Only admin can adjust inventory.")
      return
    }
    setMenuItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, currentStock: Math.max(entry.currentStock + quantity, 0) }
          : entry
      )
    )
    setInventoryLogs((current) => [
      {
        id: `inv-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        type: quantity >= 0 ? "stock_added" : "manual_correction",
        quantityChanged: quantity,
        reason,
        userName: currentUser.name,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    toast.success(`${item.name} stock updated.`)
  }

  if (!loggedIn) {
    return (
      <LoginScreen
        role={role}
        onRoleChange={selectRole}
        onLogin={() => setLoggedIn(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 flex w-72 -translate-x-full flex-col border-r bg-sidebar p-4 transition-transform lg:static lg:translate-x-0",
            mobileNavOpen && "translate-x-0"
          )}
        >
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store />
            </div>
            <div>
              <p className="text-base font-semibold">Karahi POS</p>
              <p className="text-xs text-muted-foreground">
                Sales and inventory
              </p>
            </div>
          </div>
          <nav className="mt-5 flex flex-col gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeScreen === item.id ? "secondary" : "ghost"}
                  className="h-10 justify-start"
                  onClick={() => navigate(item.id)}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {currentUser.name}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {currentUser.role}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setLoggedIn(false)}>
              <LogOut data-icon="inline-start" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <MenuIcon />
            </Button>
            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                className="h-10 max-w-xl pl-9"
                placeholder="Search sales, items, invoices..."
              />
            </div>
            <Badge variant="secondary" className="ml-auto">
              <CalendarDays />
              Today
            </Badge>
            <Button
              variant="outline"
              onClick={() => selectRole(isAdmin ? "staff" : "admin")}
            >
              <ShieldCheck data-icon="inline-start" />
              {isAdmin ? "Admin" : "Staff"}
            </Button>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {activeScreen === "dashboard" && (
              <DashboardScreen
                isAdmin={isAdmin}
                todayRevenue={todayRevenue}
                todayOrders={todayOrders}
                weeklyTotal={weeklyTotal}
                monthlyTotal={monthlyTotal}
                lowStock={lowStock}
                sales={sales}
                itemSales={itemSales}
                staffSales={staffSales}
                paymentChart={paymentChart}
                onNavigate={navigate}
              />
            )}
            {activeScreen === "pos" && (
              <PosScreen
                menuItems={menuItems}
                cart={cart}
                categoryFilter={categoryFilter}
                searchQuery={searchQuery}
                paymentMethod={paymentMethod}
                cartSubtotal={cartSubtotal}
                discount={discount}
                tax={tax}
                grandTotal={grandTotal}
                notes={notes}
                onCategoryChange={setCategoryFilter}
                onSearchChange={setSearchQuery}
                onAddToCart={addToCart}
                onQuantityChange={updateQuantity}
                onPaymentMethodChange={setPaymentMethod}
                onDiscountChange={setDiscount}
                onTaxChange={setTax}
                onNotesChange={setNotes}
                onCancel={() => setCart([])}
                onComplete={completeSale}
              />
            )}
            {activeScreen === "menu" && (
              <MenuScreen items={menuItems} onItemsChange={setMenuItems} />
            )}
            {activeScreen === "inventory" && (
              <InventoryScreen
                items={menuItems}
                logs={inventoryLogs}
                isAdmin={isAdmin}
                onAdjustStock={adjustStock}
              />
            )}
            {activeScreen === "transactions" && (
              <TransactionsScreen sales={sales} />
            )}
            {activeScreen === "reports" && (
              <ReportsScreen
                sales={sales}
                itemSales={itemSales}
                staffSales={staffSales}
                lowStock={lowStock}
              />
            )}
            {activeScreen === "users" && (
              <UsersScreen staffSales={staffSales} auditLogs={auditLogs} />
            )}
            {activeScreen === "settings" && <SettingsScreen />}
          </div>
        </main>
      </div>
    </div>
  )
}

function LoginScreen({
  role,
  onRoleChange,
  onLogin,
}: {
  role: Role
  onRoleChange: (role: Role) => void
  onLogin: () => void
}) {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const [email, setEmail] = React.useState(
    role === "admin" ? "owner@karahipos.com" : "ali@karahipos.com"
  )
  const [password, setPassword] = React.useState("password123")
  const [isSigningIn, setIsSigningIn] = React.useState(false)

  React.useEffect(() => {
    setEmail(role === "admin" ? "owner@karahipos.com" : "ali@karahipos.com")
  }, [role])

  async function signInWithSupabase() {
    if (!hasSupabaseConfig) {
      toast.error("Add Supabase environment variables to use real login.")
      return
    }

    setIsSigningIn(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      toast.error(error?.message ?? "Unable to sign in.")
      setIsSigningIn(false)
      return
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profile?.role === "admin" || profile?.role === "staff") {
      onRoleChange(profile.role)
    }

    setIsSigningIn(false)
    onLogin()
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <ChefHat />
          </div>
          <div>
            <p className="text-lg font-semibold">Karahi POS</p>
            <p className="text-sm opacity-80">Remote restaurant control</p>
          </div>
        </div>
        <div className="max-w-xl">
          <h1 className="text-5xl font-semibold leading-tight">
            Know every sale, stock movement, and cashier action.
          </h1>
          <p className="mt-5 text-lg opacity-80">
            A practical POS and inventory system for small restaurants where the
            owner is not always on-site.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["15 menu items", "RLS security", "Vercel ready"].map((item) => (
            <div key={item} className="rounded-lg bg-primary-foreground/10 p-4">
              <p className="text-sm font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center p-5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Demo login uses role selection. Supabase Auth is wired in the
              project setup files.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={role === "admin" ? "default" : "outline"}
                className="h-12"
                onClick={() => onRoleChange("admin")}
              >
                <ShieldCheck data-icon="inline-start" />
                Admin
              </Button>
              <Button
                variant={role === "staff" ? "default" : "outline"}
                className="h-12"
                onClick={() => onRoleChange("staff")}
              >
                <Users data-icon="inline-start" />
                Staff
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="h-11 w-full" onClick={signInWithSupabase} disabled={isSigningIn}>
              Login
            </Button>
            {/* <Button className="h-11 w-full" variant="outline" onClick={onLogin}>
              Open demo as {role === "admin" ? "Admin" : "Staff"}
            </Button> */}
            <p className="text-center text-xs text-muted-foreground">
              {hasSupabaseConfig
                ? "Use a Supabase Auth user, or open the local demo."
                : "Supabase env vars are not set, so demo mode is available."}
            </p>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

function DashboardScreen({
  isAdmin,
  todayRevenue,
  todayOrders,
  weeklyTotal,
  monthlyTotal,
  lowStock,
  sales,
  itemSales,
  staffSales,
  paymentChart,
  onNavigate,
}: {
  isAdmin: boolean
  todayRevenue: number
  todayOrders: number
  weeklyTotal: number
  monthlyTotal: number
  lowStock: MenuItem[]
  sales: Sale[]
  itemSales: ReturnType<typeof buildItemSales>
  staffSales: Array<{ name: string; orders: number; revenue: number }>
  paymentChart: Array<{ method: string; value: number }>
  onNavigate: (screen: Screen) => void
}) {
  return (
    <>
      <ScreenHeading
        title={isAdmin ? "Owner dashboard" : "Today at counter"}
        description={
          isAdmin
            ? "Remote view of revenue, sales, inventory, and staff activity."
            : "Quick summary for today and access to the POS."
        }
        action={
          <Button onClick={() => onNavigate("pos")}>
            <ShoppingCart data-icon="inline-start" />
            Open POS
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Today's revenue" value={currency.format(todayRevenue)} detail="+12% vs yesterday" icon={Banknote} />
        <MetricCard title="Today's orders" value={String(todayOrders)} detail="Completed transactions" icon={ReceiptText} />
        <MetricCard title="Weekly revenue" value={currency.format(weeklyTotal)} detail="7 day gross sales" icon={Gauge} />
        <MetricCard title="Monthly revenue" value={currency.format(monthlyTotal)} detail="Current month" icon={BarChart3} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Revenue and order flow for this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <AreaChart data={revenueTrend} margin={{ left: 0, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" type="monotone" fill="var(--color-revenue)" fillOpacity={0.18} stroke="var(--color-revenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment mix</CardTitle>
            <CardDescription>Cash, card, bank transfer, and wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={paymentChart} dataKey="value" nameKey="method" innerRadius={58} outerRadius={90}>
                  {paymentChart.map((entry, index) => (
                    <Cell key={entry.method} fill={paymentColors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top selling items</CardTitle>
            <CardDescription>Best performers by quantity sold.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {itemSales.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} sold</p>
                </div>
                <Badge variant="secondary">{currency.format(item.revenue)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
            <CardDescription>Items that need attention before service rush.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lowStock.length ? (
              lowStock.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.name}</p>
                    <Badge variant="destructive">{item.currentStock} left</Badge>
                  </div>
                  <Progress value={(item.currentStock / item.minimumStock) * 100} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">All items are above minimum stock.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Staff performance</CardTitle>
            <CardDescription>Sales entered by cashier.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffSales.map((staff) => (
                  <TableRow key={staff.name}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell>{staff.orders}</TableCell>
                    <TableCell className="text-right">{currency.format(staff.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <RecentTransactions sales={sales} />
    </>
  )
}

function PosScreen(props: {
  menuItems: MenuItem[]
  cart: CartLine[]
  categoryFilter: string
  searchQuery: string
  paymentMethod: PaymentMethod
  cartSubtotal: number
  discount: number
  tax: number
  grandTotal: number
  notes: string
  onCategoryChange: (value: string) => void
  onSearchChange: (value: string) => void
  onAddToCart: (item: MenuItem) => void
  onQuantityChange: (itemId: string, quantity: number) => void
  onPaymentMethodChange: (method: PaymentMethod) => void
  onDiscountChange: (value: number) => void
  onTaxChange: (value: number) => void
  onNotesChange: (value: string) => void
  onCancel: () => void
  onComplete: () => void
}) {
  const filteredItems = props.menuItems.filter((item) => {
    const matchesCategory =
      props.categoryFilter === "all" || item.categoryId === props.categoryFilter
    const matchesSearch = item.name
      .toLowerCase()
      .includes(props.searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <ScreenHeading
        title="Staff POS"
        description="Touch-friendly sales entry with automatic inventory reduction."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Menu items</CardTitle>
                <CardDescription>Select items and quantities for the sale.</CardDescription>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={props.searchQuery}
                  onChange={(event) => props.onSearchChange(event.target.value)}
                  placeholder="Search menu..."
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={props.categoryFilter === "all" ? "default" : "outline"}
                onClick={() => props.onCategoryChange("all")}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={props.categoryFilter === category.id ? "default" : "outline"}
                  onClick={() => props.onCategoryChange(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="flex min-h-28 flex-col justify-between rounded-lg border bg-card p-4 text-left transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={item.status === "unavailable" || item.currentStock <= 0}
                  onClick={() => props.onAddToCart(item)}
                >
                  <span className="text-base font-semibold">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {currency.format(item.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Stock: {item.currentStock}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle>Current sale</CardTitle>
            <CardDescription>Review cart, payment, and totals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex max-h-80 flex-col gap-3 overflow-auto">
              {props.cart.length ? (
                props.cart.map((line) => (
                  <div key={line.item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{line.item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currency.format(line.item.price)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => props.onQuantityChange(line.item.id, 0)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            props.onQuantityChange(line.item.id, line.quantity - 1)
                          }
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {line.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            props.onQuantityChange(line.item.id, line.quantity + 1)
                          }
                        >
                          <Plus />
                        </Button>
                      </div>
                      <p className="font-semibold">
                        {currency.format(line.item.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Select menu items to start a sale.
                </div>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map(({ method, icon: Icon, label }) => (
                <Button
                  key={method}
                  variant={props.paymentMethod === method ? "default" : "outline"}
                  onClick={() => props.onPaymentMethodChange(method)}
                >
                  <Icon data-icon="inline-start" />
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                value={props.discount}
                onChange={(event) => props.onDiscountChange(Number(event.target.value))}
                placeholder="Discount"
              />
              <Input
                type="number"
                min={0}
                value={props.tax}
                onChange={(event) => props.onTaxChange(Number(event.target.value))}
                placeholder="Tax"
              />
            </div>
            <Textarea
              value={props.notes}
              onChange={(event) => props.onNotesChange(event.target.value)}
              placeholder="Notes"
            />
            <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
              <SummaryRow label="Subtotal" value={currency.format(props.cartSubtotal)} />
              <SummaryRow label="Discount" value={`-${currency.format(props.discount)}`} />
              <SummaryRow label="Tax" value={currency.format(props.tax)} />
              <Separator />
              <SummaryRow label="Grand total" value={currency.format(props.grandTotal)} strong />
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={props.onCancel}>
              Cancel
            </Button>
            <Button onClick={props.onComplete}>
              <ReceiptText data-icon="inline-start" />
              Complete
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

type MenuItemFormData = {
  name: string
  categoryId: string
  price: string
  costPrice: string
  currentStock: string
  minimumStock: string
  status: "available" | "unavailable"
}

const emptyForm: MenuItemFormData = {
  name: "",
  categoryId: "salan",
  price: "",
  costPrice: "",
  currentStock: "",
  minimumStock: "",
  status: "available",
}

function MenuScreen({
  items,
  onItemsChange,
}: {
  items: MenuItem[]
  onItemsChange: (items: MenuItem[]) => void
}) {
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null)
  const [isAdding, setIsAdding] = React.useState(false)
  const [form, setForm] = React.useState<MenuItemFormData>(emptyForm)

  function openAdd() {
    setForm(emptyForm)
    setEditingItem(null)
    setIsAdding(true)
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      costPrice: String(item.costPrice),
      currentStock: String(item.currentStock),
      minimumStock: String(item.minimumStock),
      status: item.status,
    })
    setEditingItem(item)
    setIsAdding(true)
  }

  function closeModal() {
    setIsAdding(false)
    setEditingItem(null)
  }

  function handleField<K extends keyof MenuItemFormData>(key: K, value: MenuItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const name = form.name.trim()
    if (!name) { toast.error("Item name is required."); return }
    const price = Number(form.price)
    const costPrice = Number(form.costPrice)
    const currentStock = Number(form.currentStock)
    const minimumStock = Number(form.minimumStock)
    if (isNaN(price) || price < 0) { toast.error("Enter a valid selling price."); return }
    if (isNaN(costPrice) || costPrice < 0) { toast.error("Enter a valid cost price."); return }
    if (isNaN(currentStock) || currentStock < 0) { toast.error("Enter a valid stock quantity."); return }
    if (isNaN(minimumStock) || minimumStock < 0) { toast.error("Enter a valid minimum stock."); return }

    if (editingItem) {
      onItemsChange(
        items.map((entry) =>
          entry.id === editingItem.id
            ? { ...entry, name, categoryId: form.categoryId, price, costPrice, currentStock, minimumStock, status: form.status }
            : entry
        )
      )
      toast.success(`${name} updated.`)
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name,
        categoryId: form.categoryId,
        price,
        costPrice,
        currentStock,
        minimumStock,
        status: form.status,
      }
      onItemsChange([...items, newItem])
      toast.success(`${name} added to menu.`)
    }
    closeModal()
  }

  function toggleStatus(item: MenuItem) {
    onItemsChange(
      items.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: entry.status === "available" ? "unavailable" : "available" }
          : entry
      )
    )
  }

  function deleteItem(item: MenuItem) {
    onItemsChange(items.filter((entry) => entry.id !== item.id))
    toast.success(`${item.name} removed from menu.`)
  }

  return (
    <>
      <ScreenHeading
        title="Menu management"
        description="Admin controls for pricing, availability, categories, and stock rules."
        action={
          <Button onClick={openAdd}>
            <Plus data-icon="inline-start" /> Add item
          </Button>
        }
      />

      {/* Add / Edit Modal */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{editingItem ? "Edit item" : "Add new item"}</h2>
                <p className="text-sm text-muted-foreground">
                  {editingItem ? `Editing ${editingItem.name}` : "Fill in the details for the new menu item."}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                ✕
              </Button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Item name</label>
                <Input
                  placeholder="e.g. Chicken Karahi"
                  value={form.name}
                  onChange={(e) => handleField("name", e.target.value)}
                />
              </div>
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      size="sm"
                      variant={form.categoryId === cat.id ? "default" : "outline"}
                      onClick={() => handleField("categoryId", cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Selling price (PKR)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 1200"
                    value={form.price}
                    onChange={(e) => handleField("price", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Cost price (PKR)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 760"
                    value={form.costPrice}
                    onChange={(e) => handleField("costPrice", e.target.value)}
                  />
                </div>
              </div>
              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Current stock</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 20"
                    value={form.currentStock}
                    onChange={(e) => handleField("currentStock", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Minimum stock alert</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 5"
                    value={form.minimumStock}
                    onChange={(e) => handleField("minimumStock", e.target.value)}
                  />
                </div>
              </div>
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={form.status === "available" ? "default" : "outline"}
                    onClick={() => handleField("status", "available")}
                  >
                    Available
                  </Button>
                  <Button
                    size="sm"
                    variant={form.status === "unavailable" ? "destructive" : "outline"}
                    onClick={() => handleField("status", "unavailable")}
                  >
                    Unavailable
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave}>{editingItem ? "Save changes" : "Add item"}</Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{categoryName(item.categoryId)}</TableCell>
                  <TableCell>{currency.format(item.price)}</TableCell>
                  <TableCell>{currency.format(item.costPrice)}</TableCell>
                  <TableCell>
                    <span className={item.currentStock <= item.minimumStock ? "font-semibold text-destructive" : ""}>
                      {item.currentStock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "available" ? "secondary" : "destructive"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(item)}>
                        {item.status === "available" ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteItem(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}


function InventoryScreen({
  items,
  logs,
  isAdmin,
  onAdjustStock,
}: {
  items: MenuItem[]
  logs: InventoryLog[]
  isAdmin: boolean
  onAdjustStock: (item: MenuItem, quantity: number, reason: string) => void
}) {
  return (
    <>
      <ScreenHeading
        title="Inventory"
        description="Simple item-based inventory with low-stock thresholds and activity logs."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Stock levels</CardTitle>
            <CardDescription>Current stock compared with minimum alert level.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {items.map((item) => {
              const ratio = Math.min((item.currentStock / item.minimumStock) * 100, 100)
              return (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Minimum: {item.minimumStock}
                      </p>
                    </div>
                    <Badge variant={item.currentStock <= item.minimumStock ? "destructive" : "secondary"}>
                      {item.currentStock}
                    </Badge>
                  </div>
                  <Progress className="mt-4" value={ratio} />
                  {isAdmin && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onAdjustStock(item, 5, "Stock added")}>
                        <Plus data-icon="inline-start" />
                        Add 5
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onAdjustStock(item, -1, "Manual correction")}>
                        <Minus data-icon="inline-start" />
                        Correct
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory logs</CardTitle>
            <CardDescription>Added, reduced, correction, and waste records.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{log.itemName}</p>
                  <Badge variant={log.quantityChanged < 0 ? "destructive" : "secondary"}>
                    {log.quantityChanged > 0 ? "+" : ""}
                    {log.quantityChanged}
                  </Badge>
                </div>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {log.type.replace("_", " ")} by {log.userName}
                </p>
                <p className="text-xs text-muted-foreground">{log.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function TransactionsScreen({ sales }: { sales: Sale[] }) {
  return (
    <>
      <ScreenHeading
        title="Transactions"
        description="All completed sales with item details, totals, and cashier traceability."
        action={
          <a className={buttonVariants()} href="/api/reports/sales">
            <ArrowDownToLine data-icon="inline-start" />
            Export CSV
          </a>
        }
      />
      <RecentTransactions sales={sales} expanded />
    </>
  )
}

function ReportsScreen({
  sales,
  itemSales,
  staffSales,
  lowStock,
}: {
  sales: Sale[]
  itemSales: ReturnType<typeof buildItemSales>
  staffSales: Array<{ name: string; revenue: number; orders: number }>
  lowStock: MenuItem[]
}) {
  return (
    <>
      <ScreenHeading
        title="Reports"
        description="Daily, weekly, monthly, item-wise, staff-wise, low-stock, and revenue reports."
        action={
          <a className={buttonVariants()} href="/api/reports/sales">
            <ArrowDownToLine data-icon="inline-start" />
            Export CSV
          </a>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard title="Daily sales" value={currency.format(sales.reduce((sum, sale) => sum + sale.grandTotal, 0))} detail={`${sales.length} transactions`} icon={CalendarDays} />
        <MetricCard title="Item-wise units" value={String(itemSales.reduce((sum, item) => sum + item.quantity, 0))} detail="Total items sold" icon={ClipboardList} />
        <MetricCard title="Low-stock items" value={String(lowStock.length)} detail="Below minimum threshold" icon={Boxes} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>Owner view of gross revenue trend.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Staff-wise sales</CardTitle>
            <CardDescription>Cashier performance summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffSales.map((staff) => (
                  <TableRow key={staff.name}>
                    <TableCell>{staff.name}</TableCell>
                    <TableCell>{staff.orders}</TableCell>
                    <TableCell className="text-right">{currency.format(staff.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function UsersScreen({
  staffSales,
  auditLogs,
}: {
  staffSales: Array<{ id: string; name: string; email: string; role: Role; status: string; lastLogin: string; orders: number; revenue: number }>
  auditLogs: AuditLog[]
}) {
  return (
    <>
      <ScreenHeading
        title="User management"
        description="Create, disable, and review activity for staff accounts."
        action={<Button><Plus data-icon="inline-start" /> Add staff</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Staff users</CardTitle>
            <CardDescription>Admin-only access for user management.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[users[0], ...staffSales].map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>{"orders" in user ? user.orders : "-"}</TableCell>
                    <TableCell><Badge variant="secondary">{user.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>Important owner and staff actions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {log.userName} - {log.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function SettingsScreen() {
  return (
    <>
      <ScreenHeading
        title="Settings"
        description="Business settings prepared for Supabase-backed production use."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant profile</CardTitle>
            <CardDescription>Receipt and report defaults.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input defaultValue="Karahi POS Restaurant" />
            <Input defaultValue="Main Bazaar, Lahore" />
            <Input defaultValue="+92 300 0000000" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Security checklist</CardTitle>
            <CardDescription>Production requirements included in this project.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Supabase Auth clients",
              "Role-based app shell",
              "RLS SQL policies",
              "Audit log table",
              "Vercel environment guide",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{item}</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function ScreenHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function RecentTransactions({
  sales,
  expanded = false,
}: {
  sales: Sale[]
  expanded?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Invoices, cashiers, payment methods, and totals.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.slice(0, expanded ? sales.length : 5).map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                <TableCell>{sale.cashierName}</TableCell>
                <TableCell>{sale.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</TableCell>
                <TableCell className="capitalize">{sale.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell><Badge variant="secondary">{sale.status}</Badge></TableCell>
                <TableCell className="text-right">{currency.format(sale.grandTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className={cn("flex items-center justify-between text-sm", strong && "text-base font-semibold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function categoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId
}

function buildItemSales(sales: Sale[]) {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>()

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = map.get(item.name) ?? {
        name: item.name,
        quantity: 0,
        revenue: 0,
      }
      existing.quantity += item.quantity
      existing.revenue += item.lineTotal
      map.set(item.name, existing)
    })
  })

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity)
}
