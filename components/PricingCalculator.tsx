
import React, { useState, useEffect } from 'react';
import { Product, PricingMode, StockItem } from '../types';
import { storage } from '../services/storageService';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Clock, 
  Layers,
  Save,
  Plus,
  Trash2,
  Package,
  Info,
  Calendar,
  Wallet,
  Settings2
} from 'lucide-react';

interface Props {
  products: Product[];
  onProductCreated: () => void;
}

interface MaterialComposition {
  id: string;
  stockItemId: string;
  name: string;
  unit: string;
  unitCost: number;
  quantity: number;
}

const PricingCalculator: React.FC<Props> = ({ products, onProductCreated }) => {
  const settings = storage.getSettings();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialComposition[]>([]);
  const [manualMaterialCost, setManualMaterialCost] = useState(0);
  
  // Financial Setup
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(settings.financials?.monthlyFixedCosts || 0);
  const [desiredSalary, setDesiredSalary] = useState(settings.financials?.desiredMonthlySalary || 0);
  const [workingDays, setWorkingDays] = useState(settings.financials?.workingDaysPerMonth || 22);
  const [hoursPerDay, setHoursPerDay] = useState(settings.financials?.hoursPerDay || 8);
  
  // Product Labor
  const [productionTimeMinutes, setProductionTimeMinutes] = useState(30);
  
  const [fixedExpensesPercent, setFixedExpensesPercent] = useState(15);
  const [profitMarginPercent, setProfitMarginPercent] = useState(30);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');

  useEffect(() => {
    setStock(storage.getStock());
  }, []);

  // Persistir automaticamente os dados financeiros quando alterados (Auto-save)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSettings = storage.getSettings();
      const updatedSettings = {
        ...currentSettings,
        financials: {
          monthlyFixedCosts,
          desiredMonthlySalary: desiredSalary,
          workingDaysPerMonth: workingDays,
          hoursPerDay
        }
      };
      // Só salva se houver mudança real para evitar loops
      if (JSON.stringify(currentSettings.financials) !== JSON.stringify(updatedSettings.financials)) {
        storage.saveSettings(updatedSettings);
      }
    }, 1500); // Debounce de 1.5s
    return () => clearTimeout(timer);
  }, [monthlyFixedCosts, desiredSalary, workingDays, hoursPerDay]);

  // Calculate Hourly Rate
  const totalMonthlyNeeds = monthlyFixedCosts + desiredSalary;
  const totalMonthlyHours = workingDays * hoursPerDay;
  const hourlyRate = totalMonthlyHours > 0 ? totalMonthlyNeeds / totalMonthlyHours : 0;
  
  // Calculate Item Labor Cost
  const itemLaborCost = (productionTimeMinutes / 60) * hourlyRate;

  // Material Costs
  const compositionCost = selectedMaterials.reduce((acc, m) => acc + (m.unitCost * m.quantity), 0);
  const totalMaterialCost = compositionCost + manualMaterialCost;
  
  // Final Totals
  const totalDirectCost = totalMaterialCost + itemLaborCost;
  const totalMargins = (fixedExpensesPercent + profitMarginPercent) / 100;
  
  const divisor = 1 - totalMargins;
  const suggestedPrice = divisor > 0 ? totalDirectCost / divisor : 0;
  const markup = totalDirectCost > 0 ? (suggestedPrice / totalDirectCost) : 0;
  const netProfitAmount = suggestedPrice - totalDirectCost - (suggestedPrice * (fixedExpensesPercent / 100));

  const addMaterial = () => {
    const item = stock.find(s => s.id === selectedStockId);
    if (!item) return;

    const exists = selectedMaterials.find(m => m.stockItemId === item.id);
    if (exists) {
      alert('Este material já está na composição.');
      return;
    }

    const newMaterial: MaterialComposition = {
      id: Math.random().toString(36).substr(2, 9),
      stockItemId: item.id,
      name: item.name,
      unit: item.unit,
      unitCost: item.cost,
      quantity: 1
    };

    setSelectedMaterials([...selectedMaterials, newMaterial]);
    setSelectedStockId('');
  };

  const removeMaterial = (id: string) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== id));
  };

  const updateMaterialQty = (id: string, qty: number) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.id === id ? { ...m, quantity: Math.max(0, qty) } : m
    ));
  };

  const handleSaveToCatalog = () => {
    if (!name || suggestedPrice <= 0) {
      alert('Preencha o nome e certifique-se de que o preço sugerido é válido.');
      return;
    }

    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category: category || 'Geral',
      price: parseFloat(suggestedPrice.toFixed(2)),
      productionCost: parseFloat(totalDirectCost.toFixed(2)),
      mode: PricingMode.UNIT,
      productionTime: `${productionTimeMinutes} min`
    };

    storage.saveProduct(newProduct);
    onProductCreated();
    alert('Produto salvo no catálogo com sucesso!');
    
    // Reset
    setName('');
    setSelectedMaterials([]);
    setManualMaterialCost(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUNA 1 & 2: INPUTS */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SETUP FINANCEIRO DA EMPRESA */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Configuração de Custo Fixo e Hora
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Custos Fixos (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={monthlyFixedCosts} 
                    onChange={e => setMonthlyFixedCosts(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Luz, aluguel..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Pro-labore (R$)</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={desiredSalary} 
                    onChange={e => setDesiredSalary(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Seu salário..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Dias/Mês</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={workingDays} 
                    onChange={e => setWorkingDays(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Horas/Dia</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={hoursPerDay} 
                    onChange={e => setHoursPerDay(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-2xl flex items-center justify-between border border-indigo-100">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-lg shadow-sm"><TrendingUp className="w-5 h-5 text-indigo-600"/></div>
                 <p className="text-sm font-bold text-indigo-900">Valor da sua hora de operação:</p>
               </div>
               <span className="text-xl font-black text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(hourlyRate)}</span>
            </div>
          </div>

          {/* COMPOSIÇÃO DO PRODUTO */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500"/> Composição do Produto
            </h4>

            {/* Insumos */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-600">Adicionar Insumos do Estoque</label>
              <div className="flex gap-2">
                <select 
                  value={selectedStockId} 
                  onChange={e => setSelectedStockId(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Buscar material...</option>
                  {stock.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.unit}) - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.cost)}</option>
                  ))}
                </select>
                <button 
                  onClick={addMaterial}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Incluir
                </button>
              </div>

              {selectedMaterials.length > 0 && (
                <div className="border border-slate-100 rounded-2xl overflow-hidden mt-4">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Insumo</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-right">Custo</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedMaterials.map(m => (
                        <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700">{m.name}</td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              value={m.quantity} 
                              onChange={e => updateMaterialQty(m.id, parseFloat(e.target.value) || 0)}
                              className="w-16 mx-auto block p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.unitCost * m.quantity)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => removeMaterial(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tempo de Mão de Obra */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-indigo-500" /> Tempo de Produção (Minutos)
                 </label>
                 <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="480" 
                      value={productionTimeMinutes} 
                      onChange={e => setProductionTimeMinutes(parseInt(e.target.value))}
                      className="flex-1 accent-indigo-600"
                    />
                    <input 
                      type="number" 
                      value={productionTimeMinutes} 
                      onChange={e => setProductionTimeMinutes(parseInt(e.target.value) || 0)}
                      className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-black"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Custo de Mão de Obra p/ este item: <span className="text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemLaborCost)}</span></p>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                   <DollarSign className="w-4 h-4 text-emerald-500" /> Outros Custos Diretos (R$)
                 </label>
                 <input 
                    type="number" 
                    value={manualMaterialCost || ''} 
                    onChange={e => setManualMaterialCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    placeholder="Embalagem, fitas, etc..."
                  />
               </div>
            </div>
          </div>
        </div>

        {/* COLUNA 3: RESULTADOS */}
        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="relative z-10 text-center pt-4">
               <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Venda Sugerida por Unidade</p>
               <h2 className="text-6xl font-black tracking-tighter mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(suggestedPrice)}
               </h2>
               <div className="inline-block px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-400/20">
                 <span className="text-xs font-bold text-indigo-200">Markup: {markup.toFixed(2)}x</span>
               </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-indigo-300">Custo de Materiais:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMaterialCost)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-indigo-300">Custo Mão de Obra:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemLaborCost)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-3 border-t border-white/10">
                  <span className="text-indigo-300">Custo Direto Total:</span>
                  <span className="text-indigo-100">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDirectCost)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Despesas Fixas %</label>
                   <input 
                    type="number" 
                    value={fixedExpensesPercent} 
                    onChange={e => setFixedExpensesPercent(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white text-center"
                  />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Margem Lucro %</label>
                   <input 
                    type="number" 
                    value={profitMarginPercent} 
                    onChange={e => setProfitMarginPercent(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-black text-emerald-400 text-center"
                  />
                 </div>
              </div>

              <div className="p-4 bg-emerald-500 text-white rounded-[24px] shadow-xl shadow-emerald-900/20 text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Lucro Líquido p/ Unidade</p>
                 <p className="text-2xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfitAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Finalizar e Salvar no Catálogo</h5>
            <div className="space-y-3">
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="Nome do produto..."
              />
              <input 
                type="text" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Categoria (ex: Camisetas)"
              />
              <button 
                onClick={handleSaveToCatalog}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" /> CRIAR PRODUTO
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;
