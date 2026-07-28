
import React, { useState, useRef } from 'react';
import { Product, PricingMode } from '../types';
import { storage } from '../services/storageService';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Upload, 
  Download, 
  Star, 
  TrendingUp, 
  Image as ImageIcon, 
  FileText,
  Sparkles,
  Loader2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MoreVertical,
  FileSpreadsheet,
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  onUpdate: () => void;
}

const ProductCatalog: React.FC<Props> = ({ products, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [productionCost, setProductionCost] = useState(0);
  const [mode, setMode] = useState<PricingMode>(PricingMode.AREA);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [hiddenInStore, setHiddenInStore] = useState(false);
  
  const [hasSize, setHasSize] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [hasTheme, setHasTheme] = useState(false);
  const [productionTime, setProductionTime] = useState('');

  const kidsSizes = ['2', '4', '6', '8', '10', '12', '14', '16'];
  const adultSizes = ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];

  const resetForm = () => {
    setName(''); 
    setDescription('');
    setPrice(0); 
    setProductionCost(0); 
    setMode(PricingMode.AREA);
    setCategory(''); 
    setImageUrl(''); 
    setIsHighlighted(false);
    setHiddenInStore(false);
    setHasSize(false);
    setAvailableSizes([]);
    setHasTheme(false);
    setProductionTime('');
    setIsAdding(false); 
    setEditingId(null);
  };

  const handleAiImprove = async () => {
    if (!description && !name) {
      alert("Escreva pelo menos o nome ou um rascunho da descrição.");
      return;
    }

    setIsAiLoading(true);
    try {
      const prompt = `Melhore esta descrição de produto para uma gráfica rápida, tornando-a persuasiva: Produto: ${name}. Categoria: ${category}. Texto base: ${description}.`;
      
      const settings = storage.getSettings();
      const groqKey = settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error("Chave Groq não configurada");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile"
        })
      });

      if (!response.ok) throw new Error("Erro na API da Groq");
      
      const data = await response.json();
      const improvedText = data.choices?.[0]?.message?.content;
      
      if (improvedText) setDescription(improvedText.trim());
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted') || String(error).includes('aborted')) return;
      console.error(error);
      alert("IA indisponível no momento.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleSize = (size: string) => {
    setAvailableSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSave = () => {
    if (!name || price <= 0) return;
    const product: Product = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name, description, price, productionCost, mode, 
      category: category || 'Geral', imageUrl, isHighlighted, hiddenInStore,
      hasSize, availableSizes, hasTheme: hasSize || hasTheme, productionTime
    };
    storage.saveProduct(product);
    onUpdate();
    resetForm();
  };

  const handleEdit = (p: Product) => {
    setName(p.name); 
    setDescription(p.description || '');
    setPrice(p.price); 
    setProductionCost(p.productionCost || 0);
    setMode(p.mode); 
    setCategory(p.category); 
    setImageUrl(p.imageUrl || '');
    setIsHighlighted(!!p.isHighlighted); 
    setHiddenInStore(!!p.hiddenInStore);
    setHasSize(!!p.hasSize);
    setAvailableSizes(p.availableSizes || []);
    setHasTheme(!!p.hasTheme || !!p.hasSize);
    setProductionTime(p.productionTime || '');
    setEditingId(p.id); 
    setIsAdding(true);
  };

  const toggleHighlight = (p: Product) => {
    const updated = { ...p, isHighlighted: !p.isHighlighted };
    storage.saveProduct(updated);
    onUpdate();
  };

  // Funções de Exportação e Importação Excel
  const handleExportExcel = () => {
    const dataToExport = products.map(p => ({
      ID: p.id,
      Nome: p.name,
      Categoria: p.category,
      PrecoVenda: p.price,
      CustoProducao: p.productionCost,
      ModoCobranca: p.mode,
      Descricao: p.description || '',
      LinkImagem: p.imageUrl || '',
      Destaque: p.isHighlighted ? 'Sim' : 'Não',
      OcultoLoja: p.hiddenInStore ? 'Sim' : 'Não',
      TemGrade: p.hasSize ? 'Sim' : 'Não',
      Tamanhos: (p.availableSizes || []).join(', '),
      SolicitarTema: p.hasTheme ? 'Sim' : 'Não',
      PrazoEntrega: p.productionTime || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "catalogo_personalize_plus.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        data.forEach(item => {
          if (!item.Nome || !item.PrecoVenda) return;

          const importedProduct: Product = {
            id: item.ID || Math.random().toString(36).substr(2, 9),
            name: item.Nome,
            category: item.Categoria || 'Geral',
            price: parseFloat(item.PrecoVenda) || 0,
            productionCost: parseFloat(item.CustoProducao) || 0,
            mode: (item.ModoCobranca as PricingMode) || PricingMode.UNIT,
            description: item.Descricao || '',
            imageUrl: item.LinkImagem || '',
            isHighlighted: item.Destaque === 'Sim',
            hiddenInStore: item.OcultoLoja === 'Sim',
            hasSize: item.TemGrade === 'Sim',
            availableSizes: item.Tamanhos ? item.Tamanhos.split(',').map((s: string) => s.trim()) : [],
            hasTheme: item.SolicitarTema === 'Sim',
            productionTime: item.PrazoEntrega || ''
          };
          storage.saveProduct(importedProduct);
        });

        onUpdate();
        alert(`${data.length} produtos processados com sucesso!`);
        if (excelInputRef.current) excelInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Erro ao ler o arquivo Excel. Verifique o formato.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg lg:text-xl font-bold text-slate-800">Meus Produtos</h3>
          <p className="text-xs lg:text-sm text-slate-500">Gestão de itens e catálogo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-2 transition-all border border-emerald-100"
          >
            <Download className="w-4 h-4"/> Exportar Excel
          </button>
          <button 
            onClick={() => excelInputRef.current?.click()}
            className="px-4 py-3 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold hover:bg-amber-100 flex items-center gap-2 transition-all border border-amber-100"
          >
            <Upload className="w-4 h-4"/> Importar Excel
          </button>
          <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          
          <button onClick={() => setIsAdding(true)} className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all">
            <Plus className="w-5 h-5"/> Novo Produto
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-2xl border-2 border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Produto</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobrança</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as PricingMode)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <option value={PricingMode.UNIT}>Unidade</option>
                <option value={PricingMode.AREA}>M² (em cm)</option>
                <option value={PricingMode.MILHEIRO}>Milheiro</option>
              </select>
            </div>
            
            <div className="md:col-span-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                <button onClick={handleAiImprove} disabled={isAiLoading} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-200 flex items-center gap-1">
                  {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 text-sm" />
            </div>

            <div className="md:col-span-4 bg-slate-50 p-4 lg:p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Configurações Avançadas</h4>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={hiddenInStore} onChange={e => setHiddenInStore(e.target.checked)} className="w-4 h-4 accent-red-600" />
                  <label className="text-xs font-bold text-slate-500">Ocultar na Loja Online</label>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={hasSize} onChange={e => {setHasSize(e.target.checked); if(e.target.checked) setHasTheme(true);}} className="w-5 h-5 accent-indigo-600"/>
                    <label className="text-xs font-bold text-slate-700">Ter Grade de Tamanhos</label>
                  </div>
                  {hasSize && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {adultSizes.map(s => (
                        <button key={s} onClick={() => toggleSize(s)} className={`px-3 py-2 rounded-lg text-[10px] font-black border-2 transition-all ${availableSizes.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                   <div className="flex items-center gap-2">
                    <input type="checkbox" checked={hasTheme || hasSize} onChange={e => setHasTheme(e.target.checked)} disabled={hasSize} className="w-5 h-5 accent-indigo-600"/>
                    <label className="text-xs font-bold text-slate-700">Solicitar Tema/Arte</label>
                  </div>
                  <input type="text" value={productionTime} onChange={e => setProductionTime(e.target.value)} placeholder="Prazo (Ex: 3 dias)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-600 uppercase">Custo Produção</label>
              <input type="number" value={productionCost} onChange={(e) => setProductionCost(parseFloat(e.target.value) || 0)} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-indigo-600 uppercase">Preço Venda</label>
              <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl" />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end pt-4">
              <button onClick={resetForm} className="flex-1 lg:flex-none px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancelar</button>
              <button onClick={handleSave} className="flex-1 lg:flex-none px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-xl shadow-indigo-100">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-3">
        {products.map(p => {
          const profit = p.price - p.productionCost;
          const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
          return (
            <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-black text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${margin > 40 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>+{margin.toFixed(0)}%</span>
                </div>
                <div className="flex gap-1 mt-1.5 items-center">
                  {p.isHighlighted && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                  {p.hiddenInStore && <EyeOff className="w-3 h-3 text-slate-300" />}
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEdit(p)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                <button onClick={() => { if(confirm('Excluir?')) { storage.deleteProduct(p.id); onUpdate(); } }} className="p-2.5 bg-red-50 text-red-300 rounded-xl"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Margem</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Visibilidade</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => {
               const profit = p.price - p.productionCost;
               const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
               return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-200" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{p.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{p.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-indigo-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[11px] font-black ${margin > 30 ? 'text-emerald-600' : 'text-amber-500'}`}>{margin.toFixed(0)}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${p.hiddenInStore ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      {p.hiddenInStore ? 'Oculto' : 'Visível'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => toggleHighlight(p)} className={`p-2 rounded-xl ${p.isHighlighted ? 'bg-yellow-50 text-yellow-500' : 'text-slate-300'}`} title="Destacar"><Star className="w-4 h-4 fill-current"/></button>
                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600" title="Editar"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => { if(confirm('Excluir?')) { storage.deleteProduct(p.id); onUpdate(); } }} className="p-2 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductCatalog;
