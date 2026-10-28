
import React, { useState, useEffect } from 'react';
import { 
  Plus, History, Package, LayoutDashboard, Printer, Box, ExternalLink, 
  ChevronLeft, Settings, Ticket, Users, Calculator, Layers, FileSpreadsheet, 
  Type, ShoppingCart, Menu, LogOut, ShieldCheck, X, MoreHorizontal, Copy,
  Sparkles, Wallet, Megaphone, Star, Link2, Check
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebaseService';
import { storage, slugify } from './services/storageService';
import { Product, Quotation, StockItem, AppSettings } from './types';

// Components
import NewQuotation from './components/NewQuotation';
import ProductCatalog from './components/ProductCatalog';
import QuotationHistory from './components/QuotationHistory';
import StockManagement from './components/StockManagement';
import Storefront from './components/Storefront';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import CouponsPage from './components/CouponsPage';
import CustomerManagement from './components/CustomerManagement';
import PricingCalculator from './components/PricingCalculator';
import SheetCalculator from './components/SheetCalculator';
import FontTester from './components/FontTester';
import PDV from './components/PDV';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import PromotionalAI from './components/PromotionalAI';
import LandingPage from './components/LandingPage';
import AccountsPayable from './components/AccountsPayable';
import ProspectsPage from './components/ProspectsPage';
import ReviewsManagement from './components/ReviewsManagement';

type Tab = 'dashboard' | 'new' | 'history' | 'products' | 'store' | 'settings' | 'coupons' | 'customers' | 'fonts' | 'pdv' | 'admin' | 'finance' | 'prospects' | 'reviews';

// Helper para detectar acesso público à loja via slug na URL ou query param
// Ex: personalizemais.vercel.app/ateliearianeartes ou ?store=... ou #/ateliearianeartes
const getPublicStoreSlugOrId = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('store') || params.get('loja');
  if (fromQuery) return fromQuery;

  // Checa hash route (ex: #/ateliearianeartes ou #ateliearianeartes)
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const hashClean = rawHash.replace(/^loja\//, '');
    const knownInternal = ['dashboard', 'new', 'history', 'products', 'settings', 'admin', 'reviews', 'coupons', 'customers', 'finance', 'pdv', 'prospects', 'fonts'];
    if (hashClean && !knownInternal.includes(hashClean)) {
      return hashClean;
    }
  }

  // Checa pathname (ex: /ateliearianeartes)
  const pathClean = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  const knownPaths = ['', 'index.html', 'api', 'assets', 'login', 'admin'];
  if (pathClean && !knownPaths.includes(pathClean)) {
    return pathClean;
  }

  return null;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [productSubTab, setProductSubTab] = useState<'catalog' | 'pricing' | 'stock' | 'sheet'>('catalog');
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<'GUEST' | 'PENDING' | 'EXPIRED' | 'APPROVED'>('GUEST');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  
  // Estado para duplicação ou edição de orçamento
  const [duplicateTarget, setDuplicateTarget] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Estados para a Loja Pública (Inicialização Preguiçosa para evitar flash da Landing Page)
  const [isPublicStore, setIsPublicStore] = useState(() => {
    return !!getPublicStoreSlugOrId();
  });
  const [publicData, setPublicData] = useState<{ products: Product[], settings: AppSettings, tenantId?: string } | null>(null);

  useEffect(() => {
    // Checa se é um acesso público à loja via slug ou query param
    const storeIdentifier = getPublicStoreSlugOrId();
    
    if (storeIdentifier) {
      storage.getPublicData(storeIdentifier).then(data => {
        setPublicData(data);
        setIsSyncing(false);
      }).catch(err => {
        console.error("Erro ao carregar loja pública", err);
        setIsSyncing(false);
      });
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(!!data.isAdmin);
          
          if (!data.isApproved) {
            setUserStatus('PENDING');
          } else if (data.expiresAt !== 'NEVER' && new Date(data.expiresAt) < new Date()) {
            setUserStatus('EXPIRED');
          } else {
            setUserStatus('APPROVED');
            
            // ESTRATÉGIA CACHE-FIRST:
            setProducts(storage.getProducts());
            setQuotations(storage.getQuotations());
            setStock(storage.getStock());

            setIsSyncing(true);
            storage.initSync().then(() => {
              setProducts(storage.getProducts());
              setQuotations(storage.getQuotations());
              setStock(storage.getStock());
              setIsSyncing(false);
            }).catch(err => {
              console.error("Erro na sincronização:", err);
              setIsSyncing(false);
            });
          }
        }
      } else {
        setUser(null);
        setUserStatus('GUEST');
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  const refreshData = () => {
    if (userStatus === 'APPROVED') {
      setProducts(storage.getProducts());
      setQuotations(storage.getQuotations());
      setStock(storage.getStock());
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserStatus('GUEST');
      setUser(null);
      setProducts([]);
      setQuotations([]);
      setStock([]);
      setShowLogin(false);
    });
  };

  // 1. Loading State para Loja Pública
  if (isPublicStore && !publicData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Carregando Loja...</p>
      </div>
    );
  }

  // 2. Renderização da Loja Pública Carregada
  if (isPublicStore && publicData) {
    const storeIdentifier = getPublicStoreSlugOrId();
    return <Storefront products={publicData.products} settings={publicData.settings} tenantId={publicData.tenantId || storeIdentifier || undefined} />;
  }

  // 3. Landing Page para Visitantes (não loja pública)
  if (userStatus === 'GUEST' && !showLogin) {
    return <LandingPage onStart={() => setShowLogin(true)} />;
  }

  // 4. Login para Usuários não aprovados/expirados ou clicando em Login
  if (userStatus !== 'APPROVED' && !isPublicStore) {
    return <LoginPage userStatus={userStatus} onAuthChange={() => {}} />;
  }

  // 5. Preview da Loja (Logado)
  if (activeTab === 'store') {
    return (
      <div className="relative h-screen overflow-hidden">
        <button onClick={() => setActiveTab('dashboard')} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0">
          <ChevronLeft className="w-6 h-6" /> Voltar ao Painel
        </button>
        <div className="h-full overflow-y-auto">
          <Storefront products={products} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard quotations={quotations} stock={stock} onNavigateToNew={() => setActiveTab('new')} />;
      case 'pdv': return <PDV products={products} onSaleComplete={refreshData} />;
      case 'new': return <NewQuotation 
        products={products} 
        initialData={editingQuotation || duplicateTarget} 
        isEditing={!!editingQuotation}
        onSave={() => { refreshData(); setDuplicateTarget(null); setEditingQuotation(null); }} 
        onNavigateToHistory={() => setActiveTab('history')} 
      />;
      case 'history': return <QuotationHistory 
        quotations={quotations} 
        onDuplicate={(q) => { setDuplicateTarget(q); setEditingQuotation(null); setActiveTab('new'); }} 
        onEdit={(q) => { setEditingQuotation(q); setDuplicateTarget(null); setActiveTab('new'); }}
        onUpdate={refreshData}
      />;
      case 'reviews': return <ReviewsManagement onReviewsUpdated={refreshData} />;
      case 'customers': return <CustomerManagement />;
      case 'admin': return <AdminPanel />;
      case 'finance': return <AccountsPayable />;
      case 'products':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full overflow-x-auto no-scrollbar scroll-smooth">
              {[
                {id:'catalog',l:'Catálogo',i:Package},
                {id:'pricing',l:'Precificação',i:Calculator},
                {id:'sheet',l:'Folhas',i:FileSpreadsheet},
                {id:'stock',l:'Estoque',i:Box},
              ].map(sub => (
                <button key={sub.id} onClick={() => setProductSubTab(sub.id as any)} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${productSubTab === sub.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                  <sub.i className="w-4 h-4" /> {sub.l}
                </button>
              ))}
            </div>
            {productSubTab === 'catalog' && <ProductCatalog products={products} onUpdate={refreshData} />}
            {productSubTab === 'pricing' && <PricingCalculator products={products} onProductCreated={refreshData} />}
            {productSubTab === 'stock' && <StockManagement products={products} onUpdate={refreshData} />}
            {productSubTab === 'sheet' && <SheetCalculator />}
          </div>
        );
      case 'prospects': return <ProspectsPage />;
      case 'fonts': return <FontTester />;
      case 'coupons': return <CouponsPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard quotations={quotations} stock={stock} onNavigateToNew={() => setActiveTab('new')} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'new', label: 'Novo', icon: Plus },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'history', label: 'Pedidos', icon: History },
    { id: 'reviews', label: 'Avaliações', icon: Star },
    { id: 'finance', label: 'Financeiro', icon: Wallet },
    { id: 'products', label: 'Produtos', icon: Layers },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'prospects', label: 'Prospectos', icon: Megaphone },
    { id: 'fonts', label: 'Fontes', icon: Type },
    { id: 'coupons', label: 'Cupons', icon: Ticket },
    { id: 'settings', label: 'Ajustes', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const mainNav = navItems.slice(0, 4);
  const moreNav = navItems.slice(4);
  const appSettings = storage.getSettings();
  const storeSlug = appSettings.slug || slugify(appSettings.businessName || 'ateliearianeartes');
  const storeVanityUrl = `personalizemais.vercel.app/${storeSlug}`;
  const storeDirectUrl = `${window.location.origin}/${storeSlug}`;

  const handleCopyStoreLink = () => {
    navigator.clipboard.writeText(storeDirectUrl);
    setCopiedStoreLink(true);
    setTimeout(() => setCopiedStoreLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 lg:flex-row overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-indigo-900 text-white flex-col shadow-xl shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg"><Printer className="w-6 h-6 text-indigo-900" /></div>
          <span className="text-xl font-bold">Personalize +</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setEditingQuotation(null); setDuplicateTarget(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-50 text-indigo-900 shadow-lg font-bold' : 'text-indigo-100 hover:bg-indigo-800'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}

          {/* Card Link da Loja (Site + Nome Fantasia) */}
          <div className="mx-1 my-3 p-3 bg-indigo-950/70 rounded-2xl border border-indigo-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Link2 className="w-3 h-3 text-indigo-400" /> Link da Loja
              </span>
              <button 
                onClick={handleCopyStoreLink} 
                className="text-[9px] font-black text-indigo-300 hover:text-white uppercase flex items-center gap-1 transition-colors"
                title="Copiar Link da Loja"
              >
                {copiedStoreLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedStoreLink ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-[10px] font-mono text-indigo-200 font-bold truncate">
              {storeVanityUrl}
            </p>
          </div>

          <div className="pt-4 pb-2 px-4 border-t border-indigo-800/50 mt-2">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Atalhos Externos</p>
          </div>
          <button onClick={() => setActiveTab('store')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-300 hover:bg-indigo-800 transition-colors">
            <ExternalLink className="w-5 h-5" /> Ver Minha Loja
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-indigo-800 mt-auto transition-colors">
            <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
          <div className="flex items-center gap-2 lg:hidden">
            <Printer className="w-6 h-6 text-indigo-900" />
            <h1 className="font-black text-indigo-900 text-sm">Personalize +</h1>
          </div>
          <h2 className="hidden lg:block text-lg font-bold text-slate-800 capitalize">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-3">
            {/* Link de Acesso da Loja no Topo */}
            <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs">
              <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono text-indigo-900 font-bold text-[11px]">{storeVanityUrl}</span>
              <button 
                onClick={handleCopyStoreLink}
                className="p-1 hover:bg-white rounded-lg text-indigo-600 font-bold transition-all ml-1 flex items-center gap-1 text-[10px]"
                title="Copiar Link da Loja"
              >
                {copiedStoreLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStoreLink ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Usuário Conectado</span>
              <span className="text-[11px] font-black text-slate-700 truncate max-w-[150px]">{user?.email}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-sm shadow-black/10`}></div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 bg-slate-50/50">
          {renderContent()}
        </section>

        {/* Bottom Nav Mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-18 bg-white border-t border-slate-200 text-slate-400 flex items-center justify-around px-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {mainNav.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); setEditingQuotation(null); setDuplicateTarget(null); }} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 transition-all ${activeTab === item.id ? 'text-indigo-600' : 'opacity-60'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-tight`}>{item.label}</span>
              {activeTab === item.id && <div className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5"></div>}
            </button>
          ))}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 transition-all ${isMenuOpen ? 'text-indigo-600' : 'opacity-60'}`}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Mais</span>
          </button>
        </nav>

        {/* Mobile Fullscreen Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800">Menu Principal</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X className="w-6 h-6"/></button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                {moreNav.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }} 
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase text-center">{item.label}</span>
                  </button>
                ))}
                <button 
                  onClick={() => { setActiveTab('store'); setIsMenuOpen(false); }} 
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase text-center">Ver Loja</span>
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sair da Minha Conta
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
