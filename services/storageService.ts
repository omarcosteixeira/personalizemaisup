
import { Product, Quotation, StockItem, StockMovement, AppSettings, Coupon, Customer, CustomFont, SystemConfig, PayableAccount, Prospect, MessageTemplate, CustomerReview } from '../types';
import { db, auth } from './firebaseService';
import { 
  collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, orderBy 
} from 'firebase/firestore';

export const slugify = (text: string): string => {
  if (!text) return 'loja';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '') || 'loja';
};

export const INITIAL_SEED_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-seed-1',
    orderId: 'PED-1024',
    customerName: 'Mariana Souza',
    customerPhone: '(11) 98765-4321',
    rating: 5,
    message: 'Super recomendo! O banner e os personalizados da festa da minha filha ficaram impecáveis, com cores vivas e entrega super rápida!',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    approvedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'rev-seed-2',
    orderId: 'PED-1025',
    customerName: 'Lucas Ferreira',
    customerPhone: '(11) 99887-1122',
    rating: 5,
    message: 'Excelente qualidade na impressão das lonas e no adesivo automotivo. O corte veio no milímetro certo. Atendimento nota 10!',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    approvedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'rev-seed-3',
    orderId: 'PED-1026',
    customerName: 'Ariane Lima',
    customerPhone: '(21) 97654-3210',
    rating: 5,
    message: 'Os rótulos para nossos brindes corporativos ficaram maravilhosos! Nossos clientes elogiaram bastante o acabamento. Parabéns!',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    approvedAt: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

export const DEFAULT_PRODUCT_CATEGORIES: string[] = [
  'Produto Digital',
  'Banners & Lonas',
  'Adesivos & Rótulos',
  'Placas & Sinalização',
  'Brindes & Personalizados',
  'Papelaria Corporativa',
  'Camisetas & Vestuário',
  'Impressão Digital',
  'Cartões de Visita',
  'Panfletos & Folders',
  'Geral'
];

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Ateliê Ariane Artes',
  slug: 'ateliearianeartes',
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
  },
  productCategories: DEFAULT_PRODUCT_CATEGORIES
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

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
};

