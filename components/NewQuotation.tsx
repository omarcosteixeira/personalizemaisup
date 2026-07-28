
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Send, 
  Calculator, 
  MessageSquare, 
  X, 
  Tag, 
  Percent, 
  Check, 
  CheckCircle2,
  Printer, 
  Box, 
  Truck, 
  Package, 
  MessageCircle, 
  Clock, 
  Palette, 
  Search, 
  ChevronDown,
  CreditCard,
  Smartphone,
  Banknote,
  AlertCircle,
  ChevronRight,
  FileBadge
} from 'lucide-react';
import { Product, PricingMode, QuotationItem, Quotation, Coupon, ShippingOption, Customer } from '../types';
import { storage } from '../services/storageService';
import { pdfService } from '../services/pdfService';

interface Props {
  products: Product[];
  initialData?: Quotation | null;
  isEditing?: boolean;
  onSave: () => void;
  onNavigateToHistory?: () => void;
}

const NewQuotation: React.FC<Props> = ({ products, initialData, isEditing, onSave, onNavigateToHistory }) => {
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerContact, setCustomerContact] = useState(initialData?.customerContact || '');
  const [items, setItems] = useState<QuotationItem[]>(initialData?.items || []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue || 0);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>(initialData?.discountType || 'FIXED');
  const [couponInput, setCouponInput] = useState(initialData?.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PIX' | 'DEBIT' | 'CREDIT'>(initialData?.paymentMethod || 'CASH');
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'SPLIT'>(initialData?.paymentOption || 'FULL');
  const [installments, setInstallments] = useState<number>(initialData?.installments || 1);

  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [pendingQuotation, setPendingQuotation] = useState<Quotation | null>(null);

  const [isAdHoc, setIsAdHoc] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adHocName, setAdHocName] = useState('');
  const [adHocPrice, setAdHocPrice] = useState(0);
  const [adHocMode, setAdHocMode] = useState<PricingMode>(PricingMode.UNIT);

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');

  const settings = storage.getSettings();

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  const MP_RATES = {
    DEBIT: 0.0199,
    CREDIT: { 1: 0.0498, 2: 0.0650, 3: 0.0790, 4: 0.0920, 5: 0.1050, 6: 0.1180 }
  };

  const calculateItemPrice = (price: number, mode: PricingMode, w: number, h: number, q: number) => {
    if (mode === PricingMode.AREA) return ((w * h) / 10000) * price * q;
    if (mode === PricingMode.MILHEIRO) return (q / 1000) * price;
    return price * q;
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);

  const calculateGatewayFee = () => {
    const baseAmount = subtotal + (shippingOption?.price || 0);
    if (paymentMethod === 'DEBIT') return baseAmount * MP_RATES.DEBIT;
    if (paymentMethod === 'CREDIT') return baseAmount * (MP_RATES.CREDIT[installments as keyof typeof MP_RATES.CREDIT] || 0);
    return 0;
  };

  const calculateTotal = () => {
    let total = subtotal;
    total += shippingOption?.price || 0;
    if (discountType === 'PERCENT') total -= (subtotal * discountValue) / 100;
    else total -= discountValue;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENT') total -= (subtotal * appliedCoupon.value) / 100;
      else total -= appliedCoupon.value;
    }
    total += calculateGatewayFee();
    return Math.max(0, total);
  };

  const finalTotal = calculateTotal();
  const gatewayFee = calculateGatewayFee();

  const addItem = () => {
    if (isAdHoc) {
      if (!adHocName || adHocPrice <= 0) return;
      const price = calculateItemPrice(adHocPrice, adHocMode, width, height, quantity);
      setItems([...items, {
        id: Math.random().toString(36).substr(2, 9),
        productId: 'ad-hoc',
        productName: adHocName,
        width: adHocMode === PricingMode.AREA ? width : undefined,
        height: adHocMode === PricingMode.AREA ? height : undefined,
        quantity, unitPrice: adHocPrice, total: price, isAdHoc: true,
        selectedSize, selectedTheme
      }]);
    } else {
      if (!selectedProduct) return;
      const price = calculateItemPrice(selectedProduct.price, selectedProduct.mode, width, height, quantity);
      setItems([...items, {
        id: Math.random().toString(36).substr(2, 9),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        width: selectedProduct.mode === PricingMode.AREA ? width : undefined,
        height: selectedProduct.mode === PricingMode.AREA ? height : undefined,
        quantity, unitPrice: selectedProduct.price, total: price,
        selectedSize, selectedTheme, productionTime: selectedProduct.productionTime
      }]);
    }
    setSelectedProduct(null); setWidth(0); setHeight(0); setQuantity(1); setSelectedSize(''); setSelectedTheme('');
  };

  const applyCoupon = () => {
    const coupons = storage.getCoupons();
    const found = coupons.find(c => c.code === couponInput.toUpperCase() && c.active);
    if (found) { setAppliedCoupon(found); alert('Cupom aplicado!'); }
    else { setAppliedCoupon(null); alert('Cupom inválido.'); }
  };

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name); setCustomerContact(c.phone); setShowCustomerDropdown(false);
  };

  const createQuotationObject = (status: Quotation['status'] = 'PENDING'): Quotation => {
    const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase() || c.phone === customerContact);
    if (!existing && customerName && customerContact) {
      const newCustomer: Customer = { id: Math.random().toString(36).substr(2, 9), name: customerName, phone: customerContact, cpf: '', address: '', createdAt: new Date().toISOString() };
      storage.saveCustomer(newCustomer);
    }
    
    // Se estiver editando, mantenha o ID original. Se for novo ou duplicado, gere um novo ID se não houver um passado.
    // Lógica ajustada: isEditing garante que estamos atualizando. Sem isEditing, mesmo com initialData (duplicação), criamos novo ID.
    const id = isEditing && initialData?.id ? initialData.id : `${status === 'PENDING' ? 'ORC' : 'PED'}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id,
      customerName, customerContact, items, subtotal, discountValue, discountType, couponCode: appliedCoupon?.code,
      shippingValue: shippingOption?.price || 0, shippingName: shippingOption?.name, gatewayFee, total: finalTotal,
      paymentMethod, paymentOption, installments: paymentMethod === 'CREDIT' ? installments : undefined,
      createdAt: isEditing && initialData?.createdAt ? initialData.createdAt : new Date().toISOString(), 
      status: status
    };
  };

  const handleSaveAsBudget = () => {
    if (!customerName || items.length === 0) return;
    const quotation = createQuotationObject('PENDING');
    storage.saveQuotation(quotation);
    pdfService.generateQuotation(quotation).save(`${quotation.id}.pdf`);
    onSave();
  };

  const handleSaveAsOrder = () => {
    if (!customerName || items.length === 0) return;
    const quotation = createQuotationObject('AWAITING_PAYMENT');
    storage.saveQuotation(quotation);
    pdfService.generateQuotation(quotation).save(`${quotation.id}.pdf`);
    onSave(); if (onNavigateToHistory) onNavigateToHistory();
  };

  const handleOpenWhatsappModal = () => {
    if (!customerName || items.length === 0) return;
    const quotation = createQuotationObject('PENDING');
    setPendingQuotation(quotation);
    setCustomMessage(settings.waMessages.quotation.replace(/{cliente}/g, quotation.customerName).replace(/{total}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.total)));
    setShowWhatsappModal(true);
  };

  const finalizeSaveWA = (sendWa: boolean) => {
    if (!pendingQuotation) return;
    storage.saveQuotation({ ...pendingQuotation, customMessage: sendWa ? customMessage : undefined });
    pdfService.generateQuotation(pendingQuotation).save(`${pendingQuotation.id}.pdf`);
    if (sendWa) {
      const p = customerContact.replace(/\D/g, '');
      const finalPhone = p.startsWith('55') ? p : `55${p}`;
      window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(customMessage)}`, '_blank');
    }
    onSave(); setShowWhatsappModal(false); setPendingQuotation(null);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 animate-in fade-in duration-500">
      
      {/* Coluna Dados (Mobile Topo / Desktop Esquerda) */}
      <div className="lg:col-span-8 space-y-6 order-1">
        <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200">
          <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500"/> {isEditing ? `Editando ${initialData?.id}` : 'Novo Pedido / Orçamento'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <div className="relative">
              <input type="text" value={customerName} onChange={e => {setCustomerName(e.target.value); setShowCustomerDropdown(true);}} onFocus={() => setShowCustomerDropdown(true)} placeholder="Nome do Cliente" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
              {showCustomerDropdown && customerName.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                  {customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => handleSelectCustomer(c)} className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center"><span className="font-bold text-slate-700 text-sm">{c.name}</span><span className="text-[10px] text-slate-400 font-bold">{c.phone}</span></button>
                  ))}
                </div>
              )}
            </div>
            <input type="text" value={customerContact} onChange={e => setCustomerContact(e.target.value)} placeholder="WhatsApp" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500"/> Adicionar Itens</h4>
            <button onClick={() => setIsAdHoc(!isAdHoc)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isAdHoc ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400' : 'bg-slate-100 text-slate-500'}`}>
              {isAdHoc ? '✓ Avulso' : '+ Avulso'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4 items-end">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</label>
              {isAdHoc ? (
                <input type="text" value={adHocName} onChange={e => setAdHocName(e.target.value)} placeholder="Ex: Panfleto Especial" className="w-full p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm" />
              ) : (
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm appearance-none" onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value) || null)}>
                  <option value="">Selecione um produto...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Base</label>
                 <input type="number" value={isAdHoc ? adHocPrice : selectedProduct?.price || 0} onChange={e => isAdHoc && setAdHocPrice(parseFloat(e.target.value))} disabled={!isAdHoc} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</label>
                 <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
               </div>
            </div>

            {selectedProduct && selectedProduct.hasSize && (
              <div className="md:col-span-4 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamanho</label>
                  <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm">
                    <option value="">Selecione...</option>
                    {selectedProduct.availableSizes?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tema / Arte</label>
                  <input type="text" value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)} placeholder="Ex: Super Mário" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm" />
                </div>
              </div>
            )}

            <button onClick={addItem} className="md:col-span-4 py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
              <Plus className="w-6 h-6"/> ADICIONAR AO CARRINHO
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens no Pedido ({items.length})</p></div>
            <div className="divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800 leading-tight">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Qtd: {item.quantity} | {item.selectedSize ? `Tam: ${item.selectedSize}` : ''} {item.selectedTheme ? `| Tema: ${item.selectedTheme}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <p className="text-sm font-black text-indigo-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</p>
                    <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Sidebar (Mobile Inferior / Desktop Direita) */}
      <div className="lg:col-span-4 space-y-6 order-2">
        <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500"/> Pagamento</h4>
          
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'CASH', label: 'Dinheiro', icon: Banknote },
              { id: 'PIX', label: 'PIX', icon: Smartphone },
              { id: 'DEBIT', label: 'Débito', icon: CreditCard },
              { id: 'CREDIT', label: 'Crédito', icon: CreditCard }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => {setPaymentMethod(m.id as any); if(m.id !== 'CREDIT') setInstallments(1);}}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all gap-1.5 ${paymentMethod === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                <m.icon className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>

          {(paymentMethod === 'CASH' || paymentMethod === 'PIX') && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              <button onClick={() => setPaymentOption('FULL')} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${paymentOption === 'FULL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>INTEGRAL</button>
              <button onClick={() => setPaymentOption('SPLIT')} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${paymentOption === 'SPLIT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>50% SINAL</button>
            </div>
          )}

          {paymentMethod === 'CREDIT' && (
             <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-indigo-900 text-xs">
               {[1,2,3,4,5,6].map(i => <option key={i} value={i}>{i}x Parcelas</option>)}
             </select>
          )}
        </div>

        <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="relative z-10 space-y-3">
            <div className="flex justify-between text-indigo-300 text-[10px] font-bold uppercase tracking-widest"><span>Subtotal</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span></div>
            {shippingOption && <div className="flex justify-between text-indigo-300 text-[10px] font-bold uppercase tracking-widest"><span>Frete</span><span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingOption.price)}</span></div>}
            {gatewayFee > 0 && <div className="flex justify-between text-indigo-200 text-[10px] font-bold uppercase tracking-widest"><span>Taxas</span><span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gatewayFee)}</span></div>}

            <div className="pt-4 flex flex-col items-end border-t border-white/10">
              <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Total a Receber</p>
              <h3 className="text-4xl font-black tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}</h3>
              {paymentOption === 'SPLIT' && (
                <div className="mt-4 text-center bg-white/5 p-4 rounded-3xl border border-white/10 w-full animate-in slide-in-from-top-2">
                  <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1">Valor do Sinal (50%)</p>
                  <p className="text-2xl font-black text-emerald-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal / 2)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-3 relative z-10">
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={handleOpenWhatsappModal} className="py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest hover:bg-emerald-500/20"><MessageCircle className="w-4 h-4"/> Enviar WA</button>
              <button onClick={handleSaveAsBudget} className="py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest hover:bg-white/20"><FileBadge className="w-4 h-4"/> Salvar Orç.</button>
            </div>
            <button onClick={handleSaveAsOrder} className="w-full py-5 bg-indigo-500 text-white font-black rounded-[24px] shadow-2xl hover:bg-indigo-400 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-indigo-700"><CheckCircle2 className="w-6 h-6"/> {isEditing ? 'ATUALIZAR PEDIDO' : 'GERAR PEDIDO'}</button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 mb-20 lg:mb-0">
           <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" onChange={e => setShippingOption(settings.shippingOptions.find(o => o.id === e.target.value) || null)}>
              <option value="">Selecione o Frete...</option>
              {settings.shippingOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name} - R$ {opt.price}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase" placeholder="CUPOM" />
              <button onClick={applyCoupon} className="px-5 bg-indigo-600 text-white rounded-2xl"><Check className="w-5 h-5"/></button>
            </div>
        </div>
      </div>

      {showWhatsappModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white rounded-t-[40px] lg:rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">Enviar para Cliente</h3><button onClick={() => setShowWhatsappModal(false)} className="p-2 bg-slate-50 rounded-full"><X/></button></div>
            <div className="p-8 space-y-6">
              <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-sm leading-relaxed" />
              <div className="flex gap-3">
                <button onClick={() => finalizeSaveWA(false)} className="flex-1 py-4 bg-slate-100 font-black text-slate-500 rounded-2xl text-[10px] uppercase">Salvar sem Enviar</button>
                <button onClick={() => finalizeSaveWA(true)} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 text-[10px] uppercase"><MessageCircle className="w-4 h-4"/> Enviar Agora</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewQuotation;
