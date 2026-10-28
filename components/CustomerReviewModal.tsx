import React, { useState } from 'react';
import { CustomerReview, Quotation } from '../types';
import { storage } from '../services/storageService';
import { Star, X, CheckCircle2, Send, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  tenantId?: string;
  onSubmitted?: (review: CustomerReview) => void;
}

const CustomerReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotation,
  tenantId,
  onSubmitted
}) => {
  const settings = storage.getSettings();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [customerName, setCustomerName] = useState(quotation?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(quotation?.customerContact || '');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 0: return '0 Estrelas - Insatisfeito';
      case 1: return '1 Estrela - Ruim';
      case 2: return '2 Estrelas - Regular';
      case 3: return '3 Estrelas - Bom';
      case 4: return '4 Estrelas - Muito Bom';
      case 5: return '5 Estrelas - Excelente!';
      default: return `${r} Estrelas`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }

    const review: CustomerReview = {
      id: `rev-${Date.now()}`,
      orderId: quotation?.id || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      rating: rating,
      message: message.trim(),
      status: 'PENDING', // Sempre nasce pendente para aprovação do lojista
      createdAt: new Date().toISOString()
    };

    if (tenantId) {
      await storage.savePublicReview(tenantId, review);
    } else {
      storage.saveReview(review);
    }

    setIsSuccess(true);
    if (onSubmitted) onSubmitted(review);
  };

  const storeSlug = settings.slug || 'ateliearianeartes';
  const evaluationLink = `${window.location.origin}/${storeSlug}?avaliar=${quotation?.id || 'pedido'}&cliente=${encodeURIComponent(customerName || 'Cliente')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(evaluationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const text = `Olá ${customerName || 'Cliente'}! Agradecemos pela preferência com a ${settings.businessName}. Poderia avaliar seu pedido com uma nota de 0 a 5 estrelas e um breve comentário? Clique aqui: ${evaluationLink}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[36px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Avaliação Enviada!</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Muito obrigado pelo seu carinho e feedback! Sua mensagem foi enviada e, assim que for aprovada pela equipe, aparecerá no rodapé do nosso site.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center pb-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                Avaliação de Atendimento & Produto
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {quotation ? (
                  <>Pedido <span className="font-mono font-bold text-indigo-600">#{quotation.id}</span> • {settings.businessName}</>
                ) : (
                  `Sua opinião é fundamental para a ${settings.businessName}!`
                )}
              </p>
            </div>

            {/* Quick Actions para o lojista enviar ao cliente */}
            {quotation && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Enviar Formulário ao Cliente</p>
                  <p className="text-[11px] text-indigo-700/80 truncate">Link personalizado para o cliente responder</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold flex items-center gap-1 border border-indigo-200 shadow-sm"
                    title="Copiar Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Identificação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            {/* Seletor de Estrelas de 0 a 5 */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-2 text-center">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Quantas estrelas você nos dá? (De 0 a 5)
              </label>

              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {/* Opção de 0 estrelas */}
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    rating === 0
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Nota 0 Estrelas"
                >
                  0★
                </button>

                {/* 1 a 5 estrelas */}
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-9 sm:h-9 ${
                        star <= activeRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs font-black text-indigo-900 mt-1">
                {getRatingLabel(activeRating)}
              </p>
            </div>

            {/* Caixa de Texto / Mensagem */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Deixe uma mensagem ou depoimento:
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Conte o que achou da qualidade de impressão, acabamento, atendimento e prazo..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 resize-none leading-relaxed"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Enviar Avaliação
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewModal;
