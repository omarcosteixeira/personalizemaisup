
export enum PricingMode {
  UNIT = 'UNIT',
  AREA = 'AREA',
  MILHEIRO = 'MILHEIRO'
}

export type OrderStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'PRODUCTION' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export type PayableStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface SystemConfig {
  basicPlanPrice: number;
  proPlanPrice: number;
  basicPlanPaymentLink: string;
  proPlanPaymentLink: string;
  paymentLink: string;
}

export interface PayableAccount {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  status: PayableStatus;
  paidAt?: string;
  provider?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  productionCost: number;
  mode: PricingMode;
  category: string;
  description?: string;
  materialId?: string;
  imageUrl?: string;
  isHighlighted?: boolean;
  hiddenInStore?: boolean;
  hasSize?: boolean;
  availableSizes?: string[];
  hasTheme?: boolean;
  productionTime?: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  width?: number; // cm
  height?: number; // cm
  quantity: number;
  unitPrice: number;
  total: number;
  isAdHoc?: boolean;
  selectedSize?: string;
  selectedTheme?: string;
  productionTime?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  address: string;
  createdAt: string;
}

export interface SidebarBanner {
  id: string;
  imageUrl: string;
  link: string;
}

export interface CustomFont {
  id: string;
  name: string;
  data: string; // Base64
  format: string; // ttf, otf, woff
}

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  webhookStatus?: 'PENDING' | 'SUCCESS' | 'ERROR';
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  imageUrl?: string;
}

export interface Quotation {
  id: string;
  customerName: string;
  customerContact: string;
  customerId?: string;
  items: QuotationItem[];
  subtotal: number;
  discountValue: number;
  discountType: 'FIXED' | 'PERCENT';
  couponCode?: string;
  shippingValue: number;
  shippingName?: string;
  gatewayFee?: number;
  total: number;
  paymentMethod?: 'CASH' | 'PIX' | 'DEBIT' | 'CREDIT';
  paymentOption?: 'FULL' | 'SPLIT'; // Total ou 50/50
  installments?: number;
  createdAt: string;
  status: OrderStatus;
  customMessage?: string;
  isPaid?: boolean; // True se TOTALMENTE pago
  paidAt?: string;
  amountPaid?: number; // Valor efetivamente pago (pode ser parcial)
}

export interface Coupon {
  id: string;
  code: string;
  value: number;
  type: 'FIXED' | 'PERCENT';
  active: boolean;
}

export interface AppSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  banners: string[];
  showSidebarBanners: boolean;
  sidebarBanners: SidebarBanner[];
  socialLinks: {
    instagram?: string;
    facebook?: string;
    website?: string;
    tiktokShop?: string;
  };
  shippingOptions: ShippingOption[];
  waMessages: {
    quotation: string;
    awaiting_payment: string;
    production: string;
    shipping: string;
    delivered: string;
    cancelled: string;
    store_product: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    storeLayout: 'modern' | 'minimal' | 'bold';
  };
  financials: {
    monthlyFixedCosts: number;
    desiredMonthlySalary: number;
    workingDaysPerMonth: number;
    hoursPerDay: number;
  };
  groqApiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  botEnabled?: boolean;
  botSessionId?: string;
  botSessions?: string[];
  paymentGateway?: {
    provider: 'mercadopago' | 'pagseguro' | 'asaas' | 'infinitepay' | 'none';
    accessToken?: string;
    autoSendLink?: boolean;
  };
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  minQuantity: number;
  currentQuantity: number;
  cost: number;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: string;
}
