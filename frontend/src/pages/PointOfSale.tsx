        import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  RiAddLine, RiSubtractLine, RiDeleteBinLine, RiShoppingCartLine, RiPrinterLine, 
  RiCloseLine, RiSearchLine, RiKeyboardLine, RiEraserLine, RiArrowGoBackLine,
  RiPercentLine, RiMoneyDollarCircleLine, RiBankCardLine, RiPhoneLine,
  RiRefreshLine, RiCheckLine, RiErrorWarningLine, RiInformationLine,
  RiArrowUpSLine, RiArrowDownSLine, RiDeleteRow, RiUserLine
} from 'react-icons/ri'
import { productAPI, salesAPI, terminalAPI, Terminal, customerAPI, Customer } from '../services/api'
import toast from 'react-hot-toast'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { SaleReceipt } from '../components/SaleReceipt'
import { Dialog } from '@headlessui/react'
import { useBusiness } from '../contexts/BusinessContext'
import { useAuth } from '../contexts/AuthContext'

// Add this after your imports
const generateReceiptNumber = () => {
  return `INV-${Date.now().toString().slice(-6)}`
}

const formatCurrency = (amount: number) => {
  return `Ksh ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Add receipt template styles at the top of your component
const receiptStyles = `
  @page { size: 80mm 297mm; margin: 0; }
  @media print {
    body { margin: 0; padding: 0; }
  }
`

interface Product {
  id: number
  name: string
  sku: string
  unit_price: number
  quantity: number
  category_name?: string
  supplier_name?: string
}

interface SaleItem {
  product_id: number
  quantity: number
  unit_price: number
}

interface Sale {
  items: SaleItem[]
  total_amount: number
  payment_method: 'cash' | 'mpesa' | 'equity' | 'credit' | 'card' | 'mobile'
}

interface CartItem {
  product: Product;
  quantity: number;
  discountedPrice?: number;  // Optional discounted price
}

export const PointOfSale = () => {
  const { businessSettings } = useBusiness()
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cartSearchTerm, setCartSearchTerm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash')
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [lastSaleData, setLastSaleData] = useState<{
    items: Array<{ product: Product; quantity: number }>;
    totalAmount: number;
    paymentMethod: string;
    transactionDate: string;
    receiptNumber: string;
    cashierName?: string;
    customerName?: string;
    businessSettings?: any;
  } | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [currentSale, setCurrentSale] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // New UX improvements state
  const [deletedItem, setDeletedItem] = useState<CartItem | null>(null)
  const [deletedItemTimer, setDeletedItemTimer] = useState<NodeJS.Timeout | null>(null)
  const [discountMode, setDiscountMode] = useState<{ productId: number | null; type: 'percent' | 'fixed' | null }>({ productId: null, type: null })
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState<{ name: string; email?: string; phone?: string; address?: string }>({ name: '' })

  // Fetch customers
  useEffect(() => {
    customerAPI.getAll().then(setCustomers)
  }, [])

  // Filtered customers for search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  )

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name) {
      toast.error('Customer name is required')
      return
    }
    try {
      const created = await customerAPI.create(newCustomer)
      setCustomers(prev => [...prev, created])
      setSelectedCustomer(created)
      setIsCustomerModalOpen(false)
      setNewCustomer({ name: '' })
      toast.success('Customer added!')
    } catch (e) {
      toast.error('Failed to add customer')
    }
  }
  const [payments, setPayments] = useState<Array<{ payment_method: 'cash' | 'mpesa' | 'equity' | 'credit' | 'card' | 'mobile', amount: number }>>([])
  const [paymentInput, setPaymentInput] = useState<string>('')
  const [activePaymentMethod, setActivePaymentMethod] = useState<'cash' | 'mpesa' | 'equity' | 'credit' | 'card' | 'mobile'>('cash')
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedTerminalId')
    return saved ? parseInt(saved) : null
  })
  const queryClient = useQueryClient()
  const receiptContainerRef = useRef<HTMLDivElement>(null)

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: productAPI.getAll
  })

  // Fetch active terminals
  const { data: terminals = [] } = useQuery<Terminal[]>({
    queryKey: ['terminals', { active_only: true }],
    queryFn: () => terminalAPI.getAll({ active_only: true })
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to checkout
      if (e.key === 'F2') {
        e.preventDefault()
        handleCheckout()
      }
      // F4 to search
      if (e.key === 'F4') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement
        searchInput?.focus()
      }
      // Escape to close confirmation
      if (e.key === 'Escape' && isConfirmationOpen) {
        setIsConfirmationOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, isConfirmationOpen, paymentMethod, currentSale]) // Dependencies for handleCheckout

  // Save terminal preference
  useEffect(() => {
    if (selectedTerminalId) {
      localStorage.setItem('selectedTerminalId', selectedTerminalId.toString())
    }
  }, [selectedTerminalId])

  // Auto-select terminal if not set
  useEffect(() => {
    if (!selectedTerminalId && terminals.length > 1) {
      // If multiple, maybe we still want to choose, but for "automatic" we can pick first
      setSelectedTerminalId(terminals[0].id)
    } else if (terminals.length === 1) {
      setSelectedTerminalId(terminals[0].id)
    }
  }, [terminals, selectedTerminalId])

  // Add to cart with stock validation
  const addToCart = (product: Product) => {
    // Check if product is out of stock
    if (product.quantity <= 0) {
      toast.error('Product is out of stock')
      return
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      
      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= product.quantity) {
          toast.error(`Only ${product.quantity} units available in stock`)
          return prevCart // Return unchanged cart
        }
        
        const updatedCart = prevCart.map(item =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        return updatedCart
      }
      
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  // Update cart item quantity
  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // Update cart item price (discount/override)
  const updateCartItemPrice = (productId: number, newPrice: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, discountedPrice: newPrice }
          : item
      )
    )
  }

  // Simple remove from cart with undo functionality
  const removeFromCart = (productId: number) => {
    const itemToRemove = cart.find(item => item.product.id === productId)
    if (itemToRemove) {
      setDeletedItem(itemToRemove)
      // Clear any existing timer
      if (deletedItemTimer) {
        clearTimeout(deletedItemTimer)
      }
      // Set new timer for undo
      const timer = setTimeout(() => {
        setDeletedItem(null)
      }, 5000)
      setDeletedItemTimer(timer)
    }
    setCart(prevCart => 
      prevCart.filter(item => item.product.id !== productId)
    )
    toast.error('Item removed', { icon: '🗑️' })
  }

  // Undo function to restore deleted item
  const undoRemove = () => {
    if (deletedItem) {
      setCart(prevCart => [...prevCart, deletedItem])
      setDeletedItem(null)
      if (deletedItemTimer) {
        clearTimeout(deletedItemTimer)
        setDeletedItemTimer(null)
      }
      toast.success('Item restored!')
    }
  }

  // Apply percentage discount
  const applyDiscount = (productId: number, percent: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.product.id === productId) {
          const discountAmount = item.product.unit_price * (percent / 100)
          return { ...item, discountedPrice: Number((item.product.unit_price - discountAmount).toFixed(2)) }
        }
        return item
      })
    )
    toast.success(`Applied ${percent}% discount`)
    setDiscountMode({ productId: null, type: null })
  }

  // Apply fixed discount
  const applyFixedDiscount = (productId: number, amount: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.product.id === productId) {
          const newPrice = Math.max(0.01, item.product.unit_price - amount)
          return { ...item, discountedPrice: Number(newPrice.toFixed(2)) }
        }
        return item
      })
    )
    toast.success(`Discount applied`)
    setDiscountMode({ productId: null, type: null })
  }

  // Increment quantity
  const incrementQuantity = (productId: number, maxStock: number) => {
    const item = cart.find(i => i.product.id === productId)
    if (item && item.quantity < maxStock) {
      updateCartItemQuantity(productId, item.quantity + 1)
    } else if (item && item.quantity >= maxStock) {
      toast.error(`Only ${maxStock} units available in stock`)
    }
  }

  // Decrement quantity
  const decrementQuantity = (productId: number) => {
    const item = cart.find(i => i.product.id === productId)
    if (item && item.quantity > 1) {
      updateCartItemQuantity(productId, item.quantity - 1)
    }
  }

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Are you sure you want to clear the cart?')) {
      setCart([])
      toast.success('Cart cleared')
    }
  }

  const handlePrint = (receiptData: any) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not create print document');
      }

      const formattedItems = receiptData.items.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          unit_price: Number(item.product.unit_price)
        }
      }));

      const total = Number(receiptData.totalAmount);
      const currency = businessSettings?.currency || 'KSH';

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sales Receipt</title>
            <style>
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 10mm;
                color: #000;
                line-height: 1.5;
              }
              .receipt {
                width: 75mm;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 5mm;
                border-bottom: 1px dashed #000;
                padding-bottom: 3mm;
              }
              .header h2 {
                margin: 0;
                font-size: 14pt;
              }
              .header p {
                margin: 1mm 0;
                font-size: 8pt;
              }
              .items {
                width: 100%;
                border-collapse: collapse;
                margin: 3mm 0;
                font-size: 9pt;
              }
              .items th {
                border-bottom: 1px solid #000;
                padding: 2mm 1mm;
                text-align: left;
              }
              .items td {
                padding: 2mm 1mm;
                border-bottom: 1px dotted #ccc;
              }
              .items .qty {
                text-align: center;
                width: 15mm;
              }
              .items .price {
                text-align: right;
                width: 20mm;
              }
              .items .total {
                text-align: right;
                width: 25mm;
              }
              .totals {
                margin-top: 3mm;
                text-align: right;
                font-size: 9pt;
                border-top: 1px solid #000;
                padding-top: 3mm;
              }
              .totals p {
                margin: 1mm 0;
                display: flex;
                justify-content: space-between;
              }
              .grand-total {
                font-weight: bold;
                font-size: 11pt;
                border-top: 1px dashed #000;
                padding-top: 2mm;
                margin-top: 2mm;
              }
              .footer {
                margin-top: 5mm;
                text-align: center;
                font-size: 8pt;
                border-top: 1px dashed #000;
                padding-top: 3mm;
              }
              @media print {
                body { 
                  width: 80mm;
                  margin: 0;
                  padding: 5mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>${businessSettings?.business_name || 'SALES RECEIPT'}</h2>
                ${businessSettings?.address ? `<p>${businessSettings.address}</p>` : ''}
                ${businessSettings?.phone ? `<p>Tel: ${businessSettings.phone}</p>` : ''}
                ${businessSettings?.email ? `<p>Email: ${businessSettings.email}</p>` : ''}
                ${businessSettings?.tax_id ? `<p>Tax ID: ${businessSettings.tax_id}</p>` : ''}
                <div style="margin-top: 3mm; padding-top: 3mm; border-top: 1px dotted #000;">
                  <p>Receipt #: ${receiptData.receiptNumber}</p>
                  <p>Date: ${receiptData.date}</p>
                  <p>Payment: ${receiptData.paymentMethod.toUpperCase()}</p>
                  ${receiptData.customer_name ? `<p>Customer: ${receiptData.customer_name}</p>` : ''}
                </div>
              </div>
              
              <table class="items">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="qty">Qty</th>
                    <th class="price">Price</th>
                    <th class="total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${formattedItems.map((item: any) => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td class="qty">${item.quantity}</td>
                      <td class="price">${Number(item.discountedPrice || item.product.unit_price || 0).toFixed(2)}</td>
                      <td class="total">${(item.quantity * Number(item.discountedPrice || item.product.unit_price || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="totals">
                <p class="grand-total">
                  <span>TOTAL (${currency})</span>
                  <span>${total.toFixed(2)}</span>
                </p>
              </div>
              
              <div class="footer">
                <p>Served by: ${receiptData.cashier_name || 'Cashier'}</p>
                <p>Thank you for your business!</p>
                <p style="margin-top: 3mm; font-weight: bold;">POS designed by EL-Technologies</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      doc.close();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const totalAmount = cartTotal
    // Start with no payments by default
    setPayments([])
    setPaymentInput(totalAmount.toString())
    setActivePaymentMethod('cash')

    const saleData = {
      items: cart,
      totalAmount,
      receiptNumber: generateReceiptNumber(),
      date: new Date().toLocaleString()
    }

    setCurrentSale(saleData)
    setIsConfirmationOpen(true)
  }

  const confirmSale = async () => {
    if (isProcessing) return;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const hasCredit = payments.some(p => p.payment_method === 'credit')
    const fullyPaid = totalPaid >= currentSale.totalAmount
    
    // Credit sales require a customer
    if (hasCredit && !fullyPaid && !selectedCustomer) {
      toast.error('Select a customer for credit sale!')
      return
    }
    
    if (totalPaid <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }
    
    // If credit is present, set its amount to the unpaid balance
    let adjustedPayments = [...payments]
    let customerId = selectedCustomer?.id || null
    
    if (!fullyPaid && hasCredit) {
      const paidWithoutCredit = payments.filter(p => p.payment_method !== 'credit').reduce((sum, p) => sum + p.amount, 0)
      const unpaid = currentSale.totalAmount - paidWithoutCredit
      adjustedPayments = payments.map(p =>
        p.payment_method === 'credit' ? { ...p, amount: unpaid } : p
      )
    }
    
    setIsProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.discountedPrice || item.product.unit_price
        })),
        total_amount: currentSale.totalAmount,
        payments: adjustedPayments,
        terminal: selectedTerminalId,
        customer: customerId
      }
      const response = await salesAPI.create(saleData as any)
      const completedSale = response.data
      
      // Create receipt data with customer name
      const customerName = selectedCustomer?.name || undefined
      // Get cashier's full name or fallback to username
      const cashierName = user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}`.trim()
        : user?.first_name || user?.last_name || user?.username || 'Cashier'
      
      const receiptData = {
        id: completedSale.id,
        items: cart,
        total_amount: currentSale.totalAmount,
        amount_paid: completedSale.amount_paid,
        balance_due: completedSale.balance_due,
        payment_method: payments.map(p => p.payment_method).join(', '),
        payments: completedSale.payments,
        receipt_number: currentSale.receiptNumber,
        customer_name: customerName,
        cashier_name: cashierName,
        created_at: completedSale.created_at,
        businessSettings
      }
      salesAPI.printReceipt(receiptData as any)
      
      if (completedSale.status === 'paid') {
        toast.success('Sale completed!')
      } else if (completedSale.status === 'partial') {
        toast.success('Partial sale recorded!')
      } else {
        toast.success('Sale recorded!')
      }
      
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setCart([])
      setSelectedCustomer(null)
      setCustomerSearch('')
      setIsConfirmationOpen(false)
      setLastSaleData({
        items: cart,
        totalAmount: currentSale.totalAmount,
        paymentMethod: receiptData.payment_method,
        transactionDate: completedSale.created_at,
        receiptNumber: currentSale.receiptNumber,
        cashierName: cashierName,
        customerName: customerName,
        businessSettings
      })
      setIsPdfReady(true)
    } catch (error) {
      toast.error('Failed to process sale')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto download receipt when PDF is ready and last sale data is available
  useEffect(() => {
    if (isPdfReady && lastSaleData) {
      const timer = setTimeout(() => {
        setIsPdfReady(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isPdfReady, lastSaleData])

  const PdfDownload = React.memo(({ lastSaleData }: { lastSaleData: any }) => {
    const linkRef = useRef<HTMLAnchorElement>(null)

    useEffect(() => {
      if (linkRef.current) {
        linkRef.current.click()
      }
    }, [])

    return (
      <PDFDownloadLink
        document={<SaleReceipt {...lastSaleData} />}
        fileName={`Receipt-${lastSaleData.receiptNumber}.pdf`}
        className="hidden"
      >
        {({ url, loading, error }) => (
          <a href={url} download ref={linkRef}>
            Download Receipt
          </a>
        )}
      </PDFDownloadLink>
    )
  })

  const cartTotal = cart.reduce((sum, item) => 
    sum + (Number(item.discountedPrice || item.product.unit_price || 0) * item.quantity), 0
  );
  const cartVat = cartTotal * (16 / 116); // Extract VAT from total
  const cartSubtotal = cartTotal - cartVat;

  return (
    <>
        {isPdfReady && lastSaleData && <PdfDownload lastSaleData={lastSaleData} />}
    <div className="flex h-screen bg-gradient-to-br from-[#151b29] to-[#1f2b3e]">
      {/* Products List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex justify-between items-end">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">Point of Sale</h1>
            
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products... (F4)"
                className="w-full bg-[#2a3346]/80 text-white placeholder-gray-400 rounded-xl px-4 py-3 pl-10 border border-[#31394d]/70 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
              />
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <div className="ml-4 flex items-center space-x-3 mb-1">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">Logged in as</span>
              <span className="text-sm font-bold text-orange-400">{user?.username || 'Cashier'}</span>
              {selectedTerminalId && (
                <span className="text-[10px] text-gray-500">
                  Terminal: {terminals.find(t => t.id === selectedTerminalId)?.name || 'Auto'}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-gray-400 text-xs bg-[#2a3346]/50 px-3 py-2 rounded-lg border border-[#31394d]/30 h-10">
              <RiKeyboardLine size={14} className="mr-1" />
              <span>F2: Checkout | F4: Search</span>
            </div>
          </div>
        </div>

        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(product => (
                <div
                  key={product.id}
                  className="bg-gradient-to-br from-[#2a3346] to-[#2c3649] rounded-xl shadow-lg p-5 border border-[#31394d]/70 hover:shadow-2xl hover:border-orange-500/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] group"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white group-hover:text-orange-300 transition-colors">{product.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${product.quantity > 10 ? 'bg-green-500/20 text-green-300' : product.quantity > 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                      Stock: {product.quantity}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-400 text-sm mb-3 space-x-2">
                    <span className="px-2 py-1 rounded-md bg-[#343d52]/50">{product.sku}</span>
                    {product.category_name && (
                      <span className="px-2 py-1 rounded-md bg-[#343d52]/50">{product.category_name}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 text-transparent bg-clip-text">
                      Ksh {Number(product.unit_price).toLocaleString()}
                    </span>
                    <button 
                      className="bg-[#2f394b] hover:bg-orange-500 text-white p-2 rounded-full transform transition-transform duration-300 group-hover:rotate-12"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <RiAddLine size={20} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-[#1d2536]/80 backdrop-blur-sm p-6 flex flex-col border-l border-[#31394d]/50 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white">Your Cart</h2>
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
              <RiShoppingCartLine size={18} />
            </div>
          </div>
          
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-gray-400 hover:text-red-400 transition-colors flex items-center space-x-1 text-xs bg-[#2a3346] px-2 py-1 rounded border border-gray-700 hover:border-red-400/50"
              title="Clear Cart (Ctrl+Shift+X)"
            >
              <RiEraserLine size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Search */}
        {cart.length > 0 && (
          <div className="relative mb-4">
            <input
              type="text"
              value={cartSearchTerm}
              onChange={(e) => setCartSearchTerm(e.target.value)}
              placeholder="Search cart items..."
              className="w-full bg-[#2a3346] text-white placeholder-gray-400 rounded-lg px-3 py-2 pl-9 border border-[#31394d]/70 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 text-sm"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            {cartSearchTerm && (
              <button
                onClick={() => setCartSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <RiCloseLine size={16} />
              </button>
            )}
          </div>
        )}

        {/* Undo Banner */}
        {deletedItem && (
          <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <RiArrowGoBackLine className="text-orange-400" size={18} />
              <span className="text-orange-300 text-sm">Item removed</span>
            </div>
            <button
              onClick={undoRemove}
              className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition-colors"
            >
              Undo
            </button>
          </div>
        )}
        
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="h-24 w-24 rounded-full bg-[#2a3346]/50 flex items-center justify-center mb-4">
              <RiShoppingCartLine size={40} />
            </div>
            <p>Your cart is empty</p>
            <p className="text-sm mt-2">Add products to get started</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto pr-2 space-y-3 custom-scrollbar">
            {cart
              .filter(item => item.product.name.toLowerCase().includes(cartSearchTerm.toLowerCase()))
              .map(item => (
                <div 
                  key={item.product.id} 
                  className={`bg-[#2a3346]/80 rounded-xl p-4 border shadow-md transition-all duration-300 ${
                    expandedItem === item.product.id 
                      ? 'border-orange-500/50 ring-2 ring-orange-500/20' 
                      : 'border-[#31394d]/70 hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{item.product.name}</h3>
                      {/* Stock indicator with color coding */}
                      <div className="flex items-center mt-1 space-x-2">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                          item.product.quantity > 10 
                            ? 'bg-green-500/20 text-green-300' 
                            : item.product.quantity > 0 
                              ? 'bg-yellow-500/20 text-yellow-300' 
                              : 'bg-red-500/20 text-red-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.product.quantity > 10 ? 'bg-green-400' : item.product.quantity > 0 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          <span>Stock: {item.product.quantity}</span>
                        </div>
                        {item.quantity > item.product.quantity && (
                          <div className="flex items-center text-red-400 text-xs">
                            <RiErrorWarningLine size={12} className="mr-1" />
                            <span>Exceeds stock!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setExpandedItem(expandedItem === item.product.id ? null : item.product.id)}
                        className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                        title="More options"
                      >
                        <RiInformationLine size={18} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-400/10"
                        title="Remove item"
                      >
                        <RiDeleteBinLine size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Quantity Controls with +/- buttons */}
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-[#2f394b] rounded-lg border border-[#1a2133]">
                        <button
                          onClick={() => decrementQuantity(item.product.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4659] rounded-l-lg transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <RiSubtractLine size={16} />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              const newQuantity = value === '' ? 1 : parseInt(value);
                              if (newQuantity <= item.product.quantity) {
                                updateCartItemQuantity(item.product.id, newQuantity);
                              } else {
                                toast.error(`Only ${item.product.quantity} units available in stock`);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                              updateCartItemQuantity(item.product.id, 1);
                            }
                          }}
                          className="w-14 h-8 bg-transparent text-white text-center border-x border-[#1a2133] focus:outline-none"
                        />
                        <button
                          onClick={() => incrementQuantity(item.product.id, item.product.quantity)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#3a4659] rounded-r-lg transition-colors"
                          disabled={item.quantity >= item.product.quantity}
                        >
                          <RiAddLine size={16} />
                        </button>
                      </div>
                      
                      {/* Price input */}
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Ksh</span>
                        <input
                          type="text"
                          value={Number(item.discountedPrice || item.product.unit_price || 0).toFixed(2)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              const newPrice = value === '' ? 0 : parseFloat(value);
                              updateCartItemPrice(item.product.id, newPrice);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              updateCartItemPrice(item.product.id, item.product.unit_price);
                            } else {
                              const formattedPrice = parseFloat(value).toFixed(2);
                              updateCartItemPrice(item.product.id, parseFloat(formattedPrice));
                            }
                          }}
                          className="w-24 h-8 bg-[#2f394b] text-white text-right rounded-lg border border-[#1a2133] pr-2 text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>
                    
                    <p className="text-white font-bold text-lg">
                      Ksh {Number((item.discountedPrice || item.product.unit_price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Discount indicator */}
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {item.discountedPrice && item.discountedPrice < item.product.unit_price && (
                        <span className="text-orange-400 text-xs font-medium flex items-center">
                          <RiPercentLine size={12} className="mr-1" />
                          {((1 - Number(item.discountedPrice) / Number(item.product.unit_price)) * 100).toFixed(0)}% off
                        </span>
                      )}
                      {item.discountedPrice && item.discountedPrice < item.product.unit_price && (
                        <span className="text-gray-500 text-xs line-through">
                          Ksh {(Number(item.product.unit_price) * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">
                      Subtotal: Ksh {Number((item.discountedPrice || item.product.unit_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* Expanded Discount Options */}
                  {expandedItem === item.product.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700 animate-fade-in">
                      <p className="text-xs text-gray-400 mb-2">Quick Discounts:</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[5, 10, 15, 20, 25].map(percent => (
                          <button
                            key={percent}
                            onClick={() => applyDiscount(item.product.id, percent)}
                            className="px-2 py-1 bg-[#1a2133] text-orange-400 text-xs rounded hover:bg-[#232838] transition-colors"
                          >
                            -{percent}%
                          </button>
                        ))}
                        <button
                          onClick={() => setDiscountMode({ productId: item.product.id, type: 'percent' })}
                          className="px-2 py-1 bg-[#1a2133] text-gray-400 text-xs rounded hover:bg-[#232838] transition-colors"
                        >
                          Custom %
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Fixed Discount:</p>
                      <div className="flex flex-wrap gap-2">
                        {[10, 20, 50, 100].map(amount => (
                          <button
                            key={amount}
                            onClick={() => applyFixedDiscount(item.product.id, amount)}
                            className="px-2 py-1 bg-[#1a2133] text-orange-400 text-xs rounded hover:bg-[#232838] transition-colors"
                          >
                            -Ksh {amount}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => updateCartItemPrice(item.product.id, item.product.unit_price)}
                        className="mt-3 text-xs text-gray-400 hover:text-white flex items-center"
                      >
                        <RiRefreshLine size={12} className="mr-1" />
                        Reset to original price
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        <div className="mt-6 space-y-5 border-t border-[#31394d] pt-5">
          {/* Only show payment method selector in modal, not here */}

          <div className="flex justify-between items-center py-4">
            <span className="text-gray-400">Net Amount</span>
            <span className="text-white font-medium">
              Ksh {cartSubtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-[#31394d]">
            <span className="text-gray-400">VAT (16%)</span>
            <span className="text-white font-medium">
              Ksh {cartVat.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-white text-lg font-bold">Total</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 text-transparent bg-clip-text">
              Ksh {cartTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
              disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
              text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg 
              shadow-orange-500/20 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <RiShoppingCartLine size={20} />
            {isProcessing ? 'Processing...' : 'Complete Sale (F2)'}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'none' }}>
        {isPdfReady && lastSaleData && (
          <PdfDownload lastSaleData={lastSaleData} />
        )}
      </div>

      <Dialog
        open={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-[#1a1f2e] rounded-xl p-6 max-w-2xl w-full shadow-xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-white mb-4 flex items-center">
              <RiShoppingCartLine className="mr-2 text-orange-400" />
              Complete Sale
            </Dialog.Title>
            {currentSale && (
              <div className="space-y-4">
                {/* Cart Summary */}
                <div className="bg-[#232838] rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold flex items-center">
                      <RiInformationLine className="mr-1" size={16} />
                      Cart Items ({cart.length})
                    </h3>
                    <span className="text-orange-400 font-bold text-lg">
                      Ksh {currentSale.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center bg-[#1a2133] px-3 py-2 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-white">{item.product.name}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </div>
                        <span className="text-orange-300">
                          Ksh {Number((item.discountedPrice || item.product.unit_price || 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Payment Entry (Left) */}
                  <div className="bg-[#181c2a] rounded-lg p-4 border border-gray-800 shadow-md">
                    <div className="text-lg font-bold text-white mb-3 flex items-center">
                      <RiMoneyDollarCircleLine className="mr-2 text-orange-400" />
                      Add Payment
                    </div>
                    
                    {/* Payment Method Selection with Icons */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {([
                        { method: 'cash', icon: RiMoneyDollarCircleLine, label: 'Cash' },
                        { method: 'mpesa', icon: RiPhoneLine, label: 'M-Pesa' },
                        { method: 'card', icon: RiBankCardLine, label: 'Card' },
                        { method: 'equity', icon: RiBankCardLine, label: 'Equity' },
                        { method: 'mobile', icon: RiPhoneLine, label: 'Mobile' },
                        { method: 'credit', icon: RiArrowGoBackLine, label: 'Credit' }
                      ] as const).map(({ method, icon: Icon, label }) => (
                        <button
                          key={method}
                          onClick={() => setActivePaymentMethod(method)}
                          className={`py-2 px-2 text-xs font-semibold rounded border transition-all flex flex-col items-center gap-1 ${
                            activePaymentMethod === method 
                              ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                              : 'border-gray-700 text-gray-400 hover:bg-[#232838] hover:border-gray-600'
                          }`}
                        >
                          <Icon size={18} />
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2">Quick Amounts:</p>
                      <div className="flex flex-wrap gap-2">
                        {activePaymentMethod === 'cash' && [100, 200, 500, 1000, 2000].map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPaymentInput(amount.toString())}
                            className="px-3 py-1 bg-[#232838] text-orange-400 text-sm rounded hover:bg-[#2a3346] transition-colors"
                          >
                            Ksh {amount}
                          </button>
                        ))}
                        {activePaymentMethod !== 'cash' && (
                          <>
                            <button
                              onClick={() => setPaymentInput(currentSale.totalAmount.toString())}
                              className="px-3 py-1 bg-[#232838] text-orange-400 text-sm rounded hover:bg-[#2a3346] transition-colors"
                            >
                              Full Amount
                            </button>
                            <button
                              onClick={() => setPaymentInput((currentSale.totalAmount / 2).toString())}
                              className="px-3 py-1 bg-[#232838] text-orange-400 text-sm rounded hover:bg-[#2a3346] transition-colors"
                            >
                              Half
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Ksh</span>
                        <input
                          type="number"
                          value={paymentInput}
                          onChange={(e) => setPaymentInput(e.target.value)}
                          placeholder="Amount"
                          className="w-full bg-[#232838] text-white px-3 py-3 pl-14 rounded border border-gray-700 text-lg font-bold focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const amt = parseFloat(paymentInput)
                          if (amt > 0) {
                            setPayments([...payments, { payment_method: activePaymentMethod, amount: amt }])
                            setPaymentInput('')
                          }
                        }}
                        className="px-6 py-3 bg-orange-500 text-white rounded font-bold text-lg shadow hover:bg-orange-600 transition-colors flex items-center"
                      >
                        <RiAddLine size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Payment Summary (Right) */}
                  <div className="bg-[#181c2a] rounded-lg p-4 border border-gray-800 shadow-md flex flex-col">
                    <div className="text-lg font-bold text-white mb-3 flex items-center">
                      <RiCheckLine className="mr-2 text-green-400" />
                      Payment Summary
                    </div>
                    
                    <div className="flex-1 space-y-2 min-h-[100px]">
                      {payments.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                          <RiMoneyDollarCircleLine size={32} className="mb-2" />
                          <span className="text-sm italic">No payments added yet</span>
                        </div>
                      )}
                      {payments.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#232838] rounded px-3 py-2 border border-gray-700">
                          <div className={`w-2 h-2 rounded-full ${
                            p.payment_method === 'cash' ? 'bg-green-400' :
                            p.payment_method === 'credit' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`}></div>
                          <span className="flex-1 text-white font-semibold capitalize">{p.payment_method}</span>
                          <span className="w-28 text-right text-orange-300 font-bold">Ksh {p.amount.toLocaleString()}</span>
                          <button
                            onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                            className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Remove payment"
                          >
                            <RiCloseLine size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Payment Totals */}
                    <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-400 font-medium">Total Paid</span>
                        <span className="text-white font-bold">Ksh {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xl">
                        <span className="text-gray-400 font-semibold">Remaining</span>
                        <span className={`font-bold ${
                          currentSale.totalAmount - payments.reduce((sum, p) => sum + p.amount, 0) > 0 
                            ? 'text-red-400' 
                            : 'text-green-400'
                        }`}>
                          Ksh {Math.max(0, currentSale.totalAmount - payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                        </span>
                      </div>
                      {payments.reduce((sum, p) => sum + p.amount, 0) > currentSale.totalAmount && (
                        <div className="flex justify-between text-xl animate-pulse">
                          <span className="text-green-400 font-semibold flex items-center">
                            <RiCheckLine className="mr-1" />
                            Change Due
                          </span>
                          <span className="text-green-400 font-bold">Ksh {(payments.reduce((sum, p) => sum + p.amount, 0) - currentSale.totalAmount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Selection */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <RiUserLine className="text-blue-400 mr-2" size={20} />
                    <span className="text-blue-200 font-medium">Select Customer (Optional)</span>
                  </div>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setSelectedCustomer(null)
                    }}
                    placeholder="Search customers..."
                    className="w-full mb-3 px-3 py-2 rounded border border-gray-700 bg-[#181c2a] text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredCustomers.length === 0 && <div className="text-gray-400 text-sm">No customers found.</div>}
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        className={`p-2 rounded cursor-pointer flex justify-between items-center border ${
                          selectedCustomer?.id === c.id 
                            ? 'bg-blue-500/20 border-blue-500' 
                            : 'hover:bg-blue-500/10 border-gray-700'
                        }`}
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch('')
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${selectedCustomer?.id === c.id ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                          <span className="text-white font-medium">{c.name}</span>
                          {c.phone && <span className="text-xs text-gray-400">({c.phone})</span>}
                        </div>
                        {selectedCustomer?.id === c.id && (
                          <span className="text-xs text-blue-400">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Selected customer display */}
                  {selectedCustomer && (
                    <div className="mt-3 p-2 bg-blue-500/20 rounded border border-blue-500/30 flex items-center justify-between">
                      <div className="flex items-center">
                        <RiUserLine className="text-blue-400 mr-2" size={16} />
                        <span className="text-white">{selectedCustomer.name}</span>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="text-xs text-blue-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  {/* Add new customer option */}
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-400 mb-2">Or add new customer:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="Customer name"
                        className="flex-1 px-3 py-2 rounded border border-gray-700 bg-[#181c2a] text-white text-sm"
                      />
                      <button
                        onClick={handleAddCustomer}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsConfirmationOpen(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <RiCloseLine className="mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={confirmSale}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                      disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                      text-white rounded-lg font-medium transition-all flex items-center justify-center shadow-lg shadow-orange-500/20"
                  >
                    {isProcessing ? (
                      <>
                        <RiRefreshLine className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RiCheckLine className="mr-2" />
                        Confirm Sale
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        
        /* Animation keyframes */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        `}
      </style>
    </div>
    </>
  );
}
