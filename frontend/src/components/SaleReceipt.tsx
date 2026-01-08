


import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { BusinessSettings } from '../services/api'

interface CartItem {
  product: {
    id: number
    name: string
    unit_price: number
  }
  quantity: number
}

interface Payment {
  payment_method: string
  amount: number
}

interface ReceiptProps {
  items: CartItem[]
  totalAmount: number
  amountPaid?: number
  balanceDue?: number
  payments?: Payment[]
  paymentMethod: string
  transactionDate: string
  receiptNumber: string
  cashierName?: string
  customerName?: string
  businessSettings?: BusinessSettings
}

// Register fonts using local files
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: '/fonts/OpenSans-Regular.ttf' },
    { src: '/fonts/OpenSans-Bold.ttf', fontWeight: 'bold' }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: '14.17pt',
    fontSize: 8,
    backgroundColor: '#fff',
    fontFamily: 'Open Sans'
  },
  header: {
    marginBottom: 6,
    textAlign: 'center',
    borderBottom: '1pt dashed #888',
    paddingBottom: 6
  },
  title: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
    color: '#000'
  },
  info: {
    marginBottom: 1,
    color: '#374151',
    fontSize: 8
  },
  tagline: {
    fontSize: 9,
    marginBottom: 2,
    color: '#222'
  },
  meta: {
    fontSize: 8,
    marginBottom: 2
  },
  table: {
    margin: '8pt 0'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    padding: '2pt 0',
    minHeight: 10,
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
    width: '48%',
    fontSize: 8
  },
  tableCol2: {
    width: '16%',
    textAlign: 'center',
    fontSize: 8
  },
  tableCol3: {
    width: '36%',
    textAlign: 'right',
    fontSize: 8
  },
  totals: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: 'bold',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2
  },
  amountWords: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 8,
    fontStyle: 'italic'
  },
  taxDetails: {
    marginTop: 6,
    fontSize: 8,
    color: '#222'
  },
  etims: {
    fontSize: 7,
    color: '#666',
    marginTop: 2,
    textAlign: 'center'
  },
  footer: {
    marginTop: 10,
    borderTop: '0.5pt dashed #e5e7eb',
    paddingTop: 6,
    textAlign: 'center',
    fontSize: 8
  },
  businessInfo: {
    color: '#374151',
    fontSize: 8
  },
  qr: {
    marginTop: 4,
    alignSelf: 'center',
    width: 40,
    height: 40
  }
})

function numberToWords(num: number): string {
  // Simple version for Ksh only
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num === 0) return "Zero";
  if (num < 20) return a[num];
  if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
  if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
  if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  return num.toString();
}

const SaleReceipt = ({
  items,
  totalAmount,
  amountPaid,
  balanceDue,
  payments = [],
  paymentMethod,
  transactionDate,
  receiptNumber,
  cashierName,
  customerName,
  businessSettings
}: ReceiptProps) => {
  const currency = businessSettings?.currency || 'KSH';
  const VAT_RATE = 0.16;
  const vatable = totalAmount / (1 + VAT_RATE);
  const vatAmt = totalAmount - vatable;
  const amountWords = numberToWords(Math.round(totalAmount)) + ' Shillings Only';
  const change = amountPaid !== undefined ? amountPaid - totalAmount : 0;
  const pin = businessSettings?.tax_id || 'N/A';
  const tagline = businessSettings?.tagline || 'Where quality meets affordability';
  const etimsSig = 'RCPT-XXXXXX...';

  return (
    <Document>
      <Page size={[198, 840]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{businessSettings?.business_name || 'Sales Receipt'}</Text>
          {businessSettings?.address && (
            <Text style={styles.info}>{businessSettings.address}</Text>
          )}
          {businessSettings?.phone && (
            <Text style={styles.info}>Tel: {businessSettings.phone}</Text>
          )}
          {businessSettings?.email && (
            <Text style={styles.info}>{businessSettings.email}</Text>
          )}
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
        <View style={styles.meta}>
          <Text>{new Date(transactionDate).toLocaleString()}</Text>
          <Text>Receipt: {receiptNumber}</Text>
          {customerName && <Text>Customer: {customerName}</Text>}
          <Text>PIN: {pin}</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol1, styles.tableHeaderText]}>DESCRIPTION</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>QTY</Text>
            <Text style={[styles.tableCol3, styles.tableHeaderText]}>EXT</Text>
          </View>
          {items.map((item) => (
            <View key={item.product.id} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.product.name}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{(item.product.unit_price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{currency} {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TOTAL</Text>
            <Text>{currency} {totalAmount.toFixed(2)}</Text>
          </View>
          {payments.length > 0 ? payments.map((p, i) => (
            <View style={styles.totalRow} key={i}>
              <Text>Tendered ({p.payment_method.toUpperCase()})</Text>
              <Text>{currency} {Number(p.amount).toFixed(2)}</Text>
            </View>
          )) : (
            <View style={styles.totalRow}>
              <Text>Tendered ({paymentMethod.toUpperCase()})</Text>
              <Text>{currency} {amountPaid?.toFixed(2)}</Text>
            </View>
          )}
          {change > 0 && (
            <View style={styles.totalRow}>
              <Text>Change</Text>
              <Text>{currency} {change.toFixed(2)}</Text>
            </View>
          )}
          <Text style={styles.amountWords}>{amountWords.toUpperCase()}</Text>
        </View>
        <View style={styles.taxDetails}>
          <Text>TAX DETAILS</Text>
          <Text>VATABLE {currency} {vatable.toFixed(2)}</Text>
          <Text>VAT AMT {currency} {vatAmt.toFixed(2)}</Text>
        </View>
        <Text style={styles.etims}>KRA eTIMS{"\n"}Sig: {etimsSig}</Text>
        {/* Optional QR code area: <Image src={qrCodeUrl} style={styles.qr} /> */}
        <View style={styles.footer}>
          <Text>Served by: {cashierName || 'Cashier'}</Text>
          <Text>Thank you for your purchase!</Text>
          <Text style={[styles.businessInfo, { marginTop: 6, fontWeight: 'bold' }]}>*** Powering Your Business ***</Text>
        </View>
      </Page>
    </Document>
  )
}

export { SaleReceipt }
