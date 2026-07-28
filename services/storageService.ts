
import { Product, Quotation, StockItem, StockMovement, AppSettings, Coupon, Customer, CustomFont, SystemConfig, PayableAccount, Prospect, MessageTemplate } from '../types';
import { db, auth } from './firebaseService';
import { 
  collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, orderBy 
} from 'firebase/firestore';

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Personalize +',
  address: 'Rua das Impressões, 123 - Centro',
  phone: '(11) 98765-4321',
  email: 'contato@personalizeplus.com',
  logoUrl: '',
  banners: [],
  showSidebarBanners: false,
  sidebarBanners: [],
  socialLinks: { instagram: '', facebook: '', website: '', tiktokShop: '' },
  shippingOptions: [
    { id: '1', name: 'Retirada no Balcão', price: 0 },
    { id: '2', name: 'Entrega Expressa', price: 15 }
  ],
  waMessages: {
    quotation: 'Olá {cliente}! Segue seu orçamento da {empresa}.\n\nTotal: {total}',
    awaiting_payment: 'Olá {cliente}! Seu pedido {id} aguarda pagamento.',
    production: 'Olá {cliente}! Seu pedido {id} entrou em produção!',
    shipping: 'Olá {cliente}! Seu pedido {id} saiu para entrega!',
    delivered: 'Olá {cliente}! Seu pedido {id} foi entregue.',
    cancelled: 'Olá {cliente}! Seu pedido {id} foi cancelado.',
    store_product: 'Olá! Gostaria de informações sobre o produto *{produto}*.'
  },
  theme: { primaryColor: '#4338ca', secondaryColor: '#10b981', storeLayout: 'modern' },
  financials: { monthlyFixedCosts: 1500, desiredMonthlySalary: 3000, workingDaysPerMonth: 22, hoursPerDay: 8 },
  groqApiKey: '',
  webhookUrl: '',
  webhookSecret: '',
  botEnabled: false,
  botSessionId: 'vendas',
  botSessions: ['vendas'],
  paymentGateway: {
    provider: 'none',
    accessToken: '',
    autoSendLink: false
  }
};

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  basicPlanPrice: 0,
  proPlanPrice: 35.00,
  basicPlanPaymentLink: '',
  proPlanPaymentLink: 'https://mpago.la/12vds9h',
  paymentLink: 'https://mpago.la/12vds9h'
};

const getTenantPath = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  return `tenants/${user.uid}`;
};

const syncToFirebase = async (col: string, id: string, data: any) => {
  try {
    const path = getTenantPath();
    await setDoc(doc(db, `${path}/${col}`, id), data);
  } catch (e: any) { 
    if (e.code !== 'permission-denied' && !e.message?.includes('Missing or insufficient permissions')) {
      console.error(e); 
    }
  }
};

const removeFromFirebase = async (col: string, id: string) => {
  try {
    const path = getTenantPath();
    await deleteDoc(doc(db, `${path}/${col}`, id));
  } catch (e: any) { 
    if (e.code !== 'permission-denied' && !e.message?.includes('Missing or insufficient permissions')) {
      console.error(e); 
    }
  }
};

