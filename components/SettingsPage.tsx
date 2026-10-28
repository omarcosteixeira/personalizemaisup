
import React, { useState, useRef, useEffect } from 'react';
import { storage, DEFAULT_PRODUCT_CATEGORIES, slugify } from '../services/storageService';
import { auth } from '../services/firebaseService';
import { AppSettings, ShippingOption, SidebarBanner, CustomFont } from '../types';
import { 
  Save, Building, MapPin, Phone, Mail, Instagram, Facebook, Globe, Upload, 
  Image as ImageIcon, X, Truck, Plus, Layout, MessageSquare, Palette, Settings, 
  ShoppingBag, Music, ExternalLink, ToggleLeft, ToggleRight, Type, FileUp, Trash2, 
  Copy, Check, Sparkles, Key, CreditCard, Layers, Edit2, RotateCcw, Tag, 
  FolderPlus, AlertCircle, Package, Search, Link2, Wand2
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(storage.getCustomFonts());
  const [activeTab, setActiveTab] = useState<'business' | 'categories' | 'logistics' | 'messages' | 'appearance' | 'fonts' | 'ai' | 'integrations'>('business');
  const [copied, setCopied] = useState(false);
  
  // Categorias de Produtos
  const [categories, setCategories] = useState<string[]>(() => storage.getProductCategories());
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const sidebarInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const [newShipping, setNewShipping] = useState({ name: '', price: 0 });
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [pairingPhone, setPairingPhone] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [sessionDataText, setSessionDataText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [botStatus, setBotStatus] = useState<string>('desconectado');

  useEffect(() => {
    let interval: any;
    if (activeTab === 'ai' && settings.webhookUrl) {
      const sessao = settings.botSessionId || 'vendas';
      const checkStatus = async () => {
        try {
          const res = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/status/${sessao}`);
          const data = await res.json();
          if (data.status) {
            setBotStatus(data.status);
            if (data.qr_imagem_url) setQrImageUrl(data.qr_imagem_url);
            if (data.codigo_emparelhamento) setPairingCode(data.codigo_emparelhamento);
          }
        } catch (e) {
          console.error("Erro no polling de status:", e);
        }
      };
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, settings.webhookUrl, settings.botSessionId]);

  // Gera o link amigável da loja: site + nome fantasia da empresa (ex: personalizemais.vercel.app/ateliearianeartes)
  const currentSlug = settings.slug || slugify(settings.businessName || 'ateliearianeartes');
  const storeLink = `${window.location.origin}/${currentSlug}`;
  const displayUrl = `personalizemais.vercel.app/${currentSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'sidebar' | 'font') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'logo') {
          setSettings({ ...settings, logoUrl: result });
        } else if (type === 'banner') {
          const currentBanners = settings.banners || [];
          if (currentBanners.length < 5) {
            setSettings({ ...settings, banners: [...currentBanners, result] });
          } else {
            alert('Máximo de 5 banners atingido.');
          }
        } else if (type === 'sidebar') {
          const currentSidebar = settings.sidebarBanners || [];
          if (currentSidebar.length < 6) {
            const newBanner: SidebarBanner = {
              id: Math.random().toString(36).substr(2, 9),
              imageUrl: result,
              link: ''
            };
            setSettings({ ...settings, sidebarBanners: [...currentSidebar, newBanner] });
          } else {
            alert('Máximo de 6 banners laterais atingido.');
          }
        } else if (type === 'font') {
          const fontName = file.name.split('.')[0];
          const format = file.name.split('.').pop() || 'ttf';
          if (customFonts.some(f => f.name === fontName)) {
            alert('Esta fonte já foi importada.');
            return;
          }
          const newFont: CustomFont = {
            id: Math.random().toString(36).substr(2, 9),
            name: fontName,
            data: result,
            format: format
          };
          storage.saveCustomFont(newFont);
          setCustomFonts(storage.getCustomFonts());
          alert('Fonte importada com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = (index: number) => {
    const newBanners = [...settings.banners];
    newBanners.splice(index, 1);
    setSettings({ ...settings, banners: newBanners });
  };

  const removeSidebarBanner = (id: string) => {
    setSettings({ ...settings, sidebarBanners: settings.sidebarBanners.filter(b => b.id !== id) });
  };

  const deleteFont = (id: string) => {
    if (confirm('Deseja realmente excluir esta fonte?')) {
      storage.deleteCustomFont(id);
      setCustomFonts(storage.getCustomFonts());
    }
  };

  const updateSidebarLink = (id: string, link: string) => {
    setSettings({
      ...settings,
      sidebarBanners: settings.sidebarBanners.map(b => b.id === id ? { ...b, link } : b)
    });
  };

  const addShipping = () => {
    if (!newShipping.name) return;
    const opt: ShippingOption = { id: Math.random().toString(36).substr(2, 9), ...newShipping };
    setSettings({ ...settings, shippingOptions: [...(settings.shippingOptions || []), opt] });
    setNewShipping({ name: '', price: 0 });
  };

  const removeShipping = (id: string) => {
    setSettings({ ...settings, shippingOptions: settings.shippingOptions.filter(o => o.id !== id) });
  };

  const getProductCountForCategory = (catName: string) => {
    const products = storage.getProducts();
    return products.filter(p => p.category?.trim().toLowerCase() === catName.trim().toLowerCase()).length;
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      alert('Digite o nome da categoria.');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoria já existe!');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    storage.saveProductCategories(updated);
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (catName: string) => {
    const count = getProductCountForCategory(catName);
    let msg = `Deseja realmente remover a categoria "${catName}"?`;
    if (count > 0) {
      msg = `Atenção: Existem ${count} produto(s) associados à categoria "${catName}".\n\nA categoria deixará de aparecer na lista padrão de opções suspensas ao cadastrar novos produtos. Deseja continuar?`;
    }
    if (!window.confirm(msg)) return;

    const updated = categories.filter(c => c.toLowerCase() !== catName.toLowerCase());
    setCategories(updated);
    storage.saveProductCategories(updated);
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory) return;
    const { oldName, newName } = editingCategory;
    const cleanNew = newName.trim();
    if (!cleanNew) {
      alert('O nome da categoria não pode ficar vazio.');
      return;
    }
    if (cleanNew.toLowerCase() !== oldName.toLowerCase() && categories.some(c => c.toLowerCase() === cleanNew.toLowerCase())) {
      alert('Já existe outra categoria com esse nome.');
      return;
    }

    storage.renameProductCategory(oldName, cleanNew);
    setCategories(storage.getProductCategories());
    setEditingCategory(null);
  };

  const handleResetDefaultCategories = () => {
    if (!window.confirm('Deseja restaurar as categorias padrão recomendadas? As categorias dos seus produtos atuais serão preservadas.')) return;
    const products = storage.getProducts();
    const existing = products.map(p => p.category?.trim()).filter(Boolean) as string[];
    const merged = Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...existing]));
    setCategories(merged);
    storage.saveProductCategories(merged);
  };

  const handleSave = () => {
    storage.saveProductCategories(categories);
    storage.saveSettings({ ...settings, productCategories: categories });
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Configurações Gerais</h3>
          <p className="text-sm text-slate-500">Personalize seu sistema, cores e comunicações.</p>
        </div>
        <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
          <Save className="w-5 h-5" /> Salvar Tudo
        </button>
      </div>

      {/* Link da Loja Card (Site + Nome Fantasia) */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200/80 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white rounded-2xl shadow-sm text-indigo-600 border border-indigo-100">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest">Link de Acesso da Sua Loja</h4>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-full">Oficial</span>
            </div>
            <p className="text-xs text-indigo-700 font-mono font-bold mt-0.5 break-all">
              {displayUrl}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Seus clientes podem acessar diretamente via: <span className="font-semibold">{storeLink}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button 
            onClick={handleCopyLink}
            className="flex-1 md:flex-none px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-indigo-200 shadow-sm transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4" />}
            {copied ? 'COPIADO!' : 'COPIAR LINK'}
          </button>
          <a 
            href={storeLink} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> ABRIR LOJA
          </a>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'business', label: 'Empresa', icon: Building },
          { id: 'categories', label: 'Categorias de Produtos', icon: Layers },
          { id: 'logistics', label: 'Banners e Fretes', icon: Truck },
          { id: 'messages', label: 'Mensagens WA', icon: MessageSquare },
          { id: 'appearance', label: 'Aparência', icon: Palette },
          { id: 'fonts', label: 'Fontes', icon: Type },
          { id: 'ai', label: 'Inteligência Artificial', icon: Sparkles },
          { id: 'integrations', label: 'Pagamentos', icon: CreditCard }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'business' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-12 h-12 text-slate-300" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"><Upload className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">{settings.businessName || 'Sua Gráfica'}</h4>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Logotipo Principal</p>
            </div>

            <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
               <div className="col-span-2 space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase">Nome Fantasia da Empresa</label>
                 <input 
                   type="text" 
                   value={settings.businessName} 
                   onChange={e => {
                     const newName = e.target.value;
                     setSettings({
                       ...settings, 
                       businessName: newName,
                       slug: settings.slug || slugify(newName)
                     });
                   }} 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800" 
                 />
               </div>

               {/* Slug do link da loja */}
               <div className="col-span-2 space-y-1.5 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                 <div className="flex items-center justify-between">
                   <label className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                     <Link2 className="w-4 h-4 text-indigo-600" /> Link de Acesso da Loja (Site + Nome Fantasia)
                   </label>
                   <button
                     type="button"
                     onClick={() => setSettings({ ...settings, slug: slugify(settings.businessName) })}
                     className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline"
                   >
                     <Wand2 className="w-3 h-3" /> Gerar do Nome Fantasia
                   </button>
                 </div>
                 <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                   <span className="pl-3 pr-1 py-3 text-xs font-bold text-slate-400 select-none shrink-0 font-mono">
                     personalizemais.vercel.app/
                   </span>
                   <input 
                     type="text" 
                     value={settings.slug || slugify(settings.businessName || '')} 
                     onChange={e => setSettings({ ...settings, slug: slugify(e.target.value) })}
                     placeholder="ateliearianeartes"
                     className="w-full p-3 pl-0 bg-transparent outline-none font-mono font-bold text-indigo-700 text-xs" 
                   />
                 </div>
                 <p className="text-[10px] text-slate-500 mt-1">
                   Exemplo: <strong>ateliearianeartes</strong> → Seus clientes acessam sua loja diretamente em <code>personalizemais.vercel.app/ateliearianeartes</code>
                 </p>
               </div>
               <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Endereço</label><input type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" /></div>
               <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">WhatsApp</label><input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" /></div>
               <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">E-mail</label><input type="text" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Globe className="w-5 h-5 text-emerald-500" /> Redes Sociais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input type="text" value={settings.socialLinks.instagram} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="URL Instagram" />
              </div>
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input type="text" value={settings.socialLinks.facebook} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="URL Facebook" />
              </div>
              <div className="relative">
                <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input type="text" value={settings.socialLinks.tiktokShop} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, tiktokShop: e.target.value}})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="URL TikTok Shop" />
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input type="text" value={settings.socialLinks.website} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, website: e.target.value}})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Site Oficial" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          {/* Card explicativo e ações rápidas */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" /> Categorias de Produtos
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie as categorias de produtos da sua gráfica e loja. Ao adicionar ou editar um produto, estas opções aparecerão em uma lista suspensa (dropdown).
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaultCategories}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center gap-2 transition-all self-start md:self-auto shrink-0"
                title="Restaura as categorias padrão recomendadas para gráficas e personalização"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" /> Restaurar Sugeridas
              </button>
            </div>

            {/* Formulário de Adicionar Nova Categoria */}
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Criar Nova Categoria
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Nome da categoria (ex: Brindes de Casamento, Adesivos Vinil, Canecas)..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Adicionar Categoria
                </button>
              </div>
            </div>

            {/* Barra de Busca rápida dentro das categorias */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filtrar categorias..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                />
              </div>
              <span className="text-xs font-bold text-slate-400 self-end sm:self-auto">
                {categories.length} categoria{categories.length === 1 ? '' : 's'} cadastrada{categories.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Lista de Categorias */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {categories
                .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                .map((cat, index) => {
                  const productCount = getProductCountForCategory(cat);
                  const isEditing = editingCategory?.oldName === cat;

                  return (
                    <div 
                      key={cat} 
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isEditing ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditCategory();
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            autoFocus
                            className="flex-1 p-2 bg-white border-2 border-indigo-500 rounded-lg text-sm font-bold text-slate-800 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditCategory}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                            title="Salvar alteração"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {cat}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {productCount === 0 ? 'Nenhum produto cadastrado' : `${productCount} produto(s) associado(s)`}
                            </span>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            productCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {productCount} {productCount === 1 ? 'item' : 'itens'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="Editar nome da categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              {categories.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <Layers className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold">Nenhuma categoria cadastrada ainda.</p>
                  <button
                    type="button"
                    onClick={handleResetDefaultCategories}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Carregar Categorias Padrão
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logistics' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><Layout className="w-5 h-5 text-indigo-500" /> Banners da Loja Online</h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{settings.banners?.length || 0}/5</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.banners?.map((banner, index) => (
                <div key={index} className="relative aspect-video rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                  <img src={banner} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeBanner(index)}
                      className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all transform hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {(settings.banners?.length || 0) < 5 && (
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-widest">Adicionar Banner</span>
                </button>
              )}
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'banner')} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-indigo-500" /> Banners Laterais</h4>
                <p className="text-xs text-slate-400">Exibidos na lateral da loja online.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, showSidebarBanners: !settings.showSidebarBanners})}
                className={`p-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${settings.showSidebarBanners ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}
              >
                {settings.showSidebarBanners ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                {settings.showSidebarBanners ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            {settings.showSidebarBanners && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settings.sidebarBanners?.map((banner) => (
                    <div key={banner.id} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 relative group">
                        <img src={banner.imageUrl} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeSidebarBanner(banner.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={banner.link}
                        onChange={(e) => updateSidebarLink(banner.id, e.target.value)}
                        placeholder="Link do Anúncio"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] outline-none"
                      />
                    </div>
                  ))}
                  {settings.sidebarBanners.length < 6 && (
                    <button 
                      onClick={() => sidebarInputRef.current?.click()}
                      className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  )}
                  <input type="file" ref={sidebarInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'sidebar')} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-indigo-500" /> Logística de Entrega (Fretes)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-6 rounded-2xl">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Forma de Entrega</label>
                <input type="text" value={newShipping.name} onChange={e => setNewShipping({...newShipping, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl" placeholder="Ex: Motoboy" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Preço (R$)</label>
                <input type="number" value={newShipping.price} onChange={e => setNewShipping({...newShipping, price: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl" />
              </div>
              <button onClick={addShipping} className="py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/> Adicionar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {settings.shippingOptions?.map(opt => (
                <div key={opt.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center group shadow-sm">
                  <div><p className="font-bold text-slate-700">{opt.name}</p><p className="text-sm text-indigo-600 font-black">R$ {opt.price.toFixed(2)}</p></div>
                  <button onClick={() => removeShipping(opt.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Outras abas permanecem com o mesmo funcionamento */}
      {activeTab === 'messages' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-indigo-500" /> Templates de WhatsApp</h4>
            {[
              { id: 'quotation', label: 'Envio de Orçamento', key: 'quotation' },
              { id: 'awaiting_payment', label: 'Aguardando Pagamento', key: 'awaiting_payment' },
              { id: 'production', label: 'Em Produção', key: 'production' },
              { id: 'shipping', label: 'Saiu para Entrega', key: 'shipping' },
              { id: 'delivered', label: 'Entregue', key: 'delivered' }
            ].map(msg => (
              <div key={msg.id} className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.label}</label>
                <textarea 
                  value={(settings.waMessages as any)[msg.key]} 
                  onChange={e => setSettings({...settings, waMessages: {...settings.waMessages, [msg.key]: e.target.value}})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm h-32"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-indigo-500" /> Cores do Sistema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Cor Primária</label>
                  <input 
                    type="color" 
                    value={settings.theme.primaryColor} 
                    onChange={e => setSettings({...settings, theme: {...settings.theme, primaryColor: e.target.value}})}
                    className="w-full h-12 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Cor Secundária</label>
                  <input 
                    type="color" 
                    value={settings.theme.secondaryColor} 
                    onChange={e => setSettings({...settings, theme: {...settings.theme, secondaryColor: e.target.value}})}
                    className="w-full h-12 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fonts' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 flex items-center gap-2"><Type className="w-5 h-5 text-indigo-500" /> Fontes</h4>
              <button onClick={() => fontInputRef.current?.click()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2">
                <FileUp className="w-4 h-4" /> Importar
              </button>
              <input type="file" ref={fontInputRef} className="hidden" accept=".ttf,.otf" onChange={e => handleFileUpload(e, 'font')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFonts.map(font => (
                <div key={font.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group">
                  <span className="text-xs font-bold">{font.name}</span>
                  <button onClick={() => deleteFont(font.id)} className="text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Inteligência Artificial e Bot
            </h4>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h5 className="font-bold text-slate-700 text-sm">Configuração da Groq (Geração de Texto)</h5>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Sua Chave de API da Groq
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="password"
                      value={settings.groqApiKey || ''} 
                      onChange={e => setSettings({...settings, groqApiKey: e.target.value})}
                      placeholder="gsk_..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Insira sua chave da Groq para habilitar recursos de geração de texto e descrições aprimoradas. 
                  </p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <h5 className="font-bold text-slate-700 text-sm">Integração do Bot (Gestão Pro)</h5>
                
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${botStatus === 'conectado' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div>
                      <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Conexão</h6>
                      <p className="text-sm font-bold text-slate-700 capitalize">{botStatus.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                       if (!settings.webhookUrl || !settings.webhookSecret) return alert("Configure o webhook.");
                       const sessao = settings.botSessionId || 'vendas';
                       setQrImageUrl('');
                       setPairingCode('');
                       try {
                         await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/iniciar-sessao`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ idSessao: sessao, senha: settings.webhookSecret })
                         });
                         alert("🔄 Iniciando sessão... Aguarde o QR Code aparecer.");
                       } catch(e) { alert("Erro ao iniciar."); }
                    }}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-200"
                  >
                    Gerar QR Code
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <button 
                    onClick={async () => {
                      const newStatus = !settings.botEnabled;
                      setSettings({ ...settings, botEnabled: newStatus });
                      if (settings.webhookUrl && settings.webhookSecret) {
                         try {
                           const res = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/config-ia`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ habilitar: newStatus, senha: settings.webhookSecret })
                           });
                           
                           const dados = await res.json();
                           if (dados.sucesso) {
                               alert(`✅ ${dados.mensagem}`);
                           } else {
                               alert("⚠️ Erro ao configurar IA: " + dados.erro);
                           }
                         } catch (e) { 
                             console.error("Erro ao configurar IA no bot:", e); 
                             alert("Erro de comunicação ao tentar mudar o status da IA.");
                         }
                      }
                    }}
                    className="p-1"
                  >
                    {settings.botEnabled ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Status da IA do Bot</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link do Webhook (Gestão Pro)</label>
                    <input 
                      type="url"
                      value={settings.webhookUrl || ''} 
                      onChange={e => setSettings({...settings, webhookUrl: e.target.value})}
                      placeholder="Ex: https://seu-bot.up.railway.app"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessão Padrão</label>
                    <select 
                      value={settings.botSessionId || 'vendas'} 
                      onChange={e => setSettings({...settings, botSessionId: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    >
                      {(settings.botSessions && settings.botSessions.length > 0 ? settings.botSessions : ['vendas']).map((sessao: string) => (
                        <option key={sessao} value={sessao}>{sessao}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha Secreta</label>
                    <input 
                      type="password"
                      value={settings.webhookSecret || ''} 
                      onChange={e => setSettings({...settings, webhookSecret: e.target.value})}
                      placeholder="Sua senha secreta do bot"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <button 
                    onClick={async () => {
                      if (!settings.webhookUrl || !settings.webhookSecret) {
                        return alert("Preencha o link do webhook e a senha primeiro.");
                      }
                      const url = `${settings.webhookUrl.replace(/\/$/, '')}/api/ping`; 
                      try {
                        const res = await fetch(url);
                        const dados = await res.json();
                        if (dados.sucesso) alert("✅ Servidor do Bot está ONLINE e operante!");
                        else alert("⚠️ Servidor respondeu, mas com erro.");
                      } catch (e) {
                         alert("❌ Falha de comunicação. O servidor do bot pode estar offline.");
                      }
                    }}
                    className="px-6 py-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                  >
                    Testar Conexão do Servidor
                  </button>

                  <button 
                    onClick={async () => {
                       if (!settings.webhookUrl || !settings.webhookSecret) {
                        return alert("Preencha o link do webhook e a senha primeiro.");
                       }
                       const sessao = settings.botSessionId || 'vendas';
                       setQrImageUrl('');
                       setPairingCode('');
                       
                       try {
                         await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/iniciar-sessao`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ idSessao: sessao, senha: settings.webhookSecret })
                         });

                         setTimeout(async () => {
                            try {
                                const respostaQR = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/qrcode/${sessao}`);
                                const dadosQR = await respostaQR.json();

                                if (dadosQR.qr_imagem_url) {
                                    setQrImageUrl(dadosQR.qr_imagem_url);
                                    alert("QR Code gerado! Verifique a área de imagem abaixo.");
                                } else {
                                    alert("QR Code não disponível. Status: " + (dadosQR.mensagem || 'Desconhecido'));
                                }
                            } catch (e) {
                                alert("Erro ao buscar a imagem do QR Code.");
                            }
                         }, 2000);
                       } catch(e) {
                          alert(`Falha de comunicação para iniciar o Whatsapp.`);
                       }
                    }}
                    className="px-6 py-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                  >
                    Ver QR Code
                  </button>

                  <div className="flex-1 min-w-[200px] flex gap-2">
                    <input 
                      type="tel"
                      value={pairingPhone}
                      onChange={e => setPairingPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Número (Ex: 5521999999999)"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-medium"
                    />
                    <button 
                      disabled={isGeneratingCode}
                      onClick={async () => {
                         if (!settings.webhookUrl || !settings.webhookSecret) {
                          return alert("Preencha o link do webhook e a senha primeiro.");
                         }
                         if (!pairingPhone || pairingPhone.length < 10) {
                          return alert("Digite o número de telefone com DDD (Ex: 5511...)");
                         }
                         const sessao = settings.botSessionId || 'vendas';
                         setQrImageUrl('');
                         setPairingCode('');
                         setIsGeneratingCode(true);
                         
                         try {
                           // Algumas APIs permitem passar o número no iniciar-sessao para pairing code
                           const initRes = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/iniciar-sessao`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ idSessao: sessao, senha: settings.webhookSecret, phone: pairingPhone, pairingCode: true })
                           });

                           const initData = await initRes.json();
                           
                           // Se o código já vier na resposta inicial
                           if (initData.code || initData.pairingCode) {
                              setPairingCode(initData.code || initData.pairingCode);
                              alert("Código de Pareamento gerado com sucesso!");
                              setIsGeneratingCode(false);
                              return;
                           }

                           // Caso contrário, tenta buscar no endpoint específico após um tempo
                           setTimeout(async () => {
                              try {
                                  // Tenta buscar o código. Algumas APIs usam 'phone', outras 'number'.
                                  const res = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/pairing-code/${sessao}?phone=${pairingPhone}&number=${pairingPhone}`);
                                  const data = await res.json();

                                  if (data.code || data.pairingCode) {
                                      setPairingCode(data.code || data.pairingCode);
                                      alert("Código de Pareamento gerado!");
                                  } else {
                                      console.error("Resposta do servidor:", data);
                                      alert("O servidor respondeu, mas não enviou o código. Verifique se o número está correto ou use o QR Code.");
                                  }
                              } catch (e: any) {
                                  console.error("Erro ao buscar pairing code:", e);
                                  alert(`Erro na busca do código: ${e.message}`);
                              } finally {
                                  setIsGeneratingCode(false);
                              }
                           }, 4000);
                         } catch(e: any) {
                            alert(`Falha ao conectar com o servidor: ${e.message}`);
                            setIsGeneratingCode(false);
                         }
                      }}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      {isGeneratingCode ? 'Gerando...' : 'Gerar Código'}
                    </button>
                  </div>

                  <div className="w-full pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-500" /> Injeção de Sessão (creds.json)
                      </h5>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded">MIGRAÇÃO</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <b>Importante:</b> Cole o conteúdo do seu arquivo <b>creds.json</b> para injetar a sessão diretamente.
                    </p>

                    <textarea
                      value={sessionDataText}
                      onChange={e => setSessionDataText(e.target.value)}
                      placeholder="Cole aqui o JSON gerado pela extensão..."
                      className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[10px] font-mono leading-tight"
                    />

                    <button
                      disabled={isInjecting || !sessionDataText}
                      onClick={async () => {
                        if (!settings.webhookUrl || !settings.webhookSecret) {
                          return alert("Configure o webhook e a senha primeiro.");
                        }

                        let sessionDataObj;
                        try {
                          sessionDataObj = JSON.parse(sessionDataText);
                        } catch (e) {
                          return alert("❌ ERRO: O texto colado não é um JSON válido. Verifique se copiou tudo corretamente.");
                        }

                        setIsInjecting(true);
                        const sessao = settings.botSessionId || 'vendas';

                        try {
                          const response = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/injetar-sessao`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              idSessao: sessao,
                              senha: settings.webhookSecret,
                              sessionData: sessionDataObj
                            })
                          });

                          const result = await response.json();

                          if (response.ok) {
                            alert("✅ Sucesso! Sessão injetada.\n\n⚠️ IMPORTANTE: Feche a aba do WhatsApp Web AGORA para evitar banimento!");
                            setSessionDataText('');
                          } else {
                            alert("❌ Erro ao injetar: " + (result.erro || result.mensagem || 'Erro desconhecido.'));
                          }
                        } catch (error) {
                          alert("❌ Falha na comunicação com o servidor do Bot.");
                        } finally {
                          setIsInjecting(false);
                        }
                      }}
                      className="w-full py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isInjecting ? 'Injetando...' : 'Conectar Bot (Injetar Sessão)'}
                    </button>
                  </div>

                  <button 
                    onClick={async () => {
                       if (!settings.webhookUrl || !settings.webhookSecret) {
                        return alert("Preencha o link do webhook e a senha primeiro.");
                       }
                       const sessao = settings.botSessionId || 'vendas';
                       const statusUrl = `${settings.webhookUrl.replace(/\/$/, '')}/api/status/${sessao}`;
                       window.open(statusUrl, '_blank');
                    }}
                    className="px-6 py-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                  >
                    Status do WhatsApp
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 pt-2">
                  Nota: Clique em "Ver QR Code" para iniciar o WhatsApp do ateliê (demora ~2 segundos para gerar).
                </p>
                
                {qrImageUrl && (
                  <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center">
                     <p className="text-xs font-bold text-slate-600 mb-2">Aponte a câmera do seu celular para o WhatsApp web:</p>
                     <img src={qrImageUrl} alt="QR Code WhatsApp" className="w-64 h-64 border-4 border-white shadow-xl rounded-xl" />
                  </div>
                )}

                {pairingCode && (
                  <div className="mt-4 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center">
                     <p className="text-sm font-bold text-indigo-900 mb-2">Código de Pareamento:</p>
                     <div className="text-4xl font-black tracking-[0.2em] text-indigo-600 font-mono bg-white px-8 py-4 rounded-xl border-2 border-indigo-200 shadow-inner">
                       {pairingCode}
                     </div>
                     <p className="text-[10px] text-indigo-400 mt-4 max-w-[280px] text-center">
                       No seu WhatsApp: Configurações &gt; Aparelhos Conectados &gt; Conectar um Aparelho &gt; <b>Conectar com número de telefone</b>.
                     </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Integração de Pagamentos
            </h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Provedor de Pagamento</label>
                <select
                  value={settings.paymentGateway?.provider || 'none'}
                  onChange={e => setSettings({
                    ...settings, 
                    paymentGateway: { 
                      ...(settings.paymentGateway || { accessToken: '', autoSendLink: false }), 
                      provider: e.target.value as any 
                    }
                  })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                >
                  <option value="none">Nenhum</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="pagseguro">PagSeguro</option>
                  <option value="asaas">Asaas</option>
                  <option value="infinitepay">InfinitePay</option>
                </select>
              </div>

              {settings.paymentGateway?.provider && settings.paymentGateway.provider !== 'none' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Access Token (Token de Acesso)</label>
                    <input 
                      type="password"
                      value={settings.paymentGateway.accessToken || ''} 
                      onChange={e => setSettings({
                        ...settings, 
                        paymentGateway: { ...settings.paymentGateway!, accessToken: e.target.value }
                      })}
                      placeholder="Ex: APP_USR-123456789-..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                    <p className="text-[10px] text-slate-400">Insira a chave de produção fornecida pelo seu provedor (Mercado Pago, PagSeguro, etc).</p>
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                    <input 
                      type="checkbox" 
                      checked={settings.paymentGateway.autoSendLink || false}
                      onChange={e => setSettings({
                        ...settings, 
                        paymentGateway: { ...settings.paymentGateway!, autoSendLink: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                    />
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-slate-700">Gerar e Enviar Link Automaticamente</span>
                      <p className="text-xs text-slate-500 font-medium">Ao criar um novo orçamento (Aguardando Pagamento), gera um link do {settings.paymentGateway.provider} e envia para o WhatsApp do cliente.</p>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
