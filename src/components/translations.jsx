export const translations = {
  en: {
    // Navigation
    products: 'Products',
    myOrders: 'My Orders',
    trackOrder: 'Track Order',
    dealerLogin: 'Dealer Login',
    logout: 'Logout',
    
    // Products Page
    premiumCoffeeCollection: 'Premium Coffee Collection',
    carefullySourced: 'Carefully sourced, expertly roasted',
    loginToSeePrices: 'Login to view pricing',
    dealerLoginButton: 'Dealer Login',
    cardView: 'Card View',
    listView: 'List View',
    itemsInCart: 'items',
    placeOrder: 'Place Order',
    
    // Product Card/List
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    loginForPrice: 'Login for price',
    product: 'Product',
    category: 'Category',
    weight: 'Weight',
    price: 'Price',
    quantity: 'Quantity',
    action: 'Action',
    
    // Checkout
    orderSummary: 'Order Summary',
    paymentMethod: 'Payment Method',
    bankTransfer: 'Bank Transfer / EFT',
    creditCard: 'Credit Card',
    paypal: 'PayPal',
    cashOnDelivery: 'Cash on Delivery',
    deliveryAddress: 'Delivery Address',
    deliveryAddressPlaceholder: 'Enter delivery address...',
    orderNotes: 'Order Notes (Optional)',
    orderNotesPlaceholder: 'Write any special requests...',
    cancel: 'Cancel',
    confirmOrder: 'Confirm Order',
    processing: 'Processing...',
    total: 'Total Amount',
    
    // Orders Page
    myOrdersTitle: 'My Orders',
    trackAllOrders: 'Track all your orders here',
    noOrdersYet: 'No orders yet',
    noOrdersDesc: 'Start ordering from the products page',
    goToProducts: 'Go to Products',
    orderDetails: 'Details',
    
    // Order Details
    backToOrders: 'Back to My Orders',
    order: 'Order',
    orderNotFound: 'Order not found',
    orderItemsTitle: 'Order Details',
    deliveryAddressTitle: 'Delivery Address',
    orderNotesTitle: 'Order Notes',
    paymentInfo: 'Payment Information',
    paymentMethodLabel: 'Payment Method',
    paymentStatus: 'Payment Status',
    makePayment: 'Make Payment',
    notifyPayment: 'Notify Payment',
    completeOrder: 'Complete Order',
    payWithPayPal: 'Pay with PayPal',
    amountToPay: 'Amount to Pay',
    bankDetails: 'Bank Details',
    bankName: 'Bank: Harvest Coffee Ltd',
    iban: 'IBAN: GB00 HCOF 1234 5678 9012',
    reference: 'Reference',
    paypalRedirect: 'You will be redirected to PayPal',
    cashOnDeliveryNote: 'Payment will be made on delivery',
    creditCardNote: 'Credit card payment integration is being configured.',
    payment: 'Payment',
    close: 'Close',
    items: 'items',
    pcs: 'pcs',
    totalAmount: 'Total Amount',
    moreProducts: 'more products',
    productsLabel: 'Products:',
    
    // Status
    preparing: 'Preparing',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    
    // Footer
    allRightsReserved: 'All rights reserved',
  },
  tr: {
    // Navigation
    products: 'Products',
    myOrders: 'My Orders',
    trackOrder: 'Track Order',
    dealerLogin: 'Dealer Login',
    logout: 'Logout',
    
    // Products Page
    premiumCoffeeCollection: 'Premium Coffee Collection',
    carefullySourced: 'Carefully sourced, expertly roasted',
    loginToSeePrices: 'Sign in as a dealer to view pricing',
    dealerLoginButton: 'Dealer Login',
    cardView: 'Card View',
    listView: 'List View',
    itemsInCart: 'items',
    placeOrder: 'Place Order',
    
    // Product Card/List
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    loginForPrice: 'Sign in for price',
    product: 'Product',
    category: 'Category',
    weight: 'Weight',
    price: 'Price',
    quantity: 'Quantity',
    action: 'Action',
    
    // Checkout
    orderSummary: 'Order Summary',
    paymentMethod: 'Payment Method',
    bankTransfer: 'Bank Transfer',
    creditCard: 'Credit Card',
    paypal: 'PayPal',
    cashOnDelivery: 'Cash on Delivery',
    deliveryAddress: 'Delivery Address',
    deliveryAddressPlaceholder: 'Enter delivery address...',
    orderNotes: 'Order Notes (Optional)',
    orderNotesPlaceholder: 'Write any special requests...',
    cancel: 'Cancel',
    confirmOrder: 'Confirm Order',
    processing: 'Processing...',
    total: 'Total Amount',
    
    // Orders Page
    myOrdersTitle: 'My Orders',
    trackAllOrders: 'Track all your orders here',
    noOrdersYet: 'No orders yet',
    noOrdersDesc: 'Start ordering from the products page',
    goToProducts: 'Productse Git',
    orderDetails: 'Details',
    
    // Order Details
    backToOrders: 'Back to My Orders',
    order: 'Order',
    orderNotFound: 'No orders found',
    orderItemsTitle: 'Order Details',
    deliveryAddressTitle: 'Delivery Address',
    orderNotesTitle: 'Order Notes',
    paymentInfo: 'Payment Information',
    paymentMethodLabel: 'Payment Method',
    paymentStatus: 'Payment Status',
    makePayment: 'Make Payment',
    notifyPayment: 'Notify Payment',
    completeOrder: 'Complete Order',
    payWithPayPal: 'Pay with PayPal',
    amountToPay: 'Amount to Pay',
    bankDetails: 'Bank Details',
    bankName: 'Bank: Harvest Coffee Ltd',
    iban: 'IBAN: GB00 HCOF 1234 5678 9012',
    reference: 'Reference',
    paypalRedirect: 'You will be redirected to PayPal',
    cashOnDeliveryNote: 'Payment will be made on delivery',
    creditCardNote: 'Credit card payment integration is being configured.',
    payment: 'Payment',
    close: 'Close',
    items: 'items',
    pcs: 'units',
    totalAmount: 'Total Amount',
    moreProducts: 'more products',
    productsLabel: 'Products:',
    
    // Status
    preparing: 'Preparing',
    inTransit: 'In Transit',
    delivered: 'Delivered',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    
    // Footer
    allRightsReserved: 'All rights reserved',
  }
};

export const useTranslation = (lang = 'en') => {
  return translations[lang] || translations.en;
};
