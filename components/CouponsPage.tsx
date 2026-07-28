
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { Coupon } from '../types';
import { Plus, Ticket, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [value, setValue] = useState(0);
  const [type, setType] = useState<'FIXED' | 'PERCENT'>('PERCENT');

  useEffect(() => {
    setCoupons(storage.getCoupons());
  }, []);

  const handleSave = () => {
    if (!code) return;
    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      code: code.toUpperCase(),
      value,
      type,
      active: true
    };
    storage.saveCoupon(newCoupon);
    setCoupons(storage.getCoupons());
    setIsAdding(false); setCode(''); setValue(0);
  };

  const toggleStatus = (coupon: Coupon) => {
    const updated = { ...coupon, active: !coupon.active };
    storage.saveCoupon(updated);
    setCoupons(storage.getCoupons());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Cupons de Desconto</h3>
          <p className="text-sm text-slate-500">Crie códigos promocionais para seus clientes</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
          <Plus className="w-4 h-4"/> Novo Cupom
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Código</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl uppercase font-bold" placeholder="EX: VERAO20" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Valor do Desconto</label>
            <input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              <option value="PERCENT">Porcentagem (%)</option>
              <option value="FIXED">Valor Fixo (R$)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Criar</button>
            <button onClick={() => setIsAdding(false)} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl"><X/></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(c => (
          <div key={c.id} className={`p-6 bg-white rounded-3xl border ${c.active ? 'border-indigo-100 shadow-sm' : 'border-slate-100 opacity-60'} relative group`}>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <Ticket className="w-6 h-6" />
              </div>
              <button onClick={() => toggleStatus(c)} className="text-slate-300 hover:text-indigo-600">
                {c.active ? <ToggleRight className="w-8 h-8 text-indigo-600"/> : <ToggleLeft className="w-8 h-8"/>}
              </button>
            </div>
            <h4 className="text-lg font-black text-slate-800 tracking-wider mb-1">{c.code}</h4>
            <p className="text-2xl font-black text-indigo-600">
              {c.type === 'PERCENT' ? `${c.value}% OFF` : `R$ ${c.value} OFF`}
            </p>
            <button onClick={() => { if(confirm('Excluir?')) { storage.deleteCoupon(c.id); setCoupons(storage.getCoupons()); } }} className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponsPage;
