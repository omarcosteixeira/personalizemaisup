
import React, { useState, useEffect } from 'react';
import { Plus, Package, ArrowUpCircle, ArrowDownCircle, Search, AlertCircle, History, Trash2 } from 'lucide-react';
import { Product, StockItem, StockMovement } from '../types';
import { storage } from '../services/storageService';

interface Props {
  products: Product[];
  onUpdate: () => void;
}

const StockManagement: React.FC<Props> = ({ products, onUpdate }) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<'IN' | 'OUT' | null>(null);
  const [selectedStockId, setSelectedStockId] = useState('');

  // Form states
  const [newItem, setNewItem] = useState({ name: '', unit: 'un', minQuantity: 0, currentQuantity: 0, cost: 0 });
  const [moveForm, setMoveForm] = useState({ quantity: 0, reason: '' });

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setStock(storage.getStock());
    setMovements(storage.getStockMovements());
  };

  const handleCreateItem = () => {
    if (!newItem.name) return;
    const item: StockItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9)
    };
    storage.saveStockItem(item);
    setIsAddingItem(false);
    setNewItem({ name: '', unit: 'un', minQuantity: 0, currentQuantity: 0, cost: 0 });
    refresh();
  };

  const handleMovement = () => {
    if (!selectedStockId || moveForm.quantity <= 0 || !showMoveModal) return;
    
    const movement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      stockItemId: selectedStockId,
      type: showMoveModal,
      quantity: moveForm.quantity,
      reason: moveForm.reason,
      date: new Date().toISOString()
    };

    storage.addStockMovement(movement);
    setShowMoveModal(null);
    setMoveForm({ quantity: 0, reason: '' });
    refresh();
    onUpdate();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja remover este material do estoque?')) {
      storage.deleteStockItem(id);
      refresh();
      onUpdate();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Controle de Estoque</h3>
          <p className="text-sm text-slate-500">Gerencie materiais e insumos da produção</p>
        </div>
        <button 
          onClick={() => setIsAddingItem(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Material
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total de Itens</p>
          <p className="text-3xl font-black text-slate-800">{stock.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-red-400 uppercase mb-2">Alerta de Reposição</p>
          <p className="text-3xl font-black text-slate-800">{stock.filter(s => s.currentQuantity <= s.minQuantity).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Movimentações (Mês)</p>
          <p className="text-3xl font-black text-slate-800">{movements.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Insumo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Saldo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Min: {item.minQuantity} {item.unit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${item.currentQuantity <= item.minQuantity ? 'text-red-600' : 'text-slate-800'}`}>
                          {item.currentQuantity}
                        </span>
                        <span className="text-xs text-slate-400">{item.unit}</span>
                        {item.currentQuantity <= item.minQuantity && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedStockId(item.id); setShowMoveModal('IN'); }}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Entrada"
                        >
                          <ArrowUpCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { setSelectedStockId(item.id); setShowMoveModal('OUT'); }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Saída"
                        >
                          <ArrowDownCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 bg-slate-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                          title="Excluir Material"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-indigo-500" /> Histórico Recente
            </h4>
            <div className="space-y-4">
              {movements.slice(0, 8).map(m => {
                const item = stock.find(s => s.id === m.stockItemId);
                return (
                  <div key={m.id} className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className={`mt-1 p-1 rounded-full ${m.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {m.type === 'IN' ? <Plus className="w-3 h-3" /> : <Plus className="w-3 h-3 rotate-45" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item?.name || 'Item Excluído'}</p>
                      <p className="text-xs text-slate-500">{m.quantity} {item?.unit} - {m.reason}</p>
                      <p className="text-[10px] text-slate-400">{new Date(m.date).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${showMoveModal === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
              {showMoveModal === 'IN' ? <ArrowUpCircle /> : <ArrowDownCircle />}
              Registrar {showMoveModal === 'IN' ? 'Entrada' : 'Saída'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Quantidade</label>
                <input 
                  type="number" 
                  value={moveForm.quantity} 
                  onChange={e => setMoveForm({...moveForm, quantity: parseFloat(e.target.value)})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Motivo / Documento</label>
                <input 
                  type="text" 
                  value={moveForm.reason}
                  onChange={e => setMoveForm({...moveForm, reason: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1" 
                  placeholder="Ex: Compra NFe 123"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowMoveModal(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancelar</button>
                <button 
                  onClick={handleMovement}
                  className={`flex-1 py-3 font-bold rounded-xl text-white ${showMoveModal === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-800">
              <Package className="w-6 h-6" /> Cadastrar Novo Material
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Nome do Material</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Unidade</label>
                <input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="m², un, kg..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Custo Médio (R$)</label>
                <input type="number" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Saldo Inicial</label>
                <input type="number" value={newItem.currentQuantity} onChange={e => setNewItem({...newItem, currentQuantity: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Qtd. Mínima (Aviso)</label>
                <input type="number" value={newItem.minQuantity} onChange={e => setNewItem({...newItem, minQuantity: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2 pt-6">
              <button onClick={() => setIsAddingItem(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancelar</button>
              <button onClick={handleCreateItem} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-white">Salvar Insumo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
