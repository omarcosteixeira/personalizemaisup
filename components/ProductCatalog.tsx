
import React, { useState, useRef, useEffect } from 'react';
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
  EyeOff,
  Search,
  Tag,
  Filter
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

  // Categorias do sistema
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => storage.getProductCategories());
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [productionCost, setProductionCost] = useState(0);
  const [mode, setMode] = useState<PricingMode>(PricingMode.AREA);
  const [category, setCategory] = useState(() => availableCategories[0] || 'Geral');
  const [imageUrl, setImageUrl] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [hiddenInStore, setHiddenInStore] = useState(false);
  
  const [hasSize, setHasSize] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [hasTheme, setHasTheme] = useState(false);
  const [productionTime, setProductionTime] = useState('');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
  const [isDigitalProduct, setIsDigitalProduct] = useState(false);

  const kidsSizes = ['2', '4', '6', '8', '10', '12', '14', '16'];
  const adultSizes = ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];

  useEffect(() => {
    setAvailableCategories(storage.getProductCategories());
  }, [isAdding, products]);

  const handleAddNewCategoryPrompt = () => {
    const newCat = window.prompt('Digite o nome da nova categoria:');
    if (newCat && newCat.trim()) {
      const trimmed = newCat.trim();
      storage.saveProductCategory(trimmed);
      const updated = storage.getProductCategories();
      setAvailableCategories(updated);
      setCategory(trimmed);
    }
  };

  const resetForm = () => {
    setName(''); 
    setDescription('');
    setPrice(0); 
    setProductionCost(0); 
    setMode(PricingMode.AREA);
    const cats = storage.getProductCategories();
    setCategory(cats[0] || 'Geral'); 
    setImageUrl(''); 
    setIsHighlighted(false);
    setHiddenInStore(false);
    setHasSize(false);
    setAvailableSizes([]);
    setHasTheme(false);
    setProductionTime('');
    setDigitalFileUrl('');
    setIsDigitalProduct(false);
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
    if (!name.trim()) {
      alert('Por favor, informe o Nome do Produto.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert('Por favor, informe um Preço de Venda válido (maior que zero).');
      return;
    }

    try {
      const product: Product = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        name: name.trim(), 
        description: description.trim(), 
        price: Number(price), 
        productionCost: Number(productionCost) || 0, 
        mode, 
        category: category || 'Geral', 
        imageUrl: imageUrl.trim(), 
        isHighlighted, 
        hiddenInStore,
        hasSize, 
        availableSizes, 
        hasTheme: hasSize || hasTheme, 
        productionTime: productionTime.trim(),
        digitalFileUrl: digitalFileUrl.trim() || undefined
      };
      storage.saveProduct(product);
      onUpdate();
      resetForm();
      alert('✅ Produto salvo com sucesso!');
    } catch (e: any) {
      console.error("Erro ao salvar produto:", e);
      alert('Erro ao salvar produto: ' + (e?.message || 'Tente novamente.'));
    }
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
    setDigitalFileUrl(p.digitalFileUrl || '');
    setIsDigitalProduct(!!p.digitalFileUrl || (p.category || '').toLowerCase().includes('digital'));
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
      LinkArquivoDigital: p.digitalFileUrl || '',
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
            digitalFileUrl: item.LinkArquivoDigital || undefined,
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
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                <button
                  type="button"
                  onClick={handleAddNewCategoryPrompt}
                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  + Nova
                </button>
              </div>
              <select 
                value={category} 
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    handleAddNewCategoryPrompt();
                  } else {
                    const selectedCat = e.target.value;
                    setCategory(selectedCat);
                    if (selectedCat.toLowerCase().includes('digital')) {
                      setIsDigitalProduct(true);
                    }
                  }
                }} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-sm"
              >
                <option value="" disabled>Selecione uma categoria...</option>
                {category && !availableCategories.includes(category) && (
                  <option value={category}>{category}</option>
                )}
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__NEW__" className="text-indigo-600 font-bold">+ Criar nova categoria...</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobrança</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as PricingMode)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <option value={PricingMode.UNIT}>Unidade</option>
                <option value={PricingMode.AREA}>M² (Metro Quadrado)</option>
                <option value={PricingMode.MILHEIRO}>Milheiro</option>
              </select>
            </div>

            {/* Quick Digital Product Bar */}
            <div className="md:col-span-4 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-slate-50 border border-sky-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all ${isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl ? 'bg-sky-600 text-white shadow-md shadow-sky-200' : 'bg-slate-200 text-slate-500'}`}>
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Produto Digital (Download)</span>
                    {(isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl) && (
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[9px] font-black rounded-full uppercase">Opção Ativa</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl
                      ? 'Adicione o link do arquivo abaixo para envio automático ao cliente no WhatsApp.'
                      : 'Marque caso este produto seja um arquivo digital para envio ao cliente.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const next = !(isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl);
                    setIsDigitalProduct(next);
                    if (next && !category.toLowerCase().includes('digital')) {
                      setCategory('Produto Digital');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl
                      ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-700'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl
                    ? '✓ Produto Digital Ativado'
                    : '+ Adicionar Link de Download'}
                </button>
              </div>
            </div>

            {(isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl) && (
              <div className="md:col-span-4 bg-sky-50/90 border-2 border-sky-300 p-4 lg:p-5 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-black text-sky-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-sky-600" /> Link do Arquivo Digital (Download) - Opcional
                  </label>
                  <div className="flex items-center gap-2">
                    {digitalFileUrl && (
                      <a
                        href={digitalFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" /> Testar Link
                      </a>
                    )}
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                      Envio no WhatsApp na Entrega
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <input 
                    type="url" 
                    value={digitalFileUrl} 
                    onChange={(e) => setDigitalFileUrl(e.target.value)} 
                    placeholder="Ex: https://drive.google.com/... ou https://dropbox.com/... ou link direto do arquivo" 
                    className="w-full p-3.5 bg-white border border-sky-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 shadow-xs" 
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-sky-800 gap-2 pt-1">
                    <p>
                      💡 <strong>Como funciona:</strong> Ao marcar o pedido como <strong>"Entrega"</strong> no sistema, o cliente receberá uma mensagem personalizada no WhatsApp com este link para download direto!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDigitalFileUrl('');
                        setIsDigitalProduct(false);
                      }}
                      className="text-[10px] text-sky-600 hover:text-red-500 font-bold shrink-0 self-end sm:self-auto"
                    >
                      Remover link
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={isDigitalProduct || category.trim().toLowerCase().includes('digital') || !!digitalFileUrl} 
                      onChange={e => {
                        setIsDigitalProduct(e.target.checked);
                        if (e.target.checked && !category.toLowerCase().includes('digital')) {
                          setCategory('Produto Digital');
                        }
                      }} 
                      className="w-5 h-5 accent-sky-600"
                    />
                    <label className="text-xs font-bold text-slate-700">Produto Digital (Link de Download)</label>
                  </div>
                  <p className="text-[10px] text-slate-400">Habilita o envio do link do arquivo no WhatsApp</p>
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

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Categoria:</span>
          <select
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
            className="w-full md:w-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODAS">Todas as Categorias ({products.length})</option>
            {availableCategories.map(cat => {
              const count = products.filter(p => p.category?.trim().toLowerCase() === cat.trim().toLowerCase()).length;
              return (
                <option key={cat} value={cat}>{cat} ({count})</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-3">
        {(() => {
          const filtered = products.filter(p => {
            const matchesSearch = !searchQuery.trim() || 
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedFilterCategory === 'TODAS' || 
              p.category?.trim().toLowerCase() === selectedFilterCategory.trim().toLowerCase();
            return matchesSearch && matchesCategory;
          });

          if (filtered.length === 0) {
            return (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-bold">Nenhum produto encontrado nesta categoria ou busca.</p>
              </div>
            );
          }

          return filtered.map(p => {
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
                  <div className="flex gap-1 mt-1.5 items-center flex-wrap">
                    {p.isHighlighted && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                    {p.hiddenInStore && <EyeOff className="w-3 h-3 text-slate-300" />}
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.category}</span>
                    {p.digitalFileUrl && (
                      <span className="text-[8px] font-bold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-sky-100">
                        <Download className="w-2.5 h-2.5" /> Arquivo Digital
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => { if(confirm('Excluir?')) { storage.deleteProduct(p.id); onUpdate(); } }} className="p-2.5 bg-red-50 text-red-300 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            );
          });
        })()}
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
            {(() => {
              const filtered = products.filter(p => {
                const matchesSearch = !searchQuery.trim() || 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesCategory = selectedFilterCategory === 'TODAS' || 
                  p.category?.trim().toLowerCase() === selectedFilterCategory.trim().toLowerCase();
                return matchesSearch && matchesCategory;
              });

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      Nenhum produto encontrado nesta categoria ou busca.
                    </td>
                  </tr>
                );
              }

              return filtered.map(p => {
                const profit = p.price - p.productionCost;
                const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-200" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-700">{p.name}</p>
                          {p.digitalFileUrl && (
                            <span className="text-[9px] font-bold bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-sky-100" title={p.digitalFileUrl}>
                              <Download className="w-2.5 h-2.5 text-sky-600" /> Digital
                            </span>
                          )}
                        </div>
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
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductCatalog;
