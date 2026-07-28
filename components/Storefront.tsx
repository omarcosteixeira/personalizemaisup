
import React, { useState, useEffect } from 'react';
import { Product, PricingMode, AppSettings, SidebarBanner, Quotation } from '../types';
import { storage } from '../services/storageService';
import { 
  ShoppingCart, 
  MessageCircle, 
  Search, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Facebook, 
  Globe,
  Tag,
  ArrowRight,
  X,
  Info,
  Layers,
  Clock,
  ArrowUpRight,
  Music,
  User,
  ListOrdered,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  products: Product[];
  settings?: AppSettings;
  tenantId?: string;
}

const Storefront: React.FC<Props> = ({ products, settings: propSettings, tenantId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoName, setPromoName] = useState('');
  const [promoPhone, setPromoPhone] = useState('');
  const [promoEmail, setPromoEmail] = useState('');
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  
  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ name: '', phone: '' });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Order Tracking
  const [showOrders, setShowOrders] = useState(false);
  const [trackerPhone, setTrackerPhone] = useState('');
  const [clientOrders, setClientOrders] = useState<Quotation[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  const localSettings = storage.getSettings();
  const settings = propSettings || localSettings;

  // Filter out hidden products first
  const visibleProducts = products.filter(p => !p.hiddenInStore);

  const categories = ['Todos', ...Array.from(new Set(visibleProducts.map(p => p.category)))];
  const highlightedProducts = visibleProducts.filter(p => p.isHighlighted);

  const filtered = visibleProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (settings.banners && settings.banners.length > 1) {
      const timer = setInterval(() => {
        nextBanner();
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [settings.banners, currentBanner]);

  const nextBanner = () => {
    if (!settings.banners || settings.banners.length === 0) return;
    setCurrentBanner(prev => (prev + 1) % settings.banners.length);
  };

  const prevBanner = () => {
    if (!settings.banners || settings.banners.length === 0) return;
    setCurrentBanner(prev => (prev - 1 + settings.banners.length) % settings.banners.length);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSelectedProduct(null);
    setShowCart(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.name || !checkoutData.phone || cart.length === 0) return;
    setIsCheckingOut(true);

    const quotation: Quotation = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: checkoutData.name,
      customerContact: checkoutData.phone,
      items: cart.map(c => ({
        product: c.product,
        quantity: c.quantity,
        unitPrice: c.product.price,
        totalPrice: c.product.price * c.quantity
      })),
      subtotal: cartTotal,
      discountValue: 0,
      discountType: 'FIXED',
      shippingValue: 0,
      total: cartTotal,
      createdAt: new Date().toISOString(),
      status: 'AWAITING_PAYMENT'
    };

    if (tenantId) {
      await storage.savePublicQuotation(tenantId, quotation);
    } else {
      storage.saveQuotation(quotation);
    }

    setCart([]);
    setShowCheckout(false);
    setIsCheckingOut(false);
    
    // Redirect track orders directly
    setTrackerPhone(checkoutData.phone);
    setShowOrders(true);
    fetchOrders(checkoutData.phone);
    
    // Also notify the store owner via Whatsapp directly?
    // Let's just create the order. The admin panel sees it.
  };

  const fetchOrders = async (phone: string) => {
    if (!phone) return;
    setIsFetchingOrders(true);
    if (tenantId) {
      const orders = await storage.getPublicClientOrders(tenantId, phone);
      setClientOrders(orders);
    }
    setIsFetchingOrders(false);
  };

  const handleCustomQuote = () => {
    const phone = settings.phone.replace(/\D/g, '');
    const message = `Olá! Não achei o produto que eu queria na loja online da ${settings.businessName}, gostaria de solicitar um orçamento personalizado por aqui.`;
    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePromoSubmit = async () => {
    if (!promoName || !promoPhone) return alert("Preencha nome e WhatsApp.");
    setIsSubmittingPromo(true);
    const p = {
      id: Math.random().toString(36).substr(2, 9),
      name: promoName,
      phone: promoPhone,
      email: promoEmail,
      createdAt: new Date().toISOString()
    };
    if (tenantId) {
      await storage.savePublicProspect(tenantId, p);
    } else {
      // preview environment
      storage.saveProspect(p);
    }
    setIsSubmittingPromo(false);
    setShowPromoModal(false);
    alert("Inscrição efetuada com sucesso!");
    setPromoName(''); setPromoPhone(''); setPromoEmail('');
  };

  const primaryColor = settings.theme.primaryColor;
  const secondaryColor = settings.theme.secondaryColor;
  const layout = settings.theme.storeLayout;

  const cardRadius = layout === 'modern' ? 'rounded-[48px]' : layout === 'minimal' ? 'rounded-2xl' : 'rounded-none';
  const imgRadius = layout === 'modern' ? 'rounded-[40px]' : layout === 'minimal' ? 'rounded-xl' : 'rounded-none';

  return (
    <div className={`min-h-screen font-sans text-slate-900 pb-0 ${layout === 'bold' ? 'bg-slate-100' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="h-10 w-auto object-contain" />
          ) : (
            <div className={`p-2 rounded-xl shadow-lg`} style={{ backgroundColor: primaryColor, color: '#fff' }}><ShoppingCart className="w-6 h-6"/></div>
          )}
          <h1 className={`text-xl font-black tracking-tight hidden sm:block text-slate-800 ${layout === 'minimal' ? 'uppercase tracking-widest text-sm' : ''}`}>{settings.businessName}</h1>
        </div>
        
        <div className="relative flex-1 max-w-lg mx-6">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="O que você precisa hoje?" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className={`w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl outline-none transition-all border border-transparent focus:bg-white focus:border-indigo-200`} 
          />
        </div>

        <div className="flex items-center gap-4">
           {/* Botão Meus Pedidos */}
           <button 
            onClick={() => setShowOrders(true)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95"
           >
             <ListOrdered className="w-5 h-5"/> <span className="hidden sm:inline">Meus Pedidos</span>
           </button>
           
           {/* Botão Carrinho */}
           <button 
            onClick={() => setShowCart(true)} 
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 relative"
            style={{ backgroundColor: secondaryColor, color: '#fff' }}
           >
             <ShoppingCart className="w-5 h-5"/> <span className="hidden sm:inline">Carrinho</span>
             {cart.length > 0 && (
               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black border-2 border-white">
                 {cart.length}
               </span>
             )}
           </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Left Navigation */}
        <aside className="lg:w-64 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] p-6 bg-white border-r border-slate-200 hidden lg:block overflow-y-auto z-30">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Categorias</h3>
          <nav className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                  activeCategory === cat 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                style={activeCategory === cat ? { backgroundColor: primaryColor } : {}}
              >
                <span>{cat}</span>
                <ArrowRight className={`w-4 h-4 transition-transform ${activeCategory === cat ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
              </button>
            ))}
          </nav>

          <div className="mt-12 p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
             <h4 className="text-sm font-black text-slate-800 mb-2">Precisa de algo único?</h4>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">Se não encontrou no catálogo, nossa equipe pode criar do zero para você.</p>
             <button 
              onClick={handleCustomQuote}
              className="w-full py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-md transition-all hover:scale-105 mb-4"
              style={{ backgroundColor: secondaryColor }}
             >
               Solicitar Orçamento
             </button>

             <div className="w-full h-px bg-slate-200 my-4"></div>

             <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center justify-center gap-2">
               <Star className="w-4 h-4 text-emerald-500 fill-current" /> Receba Promoções
             </h4>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">Cadastre seu número e receba descontos exclusivos em primeira mão.</p>
             <button 
              onClick={() => setShowPromoModal(true)}
              className="w-full py-3 rounded-xl bg-slate-800 text-white text-xs font-black uppercase tracking-widest shadow-md transition-all hover:scale-105"
             >
               Cadastrar Agora
             </button>
          </div>
        </aside>

        {/* Mobile Category Menu (Horizontal Scroll) */}
        <div className="lg:hidden p-4 overflow-x-auto no-scrollbar flex gap-2 bg-white sticky top-[73px] z-30 border-b border-slate-100">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all border-2 ${activeCategory === cat ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}
              style={activeCategory === cat ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Banners */}
          {settings.banners && settings.banners.length > 0 && activeCategory === 'Todos' && !searchTerm && (
            <section className={`relative group ${layout === 'minimal' ? 'h-[400px]' : 'h-[300px] md:h-[450px]'} bg-slate-200 overflow-hidden`}>
              {settings.banners.map((b, i) => (
                <div 
                  key={i} 
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
                >
                  <img src={b} className="w-full h-full object-cover" alt={`Banner ${i + 1}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8 md:p-16">
                     <div className="max-w-3xl text-white space-y-4">
                        <span className="inline-block px-5 py-2 text-[10px] font-black uppercase rounded-full mb-2 tracking-[0.2em] shadow-xl" style={{ backgroundColor: primaryColor }}>Qualidade Gráfica Premium</span>
                        <h2 className={`text-3xl md:text-5xl font-black leading-none drop-shadow-2xl ${layout === 'minimal' ? 'uppercase' : ''}`}>
                          {layout === 'bold' ? 'A MELHOR IMPRESSÃO.' : 'Impressione com a melhor resolução.'}
                        </h2>
                     </div>
                  </div>
                </div>
              ))}
              {settings.banners.length > 1 && (
                <>
                  <button onClick={prevBanner} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={nextBanner} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </section>
          )}

          {/* Highlights */}
          {highlightedProducts.length > 0 && activeCategory === 'Todos' && !searchTerm && (
            <section className="py-12 px-6 max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-yellow-100 rounded-2xl">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-500" />
                </div>
                <h3 className={`text-2xl font-black text-slate-800 tracking-tight ${layout === 'minimal' ? 'uppercase' : ''}`}>Destaques Especiais</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {highlightedProducts.map(p => (
                  <div key={p.id} onClick={() => setSelectedProduct(p)} className={`group bg-white p-5 ${cardRadius} shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col`}>
                    <div className={`aspect-square ${imgRadius} overflow-hidden mb-6 bg-slate-50 relative shrink-0`}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={p.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Tag className="w-16 h-16" /></div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                        <Info className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                    </div>
                    <div className="px-3 flex-1 flex flex-col text-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block" style={{ color: primaryColor }}>{p.category}</span>
                      <h4 className="font-bold text-slate-800 text-xl line-clamp-1 mb-2">{p.name}</h4>
                      <p className="text-2xl font-black text-slate-900 mb-6">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</p>
                      <div className="mt-auto w-full py-4 text-white text-center rounded-3xl text-sm font-black transition-colors shadow-lg" style={{ backgroundColor: layout === 'bold' ? '#000' : primaryColor }}>Ver Detalhes</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Catalog */}
          <main className="py-12 px-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h3 className={`text-3xl font-black text-slate-800 tracking-tight ${layout === 'minimal' ? 'uppercase' : ''}`}>
                {activeCategory === 'Todos' ? 'Catálogo Completo' : activeCategory}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filtered.map(p => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className={`bg-white ${cardRadius} overflow-hidden border border-slate-100 hover:shadow-2xl group flex flex-col p-2 transition-all cursor-pointer`}>
                  <div className={`aspect-[4/3] overflow-hidden ${imgRadius} relative bg-slate-50 shrink-0`}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><Tag className="w-12 h-12" /></div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm text-[10px] font-black uppercase rounded-xl shadow-lg ring-1 ring-slate-100" style={{ color: primaryColor }}>{p.category}</span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="text-lg font-black text-slate-800 mb-3 leading-tight line-clamp-2">{p.name}</h4>
                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-50">
                       <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Valor Unitário</p>
                          <p className="text-xl font-black text-slate-900 tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                          </p>
                       </div>
                       <div className="p-3 text-white rounded-2xl transition-all shadow-lg" style={{ backgroundColor: primaryColor }}>
                        <ArrowRight className="w-5 h-5"/>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filtered.length === 0 && (
              <div className="p-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-sm">Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </main>
        </div>

        {/* Sidebar Right Ad Section */}
        {settings.showSidebarBanners && settings.sidebarBanners.length > 0 && (
          <aside className="lg:w-64 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] p-6 bg-slate-50 border-l border-slate-200 hidden xl:block overflow-y-auto z-30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Anúncios & Ofertas</h3>
            <div className="space-y-6">
              {settings.sidebarBanners.map((banner) => (
                <a 
                  key={banner.id} 
                  href={banner.link || '#'} 
                  target={banner.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="block group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <img src={banner.imageUrl} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ArrowUpRight className="text-white w-8 h-8" />
                  </div>
                </a>
              ))}
            </div>
            
            <div className="mt-12 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-relaxed">Publicidade</p>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="h-12 w-auto object-contain" />
            ) : (
              <div className="p-3 bg-indigo-900 rounded-xl text-white"><ShoppingCart className="w-6 h-6"/></div>
            )}
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{settings.businessName}</h2>
          </div>
          
          <p className="text-slate-500 text-sm max-w-lg mb-8 leading-relaxed">
            {settings.address}<br/>
            {settings.phone} | {settings.email}
          </p>

          <div className="flex gap-4 mb-10">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition-all">
                <Instagram className="w-6 h-6" />
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                <Facebook className="w-6 h-6" />
              </a>
            )}
            {settings.socialLinks.website && (
              <a href={settings.socialLinks.website} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                <Globe className="w-6 h-6" />
              </a>
            )}
            {settings.socialLinks.tiktokShop && (
              <a href={settings.socialLinks.tiktokShop} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                <Music className="w-6 h-6" />
              </a>
            )}
          </div>

          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} {settings.businessName} - Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden relative flex flex-col lg:flex-row animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-6 right-6 z-10 p-3 bg-white/80 hover:bg-white backdrop-blur-md rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Product Image Section */}
            <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center p-4 min-h-[300px] lg:min-h-0">
              {selectedProduct.imageUrl ? (
                <img 
                  src={selectedProduct.imageUrl} 
                  className="w-full h-full object-contain max-h-[70vh]" 
                  alt={selectedProduct.name} 
                />
              ) : (
                <div className="text-slate-200 flex flex-col items-center gap-4">
                  <Tag className="w-32 h-32" />
                  <p className="font-black text-[10px] uppercase tracking-widest">Imagem indisponível</p>
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto bg-white flex flex-col">
              <div className="mb-8">
                <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                  {selectedProduct.category}
                </span>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 leading-tight mb-4">
                  {selectedProduct.name}
                </h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-indigo-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.price)}
                  </p>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {selectedProduct.mode === PricingMode.AREA ? 'Por m²' : selectedProduct.mode === PricingMode.MILHEIRO ? 'Por Milheiro' : 'Por Unidade'}
                  </span>
                </div>
              </div>

              {/* Badges/Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                 {selectedProduct.productionTime && (
                   <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                     <Clock className="w-4 h-4" /> {selectedProduct.productionTime}
                   </div>
                 )}
                 {selectedProduct.hasSize && (
                   <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                     <Layers className="w-4 h-4" /> Tamanhos Disponíveis
                   </div>
                 )}
              </div>

              {/* Description Area */}
              <div className="flex-1 mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" /> Descrição Completa
                </h4>
                <div className="text-slate-600 text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
                  {selectedProduct.description || "Nenhuma descrição adicional informada para este produto."}
                </div>
                
                {selectedProduct.hasSize && selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Grade de Tamanhos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.availableSizes.map(size => (
                        <span key={size} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-white pt-6 border-t border-slate-100 mt-auto flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => addToCart(selectedProduct)}
                  className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <ShoppingCart className="w-6 h-6" /> Adicionar ao Carrinho
                </button>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 p-8">
            <button 
              onClick={() => setShowPromoModal(false)} 
              className="absolute top-6 right-6 z-10 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Clube de Vantagens</h3>
              <p className="text-sm text-slate-500 mt-2">Cadastre-se para receber descontos, novidades e ofertas exclusivas no seu WhatsApp.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Seu Nome</label>
                <input type="text" value={promoName} onChange={e => setPromoName(e.target.value)} placeholder="Como gosta de ser chamado" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">WhatsApp</label>
                <input type="tel" value={promoPhone} onChange={e => setPromoPhone(e.target.value)} placeholder="(11) 99999-9999" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Email (Opcional)</label>
                <input type="email" value={promoEmail} onChange={e => setPromoEmail(e.target.value)} placeholder="seu@email.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" />
              </div>

              <button 
                onClick={handlePromoSubmit}
                disabled={isSubmittingPromo}
                className={`w-full py-4 mt-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 text-white transition-all ${isSubmittingPromo ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}`}
              >
                {isSubmittingPromo ? 'Enviando...' : 'Quero me Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full sm:w-[400px] bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 z-10 rounded-[32px] sm:rounded-none">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-indigo-500" /> Carrinho</h3>
                <button onClick={() => setShowCart(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                     <ShoppingCart className="w-16 h-16 opacity-20" />
                     <p className="font-bold">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                       {item.product.imageUrl ? (
                         <img src={item.product.imageUrl} className="w-16 h-16 object-cover rounded-xl" />
                       ) : (
                         <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400"><Tag className="w-6 h-6"/></div>
                       )}
                       <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{item.product.name}</h4>
                          <p className="font-black text-indigo-600 mb-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}</p>
                          <div className="flex items-center gap-2">
                             <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"><Minus className="w-4 h-4" /></button>
                             <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"><Plus className="w-4 h-4" /></button>
                          </div>
                       </div>
                       <button onClick={() => removeFromCart(item.product.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
             </div>

             {cart.length > 0 && (
               <div className="pt-6 border-t border-slate-100 mt-6">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-slate-500 font-bold">Total:</span>
                     <span className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                  </div>
                  <button 
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Finalizar Compra <ArrowRight className="w-5 h-5"/>
                  </button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-8 animate-in zoom-in-95">
             <button onClick={() => setShowCheckout(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
             <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><CreditCard className="w-6 h-6 text-indigo-500"/> Finalizar Compra</h3>
             
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex justify-between items-center">
                <span className="font-bold text-slate-600">Total do Pedido:</span>
                <span className="text-xl font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
             </div>

             <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 mb-1 block">Nome Completo</label>
                  <input type="text" required value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} placeholder="Ex: João da Silva" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 mb-1 block">WhatsApp</label>
                  <input type="tel" required value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                  <p className="text-[10px] text-slate-400 mt-2 ml-2">Você precisará deste número para acompanhar seu pedido.</p>
                </div>
                <button 
                  type="submit" 
                  disabled={isCheckingOut}
                  className="w-full py-4 mt-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all text-lg"
                >
                  {isCheckingOut ? 'Criando pedido...' : 'Efetuar Compra'}
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Pedidos Modal */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl relative flex flex-col p-8 animate-in zoom-in-95">
             <button onClick={() => setShowOrders(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
             <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><ListOrdered className="w-6 h-6 text-indigo-500"/> Meus Pedidos</h3>
             
             <div className="flex gap-2 mb-6">
               <input 
                 type="tel" 
                 placeholder="Digite seu WhatsApp cadastrado" 
                 value={trackerPhone}
                 onChange={e => setTrackerPhone(e.target.value)}
                 className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
               />
               <button 
                 onClick={() => fetchOrders(trackerPhone)}
                 className="px-6 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all flex items-center gap-2"
               >
                 <Search className="w-5 h-5"/> Buscar
               </button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {isFetchingOrders ? (
                  <p className="text-center font-bold text-slate-400 py-10">Buscando...</p>
                ) : clientOrders.length === 0 ? (
                  <p className="text-center font-bold text-slate-400 py-10">Nenhum pedido encontrado para este WhatsApp.</p>
                ) : (
                  clientOrders.map(order => (
                    <div key={order.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{order.id.toUpperCase()}</p>
                           <h4 className="font-bold text-slate-800 text-sm hidden sm:block">{new Date(order.createdAt).toLocaleString()}</h4>
                         </div>
                         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">{order.status.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600"><span className="font-bold">{item.quantity}x</span> {item.product.name}</span>
                            <span className="font-bold text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                        <span className="font-bold text-slate-500 text-sm">Total Geral:</span>
                        <span className="font-black text-lg text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                      </div>
                      
                      {order.status === 'AWAITING_PAYMENT' && (
                        <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center justify-between">
                          <p className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Aguardando Pagamento</p>
                          <p className="text-[10px] text-slate-400 max-w-[200px] text-right">O link de pagamento foi enviado ao seu WhatsApp. Confirme lá se possível!</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Storefront;
