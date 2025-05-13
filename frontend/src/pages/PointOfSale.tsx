import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RiAddLine, RiSubtractLine, RiDeleteBinLine, RiShoppingCartLine, RiPrinterLine, RiCloseLine, RiSearchLine } from 'react-icons/ri'
import { productAPI, salesAPI } from '../services/api'
import toast from 'react-hot-toast'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { SaleReceipt } from '../components/SaleReceipt'
import { Dialog } from '@headlessui/react'

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
  payment_method: 'cash' | 'card' | 'mobile'
}

interface CartItem {
  product: Product;
  quantity: number;
  discountedPrice?: number;  // Optional discounted price
}

export const PointOfSale = () => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash')
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [lastSaleData, setLastSaleData] = useState<{
    items: Array<{ product: Product; quantity: number }>;
    totalAmount: number;
    paymentMethod: string;
    transactionDate: string;
    receiptNumber: string;
  } | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [currentSale, setCurrentSale] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const queryClient = useQueryClient()
  const receiptContainerRef = useRef<HTMLDivElement>(null)

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: productAPI.getAll
  })

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
        
        // Show success toast after state update
        setTimeout(() => {
          toast.success(`Added ${product.name} to cart`)
        }, 0)
        
        return updatedCart
      }
      
      // Show success toast after state update
      setTimeout(() => {
        toast.success(`Added ${product.name} to cart`)
      }, 0)
      
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  // Add a function to handle quantity updates directly
  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          // Don't allow quantity to exceed stock
          if (newQuantity > item.product.quantity) {
            toast.error(`Only ${item.product.quantity} units available in stock`)
            return item
          }
          // Don't allow quantity below 1
          if (newQuantity < 1) {
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    })
  }

  // Add a function to handle price updates
  const updateCartItemPrice = (productId: number, newPrice: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            discountedPrice: newPrice >= 0 ? newPrice : item.product.unit_price
          };
        }
        return item;
      });
    });
  };

  // Simple remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => 
      prevCart.filter(item => item.product.id !== productId)
    )
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

      const formattedItems = receiptData.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          unit_price: Number(item.product.unit_price)
        }
      }));

      const total = Number(receiptData.totalAmount);
      const vat = (total * 0.16).toFixed(2); // 16% of total
      const subtotal = (total - Number(vat)).toFixed(2); // Total minus VAT

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
                margin: 2mm 0;
                font-size: 9pt;
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
                font-size: 9pt;
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
                <h2>SALES RECEIPT</h2>
                <p>Receipt #: ${receiptData.receiptNumber}</p>
                <p>Date: ${receiptData.date}</p>
                <p>Payment: ${receiptData.paymentMethod.toUpperCase()}</p>
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
                  ${formattedItems.map(item => `
                    <tr>
                      <td style="max-width: 25mm; word-wrap: break-word;">${item.product.name}</td>
                      <td class="qty">${item.quantity}</td>
                      <td class="price">${item.product.unit_price.toFixed(2)}</td>
                      <td class="total">${(item.quantity * item.product.unit_price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="totals">
                <p>
                  <span>Net Amount:</span>
                  <span>Ksh ${subtotal}</span>
                </p>
                <p>
                  <span>VAT (16%):</span>
                  <span>Ksh ${vat}</span>
                </p>
                <p class="grand-total">
                  <span>TOTAL:</span>
                  <span>Ksh ${total.toFixed(2)}</span>
                </p>
              </div>
              
              <div class="footer">
                <p>Thank you for your business!</p>
                <p>${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      doc.close();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 500);

    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0 || isProcessing) {
      return;
    }

    const total = cart.reduce((sum, item) => 
      sum + ((item.discountedPrice || item.product.unit_price) * item.quantity), 0
    );
    const vat = total * (16/116);
    const subtotal = total - vat;

    const saleData = {
      items: cart,
      totalAmount: total,
      subtotal: subtotal,
      vat: vat,
      paymentMethod,
      receiptNumber: generateReceiptNumber(),
      date: new Date().toLocaleString()
    }

    setCurrentSale(saleData)
    setIsConfirmationOpen(true)
  }

  const confirmSale = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.discountedPrice || item.product.unit_price
        })),
        total_amount: currentSale.totalAmount,
        payment_method: paymentMethod
      }

      await salesAPI.create(saleData)
      
      const receiptData = {
        items: cart,
        totalAmount: currentSale.totalAmount,
        paymentMethod,
        receiptNumber: currentSale.receiptNumber,
        date: currentSale.date
      }

      handlePrint(receiptData)

      toast.success('Sale completed!')
      queryClient.invalidateQueries(['products'])
      setCart([])
      setIsConfirmationOpen(false)

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
    sum + ((item.discountedPrice || item.product.unit_price) * item.quantity), 0
  );
  const cartVat = cartTotal * (16 / 116); // Extract VAT from total
  const cartSubtotal = cartTotal - cartVat;

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#151b29] to-[#1f2b3e]">
      {/* Products List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Point of Sale</h1>
          
          {/* Add this search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#2a3346]/80 text-white placeholder-gray-400 rounded-xl px-4 py-3 pl-10 border border-[#31394d]/70 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Cart</h2>
          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
            <RiShoppingCartLine size={18} />
          </div>
        </div>
        
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
            {cart.map(item => (
              <div 
                key={item.product.id} 
                className="bg-[#2a3346]/80 rounded-xl p-4 border border-[#31394d]/70 shadow-md hover:border-orange-500/30 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white font-medium">{item.product.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-400/10"
                  >
                    <RiDeleteBinLine size={18} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-2">
                    {/* Quantity Input */}
                    <input
                      type="text" // Change from type="number" to type="text"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          const newQuantity = value === '' ? 1 : parseInt(value);
                          // Validate against stock limit
                          if (newQuantity <= item.product.quantity) {
                            updateCartItemQuantity(item.product.id, newQuantity);
                          } else {
                            toast.error(`Only ${item.product.quantity} units available in stock`);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure minimum value of 1 when input loses focus
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          updateCartItemQuantity(item.product.id, 1);
                        }
                      }}
                      className="w-20 h-8 bg-[#2f394b] text-white text-center rounded-lg border border-[#1a2133]
                        focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                    />
                    
                    {/* Price Input */}
                    <input
                      type="text" // Change from type="number" to type="text"
                      value={item.discountedPrice || item.product.unit_price}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal points
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          const newPrice = value === '' ? 0 : parseFloat(value);
                          updateCartItemPrice(item.product.id, newPrice);
                        }
                      }}
                      onBlur={(e) => {
                        // Format price to 2 decimal places when input loses focus
                        const value = e.target.value;
                        if (value === '') {
                          updateCartItemPrice(item.product.id, item.product.unit_price);
                        } else {
                          const formattedPrice = parseFloat(value).toFixed(2);
                          updateCartItemPrice(item.product.id, parseFloat(formattedPrice));
                        }
                      }}
                      className="w-24 h-8 bg-[#2f394b] text-white text-center rounded-lg border border-[#1a2133]
                        focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                  
                  <p className="text-white font-medium">
                    Ksh {((item.discountedPrice || item.product.unit_price) * item.quantity).toLocaleString()}
                  </p>
                </div>
                
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                  <span>Stock: {item.product.quantity}</span>
                  <span>Original Price: Ksh {item.product.unit_price.toLocaleString()}</span>
                  {item.discountedPrice && item.discountedPrice < item.product.unit_price && (
                    <span className="text-orange-400">
                      Discount: {((1 - item.discountedPrice / item.product.unit_price) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-5 border-t border-[#31394d] pt-5">
          <div className="bg-[#2a3346]/60 rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-[#31394d]">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3 px-2 text-center text-sm font-medium ${paymentMethod === 'cash' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#343d52]/70'} transition-colors`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 px-2 text-center text-sm font-medium ${paymentMethod === 'card' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#343d52]/70'} transition-colors`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod('mobile')}
                className={`flex-1 py-3 px-2 text-center text-sm font-medium ${paymentMethod === 'mobile' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#343d52]/70'} transition-colors`}
              >
                Mobile
              </button>
            </div>
          </div>

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
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
      
      {/* Hidden PDF Download Link - Only renders when a sale is completed */}
      <div style={{ display: 'none' }}>
        {isPdfReady && lastSaleData && (
          <PdfDownload lastSaleData={lastSaleData} />
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog
        open={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-[#1a1f2e] rounded-xl p-6 max-w-sm w-full shadow-xl border border-gray-800">
            <Dialog.Title className="text-xl font-bold text-white mb-4">
              Confirm Sale
            </Dialog.Title>

            {currentSale && (
              <div className="space-y-4">
                <div className="bg-[#232838] rounded-lg p-4">
                  <div className="text-center mb-4">
                    <p className="text-gray-400">Receipt #{currentSale.receiptNumber}</p>
                    <p className="text-gray-400">{currentSale.date}</p>
                  </div>

                  <div className="divide-y divide-gray-700">
                    {currentSale.items.map((item: any, index: number) => (
                      <div key={index} className="py-2 flex justify-between">
                        <span className="text-white">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-gray-400">
                          Ksh {(item.quantity * (item.discountedPrice || item.product.unit_price)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 mt-4 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Net Amount</span>
                      <span className="text-gray-300">
                        Ksh {currentSale.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">VAT (16%)</span>
                      <span className="text-gray-300">
                        Ksh {currentSale.vat.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-700">
                      <span className="text-white font-medium">Total (VAT inc.)</span>
                      <span className="text-white font-bold">
                        Ksh {currentSale.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      *Prices are inclusive of 16% VAT
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={confirmSale}
                    disabled={isProcessing}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm & Print'}
                  </button>
                  <button
                    onClick={() => setIsConfirmationOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* Custom scrollbar styles */}
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        `}
      </style>
    </div>
  );
}