export const storage = {
  initSync: async () => {
    const user = auth.currentUser;
    if (!user) return;
    const path = `tenants/${user.uid}`;
    
    const collections = [
      { k: 'products', fb: 'products' },
      { k: 'quotations', fb: 'quotations' },
      { k: 'stock', fb: 'stock' },
      { k: 'customers', fb: 'customers' },
      { k: 'coupons', fb: 'coupons' },
      { k: 'payables', fb: 'payables' },
      { k: 'prospects', fb: 'prospects' },
      { k: 'message_templates', fb: 'message_templates' }
    ];

    const syncTasks = collections.map(async (col) => {
      try {
        const snap = await getDocs(collection(db, `${path}/${col.fb}`));
        const data = snap.docs.map(d => d.data());
        localStorage.setItem(`pplus_${user.uid}_${col.k}`, JSON.stringify(data));
      } catch (err: any) {
        if (err.code !== 'permission-denied' && !err.message?.includes('Missing or insufficient permissions')) {
          console.error(`Erro ao sincronizar coleção ${col.k}:`, err);
        }
      }
    });

    const settingsTask = getDoc(doc(db, `${path}/settings`, 'global'))
      .then(settingsSnap => {
        if (settingsSnap.exists()) {
          localStorage.setItem(`pplus_${user.uid}_settings`, JSON.stringify(settingsSnap.data()));
        }
      })
      .catch((err: any) => {
        if (err.code !== 'permission-denied' && !err.message?.includes('Missing or insufficient permissions')) {
          console.error(`Erro ao sincronizar configurações:`, err);
        }
      });

    await Promise.all([...syncTasks, settingsTask]);
  },

  getSystemConfig: async (): Promise<SystemConfig> => {
    try {
      const configSnap = await getDoc(doc(db, 'system', 'config'));
      if (configSnap.exists()) {
        return { ...DEFAULT_SYSTEM_CONFIG, ...configSnap.data() } as SystemConfig;
      }
    } catch (e: any) {
      // Silencia erros de permissão comuns em ambientes públicos/convidados
      if (e.code !== 'permission-denied' && !e.message?.includes('Missing or insufficient permissions')) {
        console.error("Erro ao obter config do sistema:", e);
      }
    }
    return DEFAULT_SYSTEM_CONFIG;
  },

  saveSystemConfig: async (config: SystemConfig) => {
    await setDoc(doc(db, 'system', 'config'), config);
  },

  getPayables: (): PayableAccount[] => {
    const data = localStorage.getItem(storage.getLocalKey('payables'));
    return data ? JSON.parse(data) : [];
  },

  savePayable: (p: PayableAccount) => {
    const payables = storage.getPayables();
    const idx = payables.findIndex(item => item.id === p.id);
    if (idx >= 0) payables[idx] = p; else payables.push(p);
    localStorage.setItem(storage.getLocalKey('payables'), JSON.stringify(payables));
    syncToFirebase('payables', p.id, p);
  },

  deletePayable: (id: string) => {
    const payables = storage.getPayables().filter(p => p.id !== id);
    localStorage.setItem(storage.getLocalKey('payables'), JSON.stringify(payables));
    removeFromFirebase('payables', id);
  },

  getPublicData: async (tenantId: string) => {
    const path = `tenants/${tenantId}`;
    const productsSnap = await getDocs(collection(db, `${path}/products`));
    const products = productsSnap.docs.map(d => d.data() as Product);
    const settingsSnap = await getDoc(doc(db, `${path}/settings`, 'global'));
    const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : DEFAULT_SETTINGS;
    return { products, settings };
  },

  getLocalKey: (key: string) => `pplus_${auth.currentUser?.uid}_${key}`,

  getProducts: (): Product[] => {
    const data = localStorage.getItem(storage.getLocalKey('products'));
    return data ? JSON.parse(data) : [];
  },

  saveProduct: (product: Product) => {
    const products = storage.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) products[idx] = product; else products.push(product);
    localStorage.setItem(storage.getLocalKey('products'), JSON.stringify(products));
    syncToFirebase('products', product.id, product);
  },

  deleteProduct: (id: string) => {
    const products = storage.getProducts().filter(p => p.id !== id);
    localStorage.setItem(storage.getLocalKey('products'), JSON.stringify(products));
    removeFromFirebase('products', id);
  },

  getQuotations: (): Quotation[] => {
    const data = localStorage.getItem(storage.getLocalKey('quotations'));
    return data ? JSON.parse(data) : [];
  },

  saveQuotation: (q: Quotation) => {
    const qs = storage.getQuotations();
    const idx = qs.findIndex(item => item.id === q.id);
    if (idx >= 0) qs[idx] = q; else qs.unshift(q);
    localStorage.setItem(storage.getLocalKey('quotations'), JSON.stringify(qs));
    syncToFirebase('quotations', q.id, q);
  },

  deleteQuotation: (id: string) => {
    const qs = storage.getQuotations().filter(q => q.id !== id);
    localStorage.setItem(storage.getLocalKey('quotations'), JSON.stringify(qs));
    removeFromFirebase('quotations', id);
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(storage.getLocalKey('settings'));
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: (s: AppSettings) => {
    localStorage.setItem(storage.getLocalKey('settings'), JSON.stringify(s));
    syncToFirebase('settings', 'global', s);
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(storage.getLocalKey('customers'));
    return data ? JSON.parse(data) : [];
  },

  getProspects: (): Prospect[] => {
    const data = localStorage.getItem(storage.getLocalKey('prospects'));
    return data ? JSON.parse(data) : [];
  },

  saveProspect: (p: Prospect) => {
    const ps = storage.getProspects();
    const idx = ps.findIndex(item => item.id === p.id);
    if (idx >= 0) ps[idx] = p; else ps.push(p);
    localStorage.setItem(storage.getLocalKey('prospects'), JSON.stringify(ps));
    syncToFirebase('prospects', p.id, p);
  },

  savePublicProspect: async (tenantId: string, p: Prospect) => {
    try {
      const path = `tenants/${tenantId}`;
      await setDoc(doc(db, `${path}/prospects`, p.id), p);
    } catch (e) {
      console.error("Erro ao salvar prospecto público:", e);
    }
  },

  deleteProspect: (id: string) => {
    const ps = storage.getProspects().filter(p => p.id !== id);
    localStorage.setItem(storage.getLocalKey('prospects'), JSON.stringify(ps));
    removeFromFirebase('prospects', id);
  },

  savePublicQuotation: async (tenantId: string, q: Quotation) => {
    try {
      const path = `tenants/${tenantId}`;
      await setDoc(doc(db, `${path}/quotations`, q.id), q);
    } catch (e) {
      console.error("Erro ao salvar ordem pública:", e);
    }
  },

  getPublicClientOrders: async (tenantId: string, phone: string) => {
    try {
      const path = `tenants/${tenantId}`;
      const snap = await getDocs(collection(db, `${path}/quotations`));
      return snap.docs
        .map(d => d.data() as Quotation)
        .filter(q => q.customerContact.replace(/\D/g, '') === phone.replace(/\D/g, ''));
    } catch (e) {
      console.error("Erro ao buscar pedidos:", e);
      return [];
    }
  },

  getMessageTemplates: (): MessageTemplate[] => {
    const data = localStorage.getItem(storage.getLocalKey('message_templates'));
    return data ? JSON.parse(data) : [];
  },

  saveMessageTemplate: (m: MessageTemplate) => {
    const ms = storage.getMessageTemplates();
    const idx = ms.findIndex(item => item.id === m.id);
    if (idx >= 0) ms[idx] = m; else ms.push(m);
    localStorage.setItem(storage.getLocalKey('message_templates'), JSON.stringify(ms));
    syncToFirebase('message_templates', m.id, m);
  },

  deleteMessageTemplate: (id: string) => {
    const ms = storage.getMessageTemplates().filter(m => m.id !== id);
    localStorage.setItem(storage.getLocalKey('message_templates'), JSON.stringify(ms));
    removeFromFirebase('message_templates', id);
  },

  saveCustomer: (c: Customer) => {
    const cs = storage.getCustomers();
    const idx = cs.findIndex(item => item.id === c.id);
    if (idx >= 0) cs[idx] = c; else cs.push(c);
    localStorage.setItem(storage.getLocalKey('customers'), JSON.stringify(cs));
    syncToFirebase('customers', c.id, c);
  },

  deleteCustomer: (id: string) => {
    const cs = storage.getCustomers().filter(c => c.id !== id);
    localStorage.setItem(storage.getLocalKey('customers'), JSON.stringify(cs));
    removeFromFirebase('customers', id);
  },

  getStock: (): StockItem[] => {
    const data = localStorage.getItem(storage.getLocalKey('stock'));
    return data ? JSON.parse(data) : [];
  },

  saveStockItem: (item: StockItem) => {
    const stock = storage.getStock();
    const idx = stock.findIndex(s => s.id === item.id);
    if (idx >= 0) stock[idx] = item; else stock.push(item);
    localStorage.setItem(storage.getLocalKey('stock'), JSON.stringify(stock));
    syncToFirebase('stock', item.id, item);
  },

  deleteStockItem: (id: string) => {
    const stock = storage.getStock().filter(s => s.id !== id);
    localStorage.setItem(storage.getLocalKey('stock'), JSON.stringify(stock));
    removeFromFirebase('stock', id);
  },

  getCoupons: (): Coupon[] => {
    const data = localStorage.getItem(storage.getLocalKey('coupons'));
    return data ? JSON.parse(data) : [];
  },

  saveCoupon: (c: Coupon) => {
    const cs = storage.getCoupons();
    const idx = cs.findIndex(item => item.id === c.id);
    if (idx >= 0) cs[idx] = c; else cs.push(c);
    localStorage.setItem(storage.getLocalKey('coupons'), JSON.stringify(cs));
    syncToFirebase('coupons', c.id, c);
  },

  deleteCoupon: (id: string) => {
    const cs = storage.getCoupons().filter(c => c.id !== id);
    localStorage.setItem(storage.getLocalKey('coupons'), JSON.stringify(cs));
    removeFromFirebase('coupons', id);
  },

  getCustomFonts: (): CustomFont[] => {
    const data = localStorage.getItem(storage.getLocalKey('fonts'));
    return data ? JSON.parse(data) : [];
  },

  saveCustomFont: (f: CustomFont) => {
    const fs = storage.getCustomFonts();
    fs.push(f);
    localStorage.setItem(storage.getLocalKey('fonts'), JSON.stringify(fs));
    syncToFirebase('fonts', f.id, f);
  },

  deleteCustomFont: (id: string) => {
    const fs = storage.getCustomFonts().filter(f => f.id !== id);
    localStorage.setItem(storage.getLocalKey('fonts'), JSON.stringify(fs));
    removeFromFirebase('fonts', id);
  },

  getStockMovements: (): StockMovement[] => {
    const data = localStorage.getItem(storage.getLocalKey('movements'));
    return data ? JSON.parse(data) : [];
  },

  addStockMovement: (m: StockMovement) => {
    const ms = storage.getStockMovements();
    ms.unshift(m);
    localStorage.setItem(storage.getLocalKey('movements'), JSON.stringify(ms));
    syncToFirebase('stock_movements', m.id, m);
    
    const stock = storage.getStock();
    const item = stock.find(s => s.id === m.stockItemId);
    if (item) {
      if (m.type === 'IN') item.currentQuantity += m.quantity; else item.currentQuantity -= m.quantity;
      storage.saveStockItem(item);
    }
  }
};
