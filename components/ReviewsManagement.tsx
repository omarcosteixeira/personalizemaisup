import React, { useState, useEffect } from 'react';
import { CustomerReview } from '../types';
import { storage } from '../services/storageService';
import { 
  Star, CheckCircle2, XCircle, Clock, Trash2, MessageSquare, 
  Search, Filter, Plus, Send, RefreshCw, ThumbsUp, AlertCircle, 
  ExternalLink, Copy, Check, Sparkles
} from 'lucide-react';

interface Props {
  onReviewsUpdated?: () => void;
}

const ReviewsManagement: React.FC<Props> = ({ onReviewsUpdated }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form para nova avaliação manual/teste
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newOrderId, setNewOrderId] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newMessage, setNewMessage] = useState('');

  const settings = storage.getSettings();
  const storeSlug = settings.slug || 'ateliearianeartes';
  const publicStoreUrl = `${window.location.origin}/${storeSlug}`;

  const loadReviews = () => {
    const list = storage.getReviews();
    setReviews(list);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    storage.updateReviewStatus(id, status);
    loadReviews();
    if (onReviewsUpdated) onReviewsUpdated();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      storage.deleteReview(id);
      loadReviews();
      if (onReviewsUpdated) onReviewsUpdated();
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Atenção: Tem certeza que deseja excluir TODAS as avaliações? Elas não voltarão após a exclusão.')) {
      storage.deleteAllReviews();
      loadReviews();
      if (onReviewsUpdated) onReviewsUpdated();
    }
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newMessage.trim()) {
      alert('Por favor, preencha o nome do cliente e a mensagem.');
      return;
    }

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      orderId: newOrderId.trim() || undefined,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim() || undefined,
      rating: newRating,
      message: newMessage.trim(),
      status: 'APPROVED', // Criada manualmente pelo lojista já pode nascer aprovada
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    storage.saveReview(newRev);
    loadReviews();
    if (onReviewsUpdated) onReviewsUpdated();

    // Reset form
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewOrderId('');
    setNewRating(5);
    setNewMessage('');
    setShowNewModal(false);
  };

  const handleCopyReviewLink = () => {
    const reviewUrl = `${window.location.origin}/${storeSlug}?avaliar=novo`;
    navigator.clipboard.writeText(reviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Estatísticas
  const totalCount = reviews.length;
  const pendingCount = reviews.filter(r => r.status === 'PENDING').length;
  const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = reviews.filter(r => r.status === 'REJECTED').length;
  
  const averageRating = approvedCount > 0
    ? (reviews.filter(r => r.status === 'APPROVED').reduce((acc, r) => acc + r.rating, 0) / approvedCount).toFixed(1)
    : '5.0';

  const filteredReviews = reviews.filter(r => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.orderId && r.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            Avaliações & Mensagens dos Clientes
          </h2>
          <p className="text-sm text-slate-500">
            Modere as respostas recebidas dos seus clientes. As avaliações <strong>aprovadas</strong> aparecem na parte inferior do seu site (<code className="text-indigo-600 font-bold">{publicStoreUrl}</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reviews.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
              title="Excluir todas as avaliações permanentemente"
            >
              <Trash2 className="w-4 h-4" /> Excluir Todas ({reviews.length})
            </button>
          )}

          <button
            onClick={handleCopyReviewLink}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-sm transition-all"
            title="Copiar link do formulário público de avaliação"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar Link de Avaliação'}
          </button>
          
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Avaliação Manual
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média do Site</p>
            <p className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
              <span>{averageRating}</span>
              <span className="text-xs font-bold text-slate-400">/ 5.0</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes de Moderação</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aprovadas no Site</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas', count: totalCount },
            { id: 'PENDING', label: 'Pendentes', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'APPROVED', label: 'Aprovadas no Site', count: approvedCount },
            { id: 'REJECTED', label: 'Rejeitadas', count: rejectedCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterStatus === tab.id
                  ? 'bg-white/20 text-white'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-800 font-black'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, pedido ou texto..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => {
          const isPending = rev.status === 'PENDING';
          const isApproved = rev.status === 'APPROVED';
          const isRejected = rev.status === 'REJECTED';

          return (
            <div
              key={rev.id}
              className={`bg-white rounded-3xl p-6 border transition-all shadow-sm ${
                isPending
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : isApproved
                  ? 'border-slate-200 hover:border-emerald-200'
                  : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center shrink-0 uppercase border border-indigo-200/50">
                    {rev.customerName.charAt(0) || 'C'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-slate-800 text-base">{rev.customerName}</h4>
                      {rev.orderId && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg font-mono">
                          Pedido #{rev.orderId}
                        </span>
                      )}
                      {rev.customerPhone && (
                        <span className="text-xs text-slate-400 font-medium">{rev.customerPhone}</span>
                      )}
                    </div>
                    
                    {/* Estrelas */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rev.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-700 ml-1">
                        {rev.rating === 0 ? '0 estrelas' : `${rev.rating}/5 estrelas`}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {new Date(rev.createdAt).toLocaleDateString('pt-BR')} às {new Date(rev.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 self-start lg:self-center">
                  {isPending && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black rounded-xl flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> Aguardando Sua Aprovação
                    </span>
                  )}
                  {isApproved && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprovado (Visível no Site)
                    </span>
                  )}
                  {isRejected && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Rejeitado
                    </span>
                  )}
                </div>
              </div>

              {/* Mensagem / Depoimento */}
              <div className="py-4">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/80 p-4 rounded-2xl border border-slate-100 italic">
                  "{rev.message}"
                </p>
              </div>

              {/* Ações de Moderação */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!isApproved && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Aprovar para o Site
                    </button>
                  )}
                  {!isRejected && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'REJECTED')}
                      className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  )}
                  {rev.customerPhone && (
                    <a
                      href={`https://wa.me/${rev.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${rev.customerName}! Muito obrigado pela avaliação deixada para a ${settings.businessName}! Ficamos muito felizes em atendê-lo(a)!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Agradecer no WhatsApp
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(rev.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
                  title="Excluir Avaliação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Star className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">Nenhuma avaliação encontrada com os filtros atuais.</p>
            <p className="text-xs text-slate-400 mt-1">
              Envie o link de avaliação aos clientes nos cards de pedidos para receber novos depoimentos!
            </p>
          </div>
        )}
      </div>

      {/* Modal para Adicionar Avaliação Manual/Teste */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Registrar Nova Avaliação
              </h3>
              <button onClick={() => setShowNewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  placeholder="Ex: Juliana Mendes"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nº do Pedido (Opcional)</label>
                  <input
                    type="text"
                    value={newOrderId}
                    onChange={e => setNewOrderId(e.target.value)}
                    placeholder="Ex: PED-1027"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Seletor de Estrelas de 0 a 5 */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                  Quantas Estrelas? (De 0 a 5) *
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewRating(0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      newRating === 0
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    0
                  </button>
                  <div className="flex items-center gap-1.5 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= newRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-700 ml-auto">
                    {newRating === 0 ? '0 estrelas' : `${newRating} / 5 estrelas`}
                  </span>
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  Mensagem / Depoimento do Cliente *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreva aqui a mensagem ou o feedback recebido..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs uppercase"
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;
