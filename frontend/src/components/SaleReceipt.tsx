import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

interface CartItem {
  product: {
    id: number
    name: string
    unit_price: number
  }
  quantity: number
}

interface ReceiptProps {
  items: CartItem[]
  totalAmount: number
  paymentMethod: string
  transactionDate: string
  receiptNumber: string
}

// Register fonts using local files
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: '/fonts/OpenSans-Regular.ttf' },
    { 
      src: '/fonts/OpenSans-Bold.ttf', 
      fontWeight: 'bold' 
    }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: '14.17pt', // 0.5cm in points
    fontSize: 8,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
    borderBottom: '1pt solid #eeeeee',
    paddingBottom: 10
  },
  title: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Open Sans',
    fontWeight: 'bold',
    color: '#2563eb'
  },
  info: {
    marginBottom: 4,
    color: '#4b5563',
    fontSize: 8
  },
  table: {
    margin: '10pt 0'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    padding: '4pt 0',
    minHeight: 12,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#f3f4f6'
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151'
  },
  tableCol1: {
    width: '40%',
    paddingRight: 4,
    fontSize: 8
  },
  tableCol2: {
    width: '20%',
    textAlign: 'center',
    fontSize: 8
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
    fontSize: 8
  },
  total: {
    marginTop: 10,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 8
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#6b7280',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 10
  },
  businessInfo: {
    marginTop: 5,
    fontSize: 6,
    color: '#9ca3af'
  }
})

export const SaleReceipt: React.FC<ReceiptProps> = ({ 
  items, 
  totalAmount, 
  paymentMethod, 
  transactionDate, 
  receiptNumber 
}) => {
  // Validate required props
  if (!items?.length || !totalAmount || !paymentMethod || !transactionDate || !receiptNumber) {
    console.error('Missing required props:', { items, totalAmount, paymentMethod, transactionDate, receiptNumber })
    return null
  }

  // Validate items data
  const validItems = items.every(item => 
    item.product?.id && 
    item.product?.name && 
    typeof item.product?.unit_price === 'number' && 
    typeof item.quantity === 'number'
  )

  if (!validItems) {
    console.error('Invalid items data:', items)
    return null
  }

  return (
    <Document>
      <Page size={[198, 840]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Sales Receipt</Text>
          <Text style={styles.info}>Receipt #: {receiptNumber}</Text>
          <Text style={styles.info}>
            Date: {new Date(transactionDate).toLocaleDateString()}
          </Text>
          <Text style={styles.info}>
            Time: {new Date(transactionDate).toLocaleTimeString()}
          </Text>
          <Text style={styles.info}>
            Payment Method: {paymentMethod.toUpperCase()}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol1, styles.tableHeaderText]}>Item</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>Price</Text>
            <Text style={[styles.tableCol3, styles.tableHeaderText]}>Total</Text>
          </View>
          
          {items.map((item) => (
            <View key={item.product.id} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.product.name}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol2}>
                {item.product.unit_price.toFixed(2)}
              </Text>
              <Text style={styles.tableCol3}>
                {(item.product.unit_price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <Text>Total Amount: KSH {totalAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text style={styles.businessInfo}>
            Your Business Name Ltd • P.O. Box 12345-00100 • Nairobi, Kenya
          </Text>
          <Text style={styles.businessInfo}>
            Tel: +254 123 456 789 • Email: sales@yourbusiness.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}