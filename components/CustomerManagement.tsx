
import React, { useState, useEffect } from 'react';
import { Customer, Quotation } from '../types';
import { storage } from '../services/storageService';
import { UserPlus, Search, Phone, FileText, MapPin, CreditCard, Trash2, X, History, User, Edit2 } from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setQuotations(storage.getQuotations());
  }, []);

  const handleSave = () => {
    if (!name || !phone) return;
    
    const customer: Customer = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name, phone, cpf, address,
      createdAt: editingId ? (customers.find(c => c.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    
    storage.saveCustomer(customer);
    setCustomers(storage.getCustomers());
    resetForm();
  };

  const handleEdit = (c: Customer) => {
    setName(c.name);
    setPhone(c.phone);
    setCpf(c.cpf);
    setAddress(c.address);
    setEditingId(c.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName(''); setPhone(''); setCpf(''); setAddress('');
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cpf.includes(searchTerm)
  );

  const getHistory = (phone: string) => {
    return quotations.filter(q => q.customerContact.replace(/\D/g, '') === phone.replace(/\D/g, ''));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Clientes</h3>
          <p className="text-sm text-slate-500">Base de dados e histórico de consumo</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, fone ou CPF..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none w-64"
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nome / CPF</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedCustomer?.id === c.id ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><CreditCard className="w-3 h-3"/> {c.cpf || 'Não Informado'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3"/> {c.phone}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {c.address ? 'Endereço Cadastrado' : 'Sem Endereço'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm('Excluir?')) { storage.deleteCustomer(c.id); setCustomers(storage.getCustomers()); } }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-12 text-center text-slate-400 italic">Nenhum cliente encontrado.</div>}
        </div>

        <div className="space-y-6">
          {selectedCustomer ? (
            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-lg animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-600 p-4 rounded-2xl text-white"><User className="w-8 h-8"/></div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedCustomer)} className="p-2 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-50"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => setSelectedCustomer(null)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><X className="w-4 h-4 text-slate-300"/></button>
                </div>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-1">{selectedCustomer.name}</h4>
              <p className="text-sm text-slate-500 mb-6">{selectedCustomer.address || 'Sem endereço cadastrado'}</p>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><History className="w-4 h-4" /> Histórico de Compras</p>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                  {getHistory(selectedCustomer.phone).map(q => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-indigo-600">{q.id}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-black text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.total)}</p>
                      <p className="text-[10px] text-slate-400">{q.items.length} itens no pedido</p>
                    </div>
                  ))}
                  {getHistory(selectedCustomer.phone).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Sem compras registradas.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-900 p-8 rounded-3xl text-white text-center flex flex-col items-center">
              <div className="bg-white/10 p-4 rounded-full mb-4"><Search className="w-8 h-8 opacity-50"/></div>
              <h4 className="font-bold mb-2">Selecione um cliente</h4>
              <p className="text-sm text-indigo-200">Clique em um cliente na lista para ver detalhes e histórico.</p>
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6 text-indigo-900">{editingId ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CPF</label>
                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Endereço Completo</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2 pt-8">
              <button onClick={resetForm} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Salvar Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
