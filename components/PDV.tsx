
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Smartphone, 
  Banknote,
  User,
  Package,
  X,
  Tag,
  Calculator
} from 'lucide-react';
import { Product, PricingMode, Quotation, QuotationItem, Customer } from '../types';
import { storage } from '../services/storageService';
import { pdfService } from '../services/pdfService';

interface Props {
  products: Product[];
  onSaleComplete: () => void;
}

const PDV: React.FC<Props> = ({ products, onSaleComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<QuotationItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PIX' | 'DEBIT' | 'CREDIT'>('CASH');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');

  // Modal para produto cobrado por M²
  const [m2ModalProduct, setM2ModalProduct] = useState<Product | null>(null);
  const [m2Height, setM2Height] = useState<number>(0);
  const [m2Width, setM2Width] = useState<number>(0);
  const [m2Unit, setM2Unit] = useState<'m' | 'cm'>('m');
  const [m2Quantity, setM2Quantity] = useState<number>(1);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.mode === PricingMode.AREA) {
      setM2ModalProduct(product);
      setM2Height(0);
      setM2Width(0);
      setM2Unit('m');
      setM2Quantity(1);
      return;
    }

    const existing = cart.find(item => item.productId === product.id && !item.isAdHoc && !item.height);
    if (existing) {
      updateQuantity(existing.id, existing.quantity + 1);
    } else {
      const newItem: QuotationItem = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const confirmAddM2Product = () => {
    if (!m2ModalProduct) return;
    if (m2Height <= 0 || m2Width <= 0) {
      alert('Por favor, informe a Altura e o Comprimento do produto M².');
      return;
    }
    if (m2Quantity <= 0) {
      alert('A quantidade deve ser de no mínimo 1.');
      return;
    }

    const hM = m2Unit === 'cm' ? m2Height / 100 : m2Height;
    const wM = m2Unit === 'cm' ? m2Width / 100 : m2Width;
    const areaTotal = hM * wM * m2Quantity;
    const totalPrice = areaTotal * m2ModalProduct.price;

    const newItem: QuotationItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: m2ModalProduct.id,
      productName: m2ModalProduct.name,
      height: m2Height,
      width: m2Width,
      unitDimension: m2Unit,
      areaM2: areaTotal,
      quantity: m2Quantity,
      unitPrice: m2ModalProduct.price,
      total: totalPrice
    };

    setCart([...cart, newItem]);
    setM2ModalProduct(null);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    setCart(cart.map(item => {
      if (item.id === id) {
        let newTotal = qty * item.unitPrice;
        let newAreaM2 = item.areaM2;
        if (item.height && item.width) {
          const hM = item.unitDimension === 'cm' ? item.height / 100 : item.height;
          const wM = item.unitDimension === 'cm' ? item.width / 100 : item.width;
          newAreaM2 = hM * wM * qty;
          newTotal = newAreaM2 * item.unitPrice;
        }
        return { ...item, quantity: qty, areaM2: newAreaM2, total: newTotal };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);

  const finalizeSale = () => {
    if (cart.length === 0) return;

    const sale: Quotation = {
      id: `PDV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: selectedCustomer?.name || 'Consumidor Balcão',
      customerContact: selectedCustomer?.phone || '-',
      customerId: selectedCustomer?.id,
      items: cart,
      subtotal: subtotal,
      discountValue: 0,
      discountType: 'FIXED',
      shippingValue: 0,
      total: subtotal,
      paymentMethod,
      paymentOption: 'FULL',
      createdAt: new Date().toISOString(),
      status: 'DELIVERED',
      isPaid: true, 
      amountPaid: subtotal, // Venda de balcão é pagamento integral imediato
      paidAt: new Date().toISOString()
    };

    storage.saveQuotation(sale);
    setLastSaleId(sale.id);
    setShowFinishModal(true);
    onSaleComplete();
  };

  const resetPDV = () => {
    setCart([]);
    setSelectedCustomer(null);
    setShowFinishModal(false);
    setSearchTerm('');
  };

  const printLastSale = () => {
    const quotations = storage.getQuotations();
    const last = quotations.find(q => q.id === lastSaleId);
    if (last) {
      pdfService.generateQuotation(last).save(`${last.id}.pdf`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 animate-in fade-in duration-500">
      {/* Esquerda: Catálogo */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar produto por nome ou categoria..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <button onClick={() => setSearchTerm('')} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-100">
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <Package className="w-8 h-8 text-slate-200" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-700 line-clamp-2 mb-1">{p.name}</h4>
              <p className="text-sm font-black text-indigo-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                {p.mode === PricingMode.AREA ? <span className="text-[10px] text-slate-400 font-bold">/m²</span> : null}
              </p>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</span>
                {p.mode === PricingMode.AREA && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-full">
                    Cobrança M²
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Direita: Carrinho e Checkout */}
      <div className="w-full lg:w-96 flex flex-col space-y-6 shrink-0">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-indigo-500"/> Cupom Fiscal</h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{cart.length} ITENS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.map(item => {
              const isItemM2 = !!(item.width && item.height);
              const unit = item.unitDimension || 'm';
              const hM = unit === 'cm' ? item.height! / 100 : item.height!;
              const wM = unit === 'cm' ? item.width! / 100 : item.width!;
              const itemM2 = item.areaM2 || (hM * wM * item.quantity);

              return (
                <div key={item.id} className="flex justify-between items-start group">
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{item.productName}</p>
                    {isItemM2 ? (
                      <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1">
                        📐 {item.height}×{item.width}{unit} ({itemM2.toFixed(2)} m²) • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}/m²
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}/un</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-indigo-600"><Minus className="w-3 h-3"/></button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-indigo-600"><Plus className="w-3 h-3"/></button>
                    </div>
                    <p className="text-sm font-black text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</p>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                <ShoppingCart className="w-12 h-12" />
                <p className="text-sm font-bold">O carrinho está vazio.<br/>Selecione produtos ao lado.</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 space-y-4">
             <div className="flex justify-between items-end mb-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total da Venda</span>
               <span className="text-3xl font-black text-indigo-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
             </div>

             <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', label: 'Dinheiro', icon: Banknote },
                  { id: 'PIX', label: 'PIX', icon: Smartphone },
                  { id: 'DEBIT', label: 'Débito', icon: CreditCard },
                  { id: 'CREDIT', label: 'Crédito', icon: CreditCard }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === m.id ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm' : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">{m.label}</span>
                  </button>
                ))}
             </div>

             <button 
              onClick={finalizeSale}
              disabled={cart.length === 0}
              className={`w-full py-5 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${cart.length === 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
             >
               FINALIZAR (F8)
             </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between group cursor-pointer hover:bg-indigo-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white"><User className="w-4 h-4 text-slate-500" /></div>
            <span className="text-xs font-bold text-slate-700">{selectedCustomer?.name || 'Cliente Consumidor'}</span>
          </div>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ALTERAR</button>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Venda Finalizada!</h3>
            <p className="text-slate-500 text-sm">O comprovante foi registrado e o estoque atualizado com sucesso.</p>
            
            <div className="flex flex-col gap-2 pt-4">
              <button 
                onClick={printLastSale}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
              >
                <Printer className="w-5 h-5" /> Imprimir Recibo
              </button>
              <button 
                onClick={resetPDV}
                className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Produto M² (Altura, Comprimento e Quantidade) */}
      {m2ModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-[36px] shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-full">
                    Cobrança por M²
                  </span>
                  <h3 className="text-lg font-black text-slate-800 leading-tight mt-1">{m2ModalProduct.name}</h3>
                  <p className="text-xs text-slate-400">
                    Preço: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m2ModalProduct.price)} / m²
                  </p>
                </div>
              </div>
              <button onClick={() => setM2ModalProduct(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Unidade */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-2">Unidade das Medidas:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setM2Unit('m')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      m2Unit === 'm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    Metros (m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setM2Unit('cm')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                      m2Unit === 'cm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    Centímetros (cm)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Altura ({m2Unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={m2Height || ''}
                    onChange={e => setM2Height(parseFloat(e.target.value) || 0)}
                    placeholder={`0.00 ${m2Unit}`}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Comprimento ({m2Unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={m2Width || ''}
                    onChange={e => setM2Width(parseFloat(e.target.value) || 0)}
                    placeholder={`0.00 ${m2Unit}`}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Quantidade de Peças
                </label>
                <input
                  type="number"
                  min="1"
                  value={m2Quantity}
                  onChange={e => setM2Quantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Resumo do Cálculo em tempo real */}
              {(() => {
                const hM = m2Unit === 'cm' ? m2Height / 100 : m2Height;
                const wM = m2Unit === 'cm' ? m2Width / 100 : m2Width;
                const areaPerPiece = hM * wM;
                const areaTotal = areaPerPiece * m2Quantity;
                const totalVal = areaTotal * m2ModalProduct.price;

                return (
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Área Total ({m2Quantity} {m2Quantity > 1 ? 'peças' : 'peça'}):</span>
                      <span className="font-black text-indigo-700">{areaTotal.toFixed(2)} m²</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cálculo: {hM.toFixed(2)}m (Alt) × {wM.toFixed(2)}m (Comp) × {m2Quantity} un × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m2ModalProduct.price)}
                    </div>
                    <div className="pt-2 border-t border-indigo-100 flex justify-between items-end">
                      <span className="text-[10px] font-black text-indigo-900 uppercase">Valor Total:</span>
                      <span className="text-2xl font-black text-indigo-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setM2ModalProduct(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddM2Product}
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
              >
                Adicionar ao Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDV;