const syncToFirebase = async (col: string, id: string, data: any) => {
  try {
    const path = getTenantPath();
    const cleanData = sanitizeForFirestore(data);
    await setDoc(doc(db, `${path}/${col}`, id), cleanData);
  } catch (e: any) { 
    if (e.code !== 'permission-denied' && !e.message?.includes('Missing or insufficient permissions')) {
      console.error(`Erro ao sincronizar ${col}/${id} no Firebase:`, e); 
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
      { k: 'message_templates', fb: 'message_templates' },
      { k: 'reviews', fb: 'reviews' }
    ];

    const syncTasks = collections.map(async (col) => {
      try {
        const snap = await getDocs(collection(db, `${path}/${col.fb}`));
        const remoteData = snap.docs.map(d => d.data());
        
        const localKey = `pplus_${user.uid}_${col.k}`;
        const localRaw = localStorage.getItem(localKey);
        let localData: any[] = [];
        try { localData = localRaw ? JSON.parse(localRaw) : []; } catch (e) {}

        const mergedMap = new Map<string, any>();
        if (Array.isArray(localData)) {
          localData.forEach(item => {
            if (item && item.id) mergedMap.set(item.id, item);
          });
        }
        if (Array.isArray(remoteData)) {
          remoteData.forEach(item => {
            if (item && item.id) mergedMap.set(item.id, item);
          });
        }
        const finalData = Array.from(mergedMap.values());
        localStorage.setItem(localKey, JSON.stringify(finalData));

        if (col.k === 'reviews') {
          localStorage.setItem(`pplus_${user.uid}_reviews_initialized`, 'true');
        }

        // Se haviam itens locais ainda não gravados no Firestore, sobe para a nuvem
        if (Array.isArray(localData)) {
          const remoteIds = new Set(remoteData.map(d => d.id));
          for (const item of localData) {
            if (item && item.id && !remoteIds.has(item.id)) {
              syncToFirebase(col.fb, item.id, item);
            }
          }
        }
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

  getPublicData: async (storeIdentifier: string) => {
    let tenantId = storeIdentifier;
    // Check if storeIdentifier is a registered slug in Firestore
    try {
      const slugDoc = await getDoc(doc(db, 'slugs', storeIdentifier));
      if (slugDoc.exists() && slugDoc.data()?.tenantId) {
        tenantId = slugDoc.data().tenantId;
      }
    } catch (e) {}

    try {
      const path = `tenants/${tenantId}`;
      const productsSnap = await getDocs(collection(db, `${path}/products`));
      const products = productsSnap.docs.map(d => d.data() as Product);
      const settingsSnap = await getDoc(doc(db, `${path}/settings`, 'global'));
      const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : DEFAULT_SETTINGS;
      if (products.length > 0 || settingsSnap.exists()) {
        return { products, settings, tenantId };
      }
    } catch (e) {
      // Offline / permission fallback
    }

    // LocalStorage fallback for current tenant or saved slug
    const localSettings = storage.getSettings();
    const currentSlug = localSettings.slug || slugify(localSettings.businessName);
    if (
      storeIdentifier === currentSlug ||
      storeIdentifier === 'ateliearianeartes' ||
      storeIdentifier === auth.currentUser?.uid ||
      storeIdentifier === 'default'
    ) {
      return {
        products: storage.getProducts(),
        settings: localSettings,
        tenantId: auth.currentUser?.uid || 'default'
      };
    }

    return { products: storage.getProducts(), settings: localSettings, tenantId };
  },

  getLocalKey: (key: string) => {
    let uid = auth.currentUser?.uid;
    if (uid) {
      try { localStorage.setItem('pplus_active_uid', uid); } catch (e) {}
    } else {
      try { uid = localStorage.getItem('pplus_active_uid') || undefined; } catch (e) {}
    }
    return `pplus_${uid || 'default'}_${key}`;
  },

  getProducts: (): Product[] => {
    const mainKey = storage.getLocalKey('products');
    let data = localStorage.getItem(mainKey);
    if (!data) {
      const fallback = localStorage.getItem('pplus_undefined_products') || localStorage.getItem('pplus_default_products') || localStorage.getItem('products');
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(mainKey, fallback);
            data = fallback;
          }
        } catch (e) {}
      }
    }
    return data ? JSON.parse(data) : [];
  },

  saveProduct: (product: Product) => {
    try {
      const products = storage.getProducts();
      const idx = products.findIndex(p => p.id === product.id);
      if (idx >= 0) products[idx] = product; else products.push(product);
      localStorage.setItem(storage.getLocalKey('products'), JSON.stringify(products));
      syncToFirebase('products', product.id, product);
    } catch (e) {
      console.error("Erro ao salvar produto no storage:", e);
      throw e;
    }
  },

  deleteProduct: (id: string) => {
    const products = storage.getProducts().filter(p => p.id !== id);
    localStorage.setItem(storage.getLocalKey('products'), JSON.stringify(products));
    removeFromFirebase('products', id);
  },

  getQuotations: (): Quotation[] => {
    const mainKey = storage.getLocalKey('quotations');
    let data = localStorage.getItem(mainKey);
    if (!data) {
      const fallback = localStorage.getItem('pplus_undefined_quotations') || localStorage.getItem('pplus_default_quotations') || localStorage.getItem('quotations');
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(mainKey, fallback);
            data = fallback;
          }
        } catch (e) {}
      }
    }
    return data ? JSON.parse(data) : [];
  },

  saveQuotation: (q: Quotation) => {
    try {
      const qs = storage.getQuotations();
      const idx = qs.findIndex(item => item.id === q.id);
      if (idx >= 0) qs[idx] = q; else qs.unshift(q);
      localStorage.setItem(storage.getLocalKey('quotations'), JSON.stringify(qs));
      syncToFirebase('quotations', q.id, q);
    } catch (e) {
      console.error("Erro ao salvar pedido no storage:", e);
      throw e;
    }
  },

  deleteQuotation: (id: string) => {
    const qs = storage.getQuotations().filter(q => q.id !== id);
    localStorage.setItem(storage.getLocalKey('quotations'), JSON.stringify(qs));
    removeFromFirebase('quotations', id);
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(storage.getLocalKey('settings'));
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          slug: parsed.slug || slugify(parsed.businessName || DEFAULT_SETTINGS.businessName)
        };
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings: (s: AppSettings) => {
    const slug = s.slug ? slugify(s.slug) : slugify(s.businessName || DEFAULT_SETTINGS.businessName);
    const updated = { ...s, slug };
    localStorage.setItem(storage.getLocalKey('settings'), JSON.stringify(updated));
    syncToFirebase('settings', 'global', updated);

    // Save slug in global collection for easy reverse-lookup by slug
    const user = auth.currentUser;
    if (user && slug) {
      setDoc(doc(db, 'slugs', slug), {
        tenantId: user.uid,
        slug: slug,
        businessName: updated.businessName,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }
  },

  getProductCategories: (): string[] => {
    const settings = storage.getSettings();
    let savedCats: string[] = settings.productCategories || [];

    const localKey = storage.getLocalKey('product_categories');
    const localData = localStorage.getItem(localKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedCats = Array.from(new Set([...savedCats, ...parsed]));
        }
      } catch (e) {}
    }

    // Aproveitar as categorias já criadas nos produtos do sistema
    const products = storage.getProducts();
    const productCategories = products
      .map(p => p.category?.trim())
      .filter(Boolean) as string[];

    const combined = Array.from(
      new Set([
        'Produto Digital',
        ...DEFAULT_PRODUCT_CATEGORIES,
        ...savedCats,
        ...productCategories
      ])
    ).filter(c => c && c.trim().length > 0);

    return combined.length > 0 ? combined : DEFAULT_PRODUCT_CATEGORIES;
  },

  saveProductCategories: (categories: string[]) => {
    const clean = Array.from(new Set(categories.map(c => c.trim()).filter(Boolean)));
    localStorage.setItem(storage.getLocalKey('product_categories'), JSON.stringify(clean));
    const settings = storage.getSettings();
    const updated = { ...settings, productCategories: clean };
    storage.saveSettings(updated);
  },

  saveProductCategory: (categoryName: string) => {
    const name = categoryName.trim();
    if (!name) return;
    const current = storage.getProductCategories();
    if (!current.some(c => c.toLowerCase() === name.toLowerCase())) {
      storage.saveProductCategories([...current, name]);
    }
  },

  deleteProductCategory: (categoryName: string) => {
    const current = storage.getProductCategories();
    const filtered = current.filter(c => c.toLowerCase() !== categoryName.toLowerCase());
    storage.saveProductCategories(filtered);
  },

  renameProductCategory: (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanOld || !cleanNew || cleanOld.toLowerCase() === cleanNew.toLowerCase()) return;
    
    const current = storage.getProductCategories();
    const updatedCats = current.map(c => (c.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : c));
    storage.saveProductCategories(updatedCats);

    const products = storage.getProducts();
    let hasProductChanges = false;
    products.forEach(p => {
      if (p.category && p.category.toLowerCase() === cleanOld.toLowerCase()) {
        p.category = cleanNew;
        hasProductChanges = true;
      }
    });
    if (hasProductChanges) {
      localStorage.setItem(storage.getLocalKey('products'), JSON.stringify(products));
      products.forEach(p => {
        if (p.category === cleanNew) {
          syncToFirebase('products', p.id, p);
        }
      });
    }
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
  },

  getReviews: (): CustomerReview[] => {
    const key = storage.getLocalKey('reviews');
    const initKey = storage.getLocalKey('reviews_initialized');
    const data = localStorage.getItem(key);
    if (data !== null) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    // If it was previously marked as initialized, return empty array
    if (localStorage.getItem(initKey) === 'true') {
      return [];
    }
    // Seed initial reviews if none exist yet on brand new setup
    localStorage.setItem(initKey, 'true');
    localStorage.setItem(key, JSON.stringify(INITIAL_SEED_REVIEWS));
    return INITIAL_SEED_REVIEWS;
  },

  saveReview: (rev: CustomerReview) => {
    const revs = storage.getReviews();
    const idx = revs.findIndex(r => r.id === rev.id);
    if (idx >= 0) revs[idx] = rev; else revs.unshift(rev);
    localStorage.setItem(storage.getLocalKey('reviews'), JSON.stringify(revs));
    localStorage.setItem(storage.getLocalKey('reviews_initialized'), 'true');
    syncToFirebase('reviews', rev.id, rev);
  },

  updateReviewStatus: (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    const revs = storage.getReviews();
    const target = revs.find(r => r.id === id);
    if (target) {
      target.status = status;
      if (status === 'APPROVED') {
        target.approvedAt = new Date().toISOString();
      }
      localStorage.setItem(storage.getLocalKey('reviews'), JSON.stringify(revs));
      localStorage.setItem(storage.getLocalKey('reviews_initialized'), 'true');
      syncToFirebase('reviews', target.id, target);
    }
  },

  deleteReview: (id: string) => {
    const key = storage.getLocalKey('reviews');
    const initKey = storage.getLocalKey('reviews_initialized');
    localStorage.setItem(initKey, 'true');
    const current = storage.getReviews();
    const revs = current.filter(r => r.id !== id);
    localStorage.setItem(key, JSON.stringify(revs));
    removeFromFirebase('reviews', id);
  },

  deleteAllReviews: () => {
    const key = storage.getLocalKey('reviews');
    const initKey = storage.getLocalKey('reviews_initialized');
    const current = storage.getReviews();
    localStorage.setItem(initKey, 'true');
    localStorage.setItem(key, JSON.stringify([]));
    current.forEach(r => removeFromFirebase('reviews', r.id));
  },

  savePublicReview: async (tenantId: string, rev: CustomerReview) => {
    try {
      const path = `tenants/${tenantId}`;
      await setDoc(doc(db, `${path}/reviews`, rev.id), rev);
    } catch (e) {
      console.error("Erro ao salvar avaliação pública:", e);
    }
    // Also save in local storage for fallback / offline
    const localKey = `pplus_${tenantId}_reviews`;
    const existing = localStorage.getItem(localKey);
    let list: CustomerReview[] = existing ? JSON.parse(existing) : [];
    const idx = list.findIndex(r => r.id === rev.id);
    if (idx >= 0) list[idx] = rev; else list.unshift(rev);
    localStorage.setItem(localKey, JSON.stringify(list));
    localStorage.setItem(`pplus_${tenantId}_reviews_initialized`, 'true');

    // Also update current tenant's local reviews if current tenant is matching
    if (tenantId === auth.currentUser?.uid || tenantId === 'default') {
      const myRevs = storage.getReviews();
      const myIdx = myRevs.findIndex(r => r.id === rev.id);
      if (myIdx >= 0) myRevs[myIdx] = rev; else myRevs.unshift(rev);
      localStorage.setItem(storage.getLocalKey('reviews'), JSON.stringify(myRevs));
      localStorage.setItem(storage.getLocalKey('reviews_initialized'), 'true');
    }
  },

  getPublicReviews: async (tenantId?: string): Promise<CustomerReview[]> => {
    if (!tenantId || tenantId === 'default' || tenantId === auth.currentUser?.uid) {
      const all = storage.getReviews();
      return all.filter(r => r.status === 'APPROVED');
    }
    try {
      const path = `tenants/${tenantId}`;
      const snap = await getDocs(collection(db, `${path}/reviews`));
      if (!snap.empty) {
        const remote = snap.docs.map(d => d.data() as CustomerReview);
        return remote.filter(r => r.status === 'APPROVED');
      } else {
        return [];
      }
    } catch (e) {}

    const localKey = `pplus_${tenantId}_reviews`;
    const local = localStorage.getItem(localKey);
    if (local !== null) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: CustomerReview) => r.status === 'APPROVED');
        }
      } catch (e) {}
    }

    const initKey = `pplus_${tenantId}_reviews_initialized`;
    if (localStorage.getItem(initKey) === 'true') {
      return [];
    }

    return INITIAL_SEED_REVIEWS.filter(r => r.status === 'APPROVED');
  }
};
