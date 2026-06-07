'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, CartItem } from '@/lib/store'
import { toast } from 'sonner'
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  IndianRupee,
  Truck,
  MapPin,
  CreditCard,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { MapPicker } from '@/components/agrilink/map-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Constants ────────────────────────────────────────────────────────────────
const TRANSPORT_RATE_MIN = 0.02 // 2%
const TRANSPORT_RATE_MAX = 0.05 // 5%
const GST_RATE = 0.18 // 18%

// ─── Checkout Dialog ──────────────────────────────────────────────────────────
function CheckoutDialog({
  open,
  onClose,
  cart,
  subtotal,
  transportCost,
  gstAmount,
  totalBill,
}: {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  subtotal: number
  transportCost: number
  gstAmount: number
  totalBill: number
}) {
  const { user, clearCart, setCartOpen } = useAppStore()
  const [placing, setPlacing] = useState(false)
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [deliveryLat, setDeliveryLat] = useState('')
  const [deliveryLng, setDeliveryLng] = useState('')
  const [mapAddress, setMapAddress] = useState('')

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order')
      return
    }
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all required address fields')
      return
    }

    setPlacing(true)
    try {
      // Create an order for each cart item
      const results = await Promise.allSettled(
        cart.map((item) =>
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyerId: user.id,
              sellerId: item.sellerId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.pricePerUnit,
              deliveryAddress: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
              deliveryCity: address.city,
              deliveryState: address.state,
              deliveryPincode: address.pincode,
              deliveryLat: deliveryLat || undefined,
              deliveryLng: deliveryLng || undefined,
              deliveryFullAddress: mapAddress || undefined,
            }),
          })
        )
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (succeeded > 0) {
        toast.success(`Order${succeeded > 1 ? 's' : ''} placed for ${succeeded} item${succeeded > 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`)
        clearCart()
        setCartOpen(false)
        onClose()
      } else {
        toast.error('Failed to place orders. Please try again.')
      }
    } catch {
      toast.error('Failed to place orders')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[oklch(0.15_0.012_260/0.97)] border-white/20 backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Checkout
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete your order by providing delivery details
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Delivery Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Delivery Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full Name *</Label>
                <Input
                  value={address.fullName}
                  onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone *</Label>
                <Input
                  value={address.phone}
                  onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Address Line 1 *</Label>
                <Input
                  value={address.addressLine1}
                  onChange={(e) => setAddress((a) => ({ ...a, addressLine1: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="House/Flat No., Street Name"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Address Line 2</Label>
                <Input
                  value={address.addressLine2}
                  onChange={(e) => setAddress((a) => ({ ...a, addressLine2: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="Landmark, Area (optional)"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">City *</Label>
                <Input
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">State *</Label>
                <Input
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pincode *</Label>
                <Input
                  value={address.pincode}
                  onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                  className="h-9 bg-white/5 border-white/10 text-sm"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>

            {/* Map Picker */}
            <MapPicker
              latitude={deliveryLat}
              longitude={deliveryLng}
              address={mapAddress}
              onLocationSelect={(data) => {
                setDeliveryLat(data.latitude)
                setDeliveryLng(data.longitude)
                setMapAddress(data.address)
                // Auto-fill address fields from map selection
                setAddress((a) => ({
                  ...a,
                  addressLine1: data.address.split(',').slice(0, 2).join(', ') || a.addressLine1,
                  // Try to extract city and state from the address
                  city: data.address.split(',').find((_, i, arr) => i === arr.length - 3)?.trim() || a.city,
                  state: data.address.split(',').find((_, i, arr) => i === arr.length - 2)?.trim() || a.state,
                }))
              }}
              label="Delivery Location"
              markerColor="#ef4444"
              height="220px"
            />
          </div>

          <Separator className="bg-white/5" />

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Order Summary
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 glass-card p-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} × ₹{item.pricePerUnit.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    ₹{(item.quantity * item.pricePerUnit).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Bill Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Est. Transport
              </span>
              <span className="text-foreground">₹{transportCost.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 -mt-1 ml-5">
              Estimated at {(TRANSPORT_RATE_MIN * 100).toFixed(0)}–{(TRANSPORT_RATE_MAX * 100).toFixed(0)}% of subtotal
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="text-foreground">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <Separator className="bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-xl font-bold text-emerald-400">₹{totalBill.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button
            className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Place Order · ₹{totalBill.toLocaleString('en-IN')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Cart Panel ──────────────────────────────────────────────────────────
export function CartPanel() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateCartQty, clearCart, user } = useAppStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0)
  const transportRate = TRANSPORT_RATE_MIN + (TRANSPORT_RATE_MAX - TRANSPORT_RATE_MIN) / 2 // Use midpoint
  const transportCost = Math.round(subtotal * transportRate)
  const gstAmount = Math.round((subtotal + transportCost) * GST_RATE)
  const totalBill = subtotal + transportCost + gstAmount

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleClose = useCallback(() => {
    setCartOpen(false)
  }, [setCartOpen])

  return (
    <>
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleClose}
            />

            {/* Cart Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-background/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden"
              style={{
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3), 0 0 80px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-semibold text-foreground">Your Cart</h3>
                  {cartItemCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={clearCart}
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="size-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">Cart is empty</p>
                      <p className="text-sm text-muted-foreground">Add products from the marketplace to get started</p>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 border-white/10 hover:bg-white/5 hover:border-white/20"
                      onClick={handleClose}
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="glass-card p-3 space-y-2"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">{item.productName}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.sellerName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <IndianRupee className="w-3 h-3 text-emerald-400" />
                            <span className="text-sm font-bold text-foreground">{item.pricePerUnit.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-muted-foreground">/ {item.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-l-lg rounded-r-none border-white/10 hover:bg-white/10 p-0"
                            onClick={() => updateCartQty(item.productId, Math.max(item.minOrderQty || 1, item.quantity - 1))}
                            disabled={item.quantity <= (item.minOrderQty || 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <div className="h-8 w-12 flex items-center justify-center border-y border-white/10 bg-white/5 text-sm font-semibold text-foreground">
                            {item.quantity}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-r-lg rounded-l-none border-white/10 hover:bg-white/10 p-0"
                            onClick={() => updateCartQty(item.productId, Math.min(item.maxQuantity, item.quantity + 1))}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground ml-2">{item.unit}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Line Total</p>
                          <p className="text-sm font-bold text-emerald-400">
                            ₹{(item.quantity * item.pricePerUnit).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Cart Footer / Bill */}
              {cart.length > 0 && (
                <div className="border-t border-white/10 p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                  {/* Bill Breakdown */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Est. Transport
                      </span>
                      <span className="text-foreground font-medium">₹{transportCost.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 -mt-0.5">
                      Estimated at {(TRANSPORT_RATE_MIN * 100).toFixed(0)}–{(TRANSPORT_RATE_MAX * 100).toFixed(0)}% of subtotal
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span className="text-foreground font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-base font-bold text-foreground">Total Bill</span>
                      <span className="text-xl font-bold text-emerald-400">₹{totalBill.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                    onClick={() => {
                      if (!user) {
                        toast.error('Please sign in to checkout')
                        return
                      }
                      setCheckoutOpen(true)
                    }}
                  >
                    Proceed to Checkout
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        transportCost={transportCost}
        gstAmount={gstAmount}
        totalBill={totalBill}
      />
    </>
  )
}
