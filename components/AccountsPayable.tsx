
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Search,
  Wallet,
  ArrowDownRight,
  Filter,
  X
} from 'lucide-react';
import { PayableAccount, PayableStatus } from '../types';
import { storage } from '../services/storageService';

const AccountsPayable: React.FC = () => {
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Geral');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    const data = storage.getPayables().sort((a, b) => {
      // Ordenar por status (Pendentes primeiro) e depois por data
      if (a.status === 'PENDING' && b.status === 'PAID') return -1;
      if (a.status === 'PAID' && b.status === 'PENDING') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    setPayables(data);
  };

  const handleSave = () => {
    if (!description || amount <= 0 || !dueDate) {
      alert('Preencha os campos obrigatórios (Descrição, Valor e Vencimento)');
      return;
    }
    const newAccount: PayableAccount = {
      id: Math.random().toString(36).substr(2, 9),
      description,
      amount,
      dueDate,
      category,
      provider,
      status: 'PENDING'
    };
    storage.savePayable(newAccount);
    setIsAdding(false);
    resetForm();
    refresh();
  };

  const resetForm = () => {
    setDescription(''); setAmount(0); setDueDate(''); setCategory('Geral'); setProvider('');
  };

  const markAsPaid = (p: PayableAccount) => {
    const updated = { 
      ...p, 
      status: 'PAID' as PayableStatus, 
      paidAt: new Date().toISOString() 
    };
    storage.savePayable(updated);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este registro permanentemente?')) {
      storage.deletePayable(id);
      refresh();
    }
  };

  const getStatusBadge = (p: PayableAccount) => {
    if (p.status === 'PAID') return (
      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3"/> PAGO
      </span>
    );
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(p.dueDate);
    due.setHours(0,0,0,0);

    if (due < today) return (
      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit animate-pulse">
        <AlertTriangle className="w-3 h-3"/> ATRASADO
      </span>
    );
    
    if (due.getTime() === today.getTime()) return (
      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
        <Clock className="w-3 h-3"/> VENCE HOJE
      </span>
    );
    
    return (
      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
        <Calendar className="w-3 h-3"/> PENDENTE
      </span>
    );
  };

  const filtered = payables.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = filtered.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = filtered.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Contas a Pagar</h3>
          <p className="text-sm text-slate-500 font-medium">Gestão de despesas e obrigações financeiras</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por descrição ou fornecedor..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 active:scale-95 transition-all">
            <Plus className="w-4 h-4"/> NOVA CONTA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-red-200 transition-colors">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform"><ArrowDownRight className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</p>
            <p className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle2 className="w-6 h-6"/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pago no Mês</p>
            <p className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-indigo-900 p-6 rounded-[32px] text-white shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="p-4 bg-white/10 rounded-2xl"><Wallet className="w-6 h-6"/></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Vencendo nos próximos 7 dias</p>
            <p className="text-2xl font-black">
              {filtered.filter(p => p.status === 'PENDING' && new Date(p.dueDate).getTime() <= (new Date().getTime() + 7 * 24 * 60 * 60 * 1000)).length} Contas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição / Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.status === 'PAID' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">{getStatusBadge(p)}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 leading-tight">{p.description}</p>
                    <p className="text-[10px] text-indigo-500 uppercase font-black mt-0.5 tracking-tighter">{p.category}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.provider || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {new Date(p.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {p.status === 'PENDING' && (
                        <button 
                          onClick={() => markAsPaid(p)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 text-[10px] font-black uppercase shadow-md shadow-emerald-100"
                        >
                          <CheckCircle2 className="w-3 h-3"/> Dar Baixa
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-24 text-center">
              <DollarSign className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma despesa registrada.</p>
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><Plus className="w-6 h-6 text-indigo-600"/></div>
                Nova Despesa
              </h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Pagamento</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="Ex: Aluguel da Loja" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={amount || ''} 
                  onChange={e => setAmount(parseFloat(e.target.value))} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornecedor</label>
                <input 
                  type="text" 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Fixo">Fixo</option>
                  <option value="Material">Material</option>
                  <option value="Equipamento">Equipamento</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Geral">Outros / Geral</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-8">
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
              >
                Descartar
              </button>
              <button 
                onClick={handleSave} 
                className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase text-[10px] tracking-widest hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
