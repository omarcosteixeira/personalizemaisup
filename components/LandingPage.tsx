
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { SystemConfig } from '../types';
import { 
  Printer, 
  Sparkles, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  ShoppingCart, 
  MessageCircle, 
  Smartphone, 
  LayoutDashboard,
  Zap,
  Star,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Wallet,
  FileSpreadsheet,
  Type,
  FileText,
  BarChart3
} from 'lucide-react';

interface Props {
  onStart: () => void;
}

const LandingPage: React.FC<Props> = ({ onStart }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    storage.getSystemConfig().then(setConfig);
  }, []);

  const features = [
    {
      title: "Financeiro & Contas a Pagar",
      desc: "Tenha controle total do seu fluxo de caixa. Cadastre despesas, receba alertas de vencimento e dê baixa em pagamentos.",
      icon: Wallet,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "PDV Balcão de Vendas",
      desc: "Interface ultra rápida para vendas presenciais. Gere pedidos em segundos com baixa automática no estoque.",
      icon: ShoppingCart,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Aproveitamento de Folha",
      desc: "Calcule quantas artes cabem em uma folha A3 ou A4. Economize papel e otimize seu tempo de produção.",
      icon: FileSpreadsheet,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Laboratório de Fontes",
      desc: "Teste centenas de fontes com seu texto real antes da produção. Suporte completo para fontes personalizadas .TTF.",
      icon: Type,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      title: "Precificação Inteligente",
      desc: "Cálculo real de lucro considerando custos fixos, mão de obra e materiais. Saiba exatamente quanto cobrar.",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Catálogo Online",
      desc: "Sua loja pronta para vender no WhatsApp. Seus clientes escolhem o produto e você recebe o pedido pronto.",
      icon: Smartphone,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-900 rounded-xl shadow-lg"><Printer className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Personalize <span className="text-indigo-600">+</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onStart} className="hidden sm:block text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Entrar no Sistema</button>
            <button 
              onClick={onStart}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-6xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-indigo-100 rounded-full shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">O braço direito da sua gráfica rápida</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            Gestão <span className="text-indigo-600">Simplificada</span> para <br className="hidden md:block" /> 
            Papelaria e Brindes.
          </h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
            Elimine as planilhas confusas. Controle orçamentos, estoque, vendas e financeiro em uma única plataforma desenhada exclusivamente para criativos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button 
              onClick={onStart}
              className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-lg group"
            >
              ACESSAR MEU PAINEL <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4 px-8 py-5">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 shadow-sm" />)}
              </div>
              <div className="text-left">
                 <p className="text-xs font-black text-slate-800 leading-none">+500 Ateliês</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">já estão usando</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview UI */}
      <section className="px-6 -mt-12 mb-24">
        <div className="max-w-6xl mx-auto bg-white p-4 rounded-[48px] shadow-2xl border border-slate-100">
           <div className="bg-slate-50 rounded-[40px] aspect-video flex items-center justify-center relative overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1200" 
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="relative z-10 text-center space-y-6 max-w-xl p-12">
                 <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl"><LayoutDashboard className="w-10 h-10"/></div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tight">Tudo o que você precisa em uma única tela.</h3>
                 <p className="text-slate-500 font-bold">Gerencie pedidos de balcão, aprovações de orçamentos e contas a pagar sem complicação.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h3 className="text-4xl font-black text-slate-800 tracking-tight">Feito para Gráficas de Alta Performance</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Funcionalidades pensadas no dia a dia do seu negócio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-10 rounded-[48px] border border-slate-50 hover:border-indigo-100 hover:shadow-2xl hover:-translate-y-2 transition-all group bg-slate-50/30">
                <div className={`p-5 ${f.bg} ${f.color} rounded-3xl w-fit mb-8 group-hover:rotate-6 transition-all shadow-sm`}>
                  <f.icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-4 tracking-tight">{f.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logic & Math Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full">Matemática do Lucro</span>
              <h3 className="text-5xl font-black text-slate-800 tracking-tight">Pare de perder dinheiro por erro de cálculo.</h3>
            </div>
            
            <div className="space-y-8">
              {[
                { t: "Calculadora de M² & Folha", d: "Calcule automaticamente o preço por área e veja o melhor aproveitamento no papel A3/A4." },
                { t: "Custo de Hora Operacional", d: "Nosso sistema calcula seu lucro real descontando seus custos fixos e seu salário desejado." },
                { t: "Geração de PDF Profissional", d: "Envie orçamentos e ordens de serviço elegantes com a sua marca direto para o WhatsApp." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="mt-1 p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                  <div>
                    <h5 className="text-lg font-black text-slate-800 mb-1">{item.t}</h5>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full lg:max-w-md">
            <div className="bg-indigo-900 p-12 rounded-[64px] shadow-[0_40px_80px_-15px_rgba(30,58,138,0.3)] text-white space-y-8 relative">
               <div className="absolute -top-10 -right-10 bg-amber-400 text-amber-950 p-8 rounded-full shadow-2xl font-black text-xl flex flex-col items-center leading-none">
                  <span>100%</span>
                  <span className="text-[10px] uppercase mt-1">Lucro Real</span>
               </div>
               <div className="space-y-4">
                 <p className="text-indigo-300 text-xs font-black uppercase tracking-widest">Calculadora de Precificação</p>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold opacity-60">Custo Material</span>
                      <span className="font-black">R$ 12,50</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold opacity-60">Mão de Obra</span>
                      <span className="font-black">R$ 8,00</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/20 text-emerald-400">
                      <span className="text-xs font-bold">Venda Sugerida</span>
                      <span className="text-xl font-black">R$ 49,90</span>
                    </div>
                 </div>
               </div>
               <p className="text-sm text-indigo-200 font-medium leading-relaxed italic">"Nós fazemos a conta difícil para você focar apenas na arte e na produção."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 bg-indigo-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[120px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="space-y-6 mb-20">
            <h3 className="text-5xl font-black text-white tracking-tight">O investimento que seu ateliê merece.</h3>
            <p className="text-indigo-300 font-medium max-w-2xl mx-auto">Planos pensados para quem está começando e para quem já é grande no mercado.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Plano Básico */}
            <div className="bg-white p-12 rounded-[56px] shadow-2xl text-left flex flex-col group hover:scale-[1.02] transition-all duration-500">
              <div className="mb-10">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-full mb-6 inline-block">Plano Essencial</span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl font-black text-slate-800">GRÁTIS</span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/Teste 2 Dias</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1">
                {["Acesso Completo por 48h", "Gestão de Orçamentos", "Cálculo de M² e Área", "Catálogo de Produtos", "Gerador de PDF Profissional"].map(item => (
                  <li key={item} className="flex items-center gap-4 text-sm font-bold text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onStart}
                className="w-full py-5 bg-slate-50 text-indigo-600 font-black rounded-3xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm uppercase tracking-widest text-xs"
              >
                CRIAR CONTA GRÁTIS
              </button>
            </div>

            {/* Plano Pro */}
            <div className="bg-indigo-600 p-12 rounded-[56px] shadow-2xl text-left border-4 border-white/10 flex flex-col relative scale-105 z-10 group hover:scale-[1.08] transition-all duration-500">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black px-6 py-2 rounded-full shadow-2xl tracking-[0.2em]">RECOMENDADO</div>
              <div className="mb-10 text-white">
                <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full mb-6 inline-block">Plano Completo</span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl font-black">R$ {config?.proPlanPrice.toFixed(2) || '35,00'}</span>
                  <span className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest">/mês</span>
                </div>
              </div>
              <ul className="space-y-5 mb-12 flex-1 text-white">
                {[
                  "Tudo do Plano Essencial", 
                  "Financeiro c/ Contas a Pagar", 
                  "PDV de Balcão Rápido", 
                  "Controle de Estoque Pro", 
                  "Aproveitamento de Folha", 
                  "Laboratório de Fontes .TTF"
                ].map(item => (
                  <li key={item} className="flex items-center gap-4 text-sm font-bold opacity-90">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => window.open(config?.proPlanPaymentLink || config?.paymentLink, '_blank')}
                className="w-full py-6 bg-white text-indigo-600 font-black rounded-3xl shadow-[0_20px_50px_-10px_rgba(255,255,255,0.2)] hover:bg-amber-400 hover:text-amber-950 transition-all uppercase tracking-widest text-xs"
              >
                ASSINAR AGORA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-900 rounded-xl"><Printer className="w-5 h-5 text-white" /></div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Personalize <span className="text-indigo-600">+</span></h1>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] text-center md:text-left">Gestão Inteligente para Ateliês e Gráficas.</p>
          </div>
          <div className="flex gap-12 text-xs font-black text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Ajuda</a>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© {new Date().getFullYear()} Personalize +</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">v2.1.0 - Estável</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
