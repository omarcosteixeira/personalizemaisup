
import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebaseService';
import { storage } from '../services/storageService';
import { SystemConfig } from '../types';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, CheckCircle, Clock, Trash2, ShieldCheck, Mail, Calendar, TrendingUp, Link as LinkIcon, DollarSign, Save } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = auth.currentUser?.email === 'atelie.arianeartes@gmail.com';
  
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'sales' | 'bot'>(isSuperAdmin ? 'users' : 'bot');
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [newSessionName, setNewSessionName] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [pairingCodes, setPairingCodes] = useState<Record<string, string>>({});
  const [pairingPhones, setPairingPhones] = useState<Record<string, string>>({});
  const [loadingCodes, setLoadingCodes] = useState<Record<string, boolean>>({});
  const [sessionDataTexts, setSessionDataTexts] = useState<Record<string, string>>({});
  const [injectingSessions, setInjectingSessions] = useState<Record<string, boolean>>({});
  const [botStatuses, setBotStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    let interval: any;
    if (activeSubTab === 'bot' && settings.webhookUrl) {
      const checkStatuses = async () => {
        const updatedStatuses: Record<string, string> = {};
        for (const sessao of (settings.botSessions || [])) {
          try {
            const res = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/status/${sessao}`);
            const data = await res.json();
            if (data.status) {
              updatedStatuses[sessao] = data.status;
              if (data.qr_imagem_url) setQrCodes(prev => ({...prev, [sessao]: data.qr_imagem_url}));
              if (data.codigo_emparelhamento) setPairingCodes(prev => ({...prev, [sessao]: data.codigo_emparelhamento}));
            }
          } catch (e) {
            console.error(`Erro polling status ${sessao}:`, e);
          }
        }
        setBotStatuses(prev => ({...prev, ...updatedStatuses}));
      };
      checkStatuses();
      interval = setInterval(checkStatuses, 3000);
    }
    return () => clearInterval(interval);
  }, [activeSubTab, settings.webhookUrl, settings.botSessions]);
  
  // Config States
  const [sysConfig, setSysConfig] = useState<SystemConfig>({
    basicPlanPrice: 0,
    proPlanPrice: 0,
    basicPlanPaymentLink: '',
    proPlanPaymentLink: '',
    paymentLink: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const fetchConfig = async () => {
    try {
      const config = await storage.getSystemConfig();
      if (config) {
        setSysConfig(config);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  // Dependência [isSuperAdmin] garante que o fetchConfig rode assim que o login for confirmado
  useEffect(() => { 
    fetchUsers();
    if (isSuperAdmin) {
      fetchConfig();
    }
  }, [isSuperAdmin]);

  const handleSaveConfig = async () => {
    try {
      await storage.saveSystemConfig(sysConfig);
      alert('Configurações de venda salvas com sucesso!');
      // Recarrega para garantir
      fetchConfig();
    } catch (error) {
      alert('Erro ao salvar configurações.');
      console.error(error);
    }
  };

  const approveUser = async (userId: string, days: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    
    await updateDoc(doc(db, 'users', userId), {
      isApproved: true,
      expiresAt: expiresAt.toISOString()
    });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Excluir este usuário permanentemente?')) {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> Painel de Controle
          </h3>
          
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              {isSuperAdmin && (
                <>
                  <button 
                    onClick={() => setActiveSubTab('users')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'users' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >
                    USUÁRIOS
                  </button>
                  <button 
                    onClick={() => setActiveSubTab('sales')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'sales' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >
                    VENDAS
                  </button>
                </>
              )}
              <button 
                onClick={() => setActiveSubTab('bot')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeSubTab === 'bot' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                BOT SESSÕES
              </button>
            </div>
        </div>

        {activeSubTab === 'users' && (
          loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Carregando usuários...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.map(u => (
                <div key={u.id} className={`p-6 rounded-3xl border ${u.isApproved ? 'bg-white border-slate-100' : 'bg-amber-50 border-amber-100'} shadow-sm flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-slate-800 truncate max-w-[200px] flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {u.email}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {u.isAdmin ? 'Administrador' : u.isApproved ? 'Ativo' : 'Aguardando Aprovação'}
                      </p>
                    </div>
                    {!u.isAdmin && (
                      <button onClick={() => deleteUser(u.id)} className="text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {u.isApproved && !u.isAdmin && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
                        <Calendar className="w-3 h-3" /> Expira em: {u.expiresAt === 'NEVER' ? 'Vitalício' : new Date(u.expiresAt).toLocaleDateString()}
                      </div>
                    )}

                    {!u.isAdmin && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => approveUser(u.id, 2)} className="py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100">Liberar 2 Dias</button>
                        <button onClick={() => approveUser(u.id, 30)} className="py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">Liberar 30 Dias</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeSubTab === 'sales' && isSuperAdmin && (
          <div className="max-w-2xl space-y-8 animate-in slide-in-from-top-4">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
              <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Valores da Landing Page
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Preço Plano Básico (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="number" 
                      value={sysConfig.basicPlanPrice || ''} 
                      onChange={e => setSysConfig({...sysConfig, basicPlanPrice: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Preço Plano Pro (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="number" 
                      value={sysConfig.proPlanPrice || ''} 
                      onChange={e => setSysConfig({...sysConfig, proPlanPrice: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Link de Pagamento Plano Básico</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      value={sysConfig.basicPlanPaymentLink || ''} 
                      onChange={e => setSysConfig({...sysConfig, basicPlanPaymentLink: e.target.value})}
                      placeholder="https://mpago.la/..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Link de Pagamento Plano Pro</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      value={sysConfig.proPlanPaymentLink || ''} 
                      onChange={e => setSysConfig({...sysConfig, proPlanPaymentLink: e.target.value})}
                      placeholder="https://mpago.la/..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> SALVAR CONFIGURAÇÕES DE VENDA
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'bot' && (
          <div className="max-w-4xl space-y-8 animate-in slide-in-from-top-4">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
              <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Gerenciar Sessões do Bot
              </h4>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nova Sessão (ex: afiliados)</label>
                  <input 
                    type="text" 
                    value={newSessionName} 
                    onChange={e => setNewSessionName(e.target.value.toLowerCase().trim())}
                    placeholder="Nome da sessão"
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!newSessionName) return;
                    const updatedSessions = Array.from(new Set([...(settings.botSessions || []), newSessionName]));
                    const newSettings = { ...settings, botSessions: updatedSessions };
                    setSettings(newSettings);
                    storage.saveSettings(newSettings);
                    setNewSessionName('');
                  }}
                  className="px-6 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:bg-indigo-700 transition-all"
                >
                  Adicionar Sessão
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {(settings.botSessions || []).map((sessao: string) => (
                  <div key={sessao} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between items-start gap-4 shadow-sm">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${botStatuses[sessao] === 'conectado' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <h5 className="font-bold text-slate-800 text-lg">{sessao}</h5>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">({botStatuses[sessao] || 'offline'})</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Remover sessão ${sessao}?`)) {
                            const updatedSessions = settings.botSessions.filter((s: string) => s !== sessao);
                            const newSettings = { ...settings, botSessions: updatedSessions };
                            setSettings(newSettings);
                            storage.saveSettings(newSettings);
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-wrap gap-2 w-full">
                        <button 
                          onClick={async () => {
                            if (!settings.webhookUrl || !settings.webhookSecret) {
                              return alert("Preencha o link do webhook e a senha na aba de configurações primeiro.");
                            }
                            
                            setQrCodes(prev => ({...prev, [sessao]: ''}));
                            setPairingCodes(prev => ({...prev, [sessao]: ''}));
                            
                            try {
                              await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/iniciar-sessao`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idSessao: sessao, senha: settings.webhookSecret })
                              });
                              
                              setTimeout(async () => {
                                 try {
                                     const respostaQR = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/qrcode/${sessao}`);
                                     const dadosQR = await respostaQR.json();

                                     if (dadosQR.qr_imagem_url) {
                                         setQrCodes(prev => ({...prev, [sessao]: dadosQR.qr_imagem_url}));
                                     } else {
                                         alert("QR Code não disponível. Status: " + (dadosQR.mensagem || 'Desconhecido'));
                                     }
                                 } catch (err) {
                                     alert("Erro ao buscar a imagem do QR Code para a sessão " + sessao);
                                 }
                              }, 2000);
                            } catch (e: any) {
                               alert(`Erro ao conectar com o bot: ${e.message}`);
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-all text-center"
                        >
                          QR Code
                        </button>

                        <button 
                          onClick={() => {
                             if (!settings.webhookUrl) return alert("Configure o Link do Webhook.");
                             window.open(`${settings.webhookUrl.replace(/\/$/, '')}/api/status/${sessao}`, '_blank');
                          }}
                          className="flex-1 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 transition-all text-center"
                        >
                          Status
                        </button>
                      </div>

                      <div className="flex gap-2 w-full">
                        <input 
                          type="tel"
                          value={pairingPhones[sessao] || ''}
                          onChange={e => setPairingPhones(prev => ({...prev, [sessao]: e.target.value.replace(/\D/g, '')}))}
                          placeholder="DDD + Número"
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        />
                        <button 
                          disabled={loadingCodes[sessao]}
                          onClick={async () => {
                            const phone = pairingPhones[sessao];
                            if (!phone || phone.length < 10) return alert("Digite o número com DDD.");
                            if (!settings.webhookUrl || !settings.webhookSecret) return alert("Configure as chaves do bot.");

                            setLoadingCodes(prev => ({...prev, [sessao]: true}));
                            setQrCodes(prev => ({...prev, [sessao]: ''}));
                            setPairingCodes(prev => ({...prev, [sessao]: ''}));

                            try {
                              const initRes = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/iniciar-sessao`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idSessao: sessao, senha: settings.webhookSecret, phone, pairingCode: true })
                              });

                              const initData = await initRes.json();

                              // Se o código já vier na resposta inicial
                              if (initData.code || initData.pairingCode) {
                                 setPairingCodes(prev => ({...prev, [sessao]: initData.code || initData.pairingCode}));
                                 setLoadingCodes(prev => ({...prev, [sessao]: false}));
                                 return;
                              }

                              setTimeout(async () => {
                                 try {
                                     const res = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/pairing-code/${sessao}?phone=${phone}&number=${phone}`);
                                     const data = await res.json();
                                     if (data.code || data.pairingCode) {
                                         setPairingCodes(prev => ({...prev, [sessao]: data.code || data.pairingCode}));
                                     } else {
                                         alert("Código não disponível no momento. Tente novamente.");
                                     }
                                 } catch (err) {
                                     alert("Erro ao buscar código no servidor.");
                                 } finally {
                                     setLoadingCodes(prev => ({...prev, [sessao]: false}));
                                 }
                              }, 4000);
                            } catch (e: any) {
                               alert(`Erro de conexão: ${e.message}`);
                               setLoadingCodes(prev => ({...prev, [sessao]: false}));
                            }
                          }}
                          className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {loadingCodes[sessao] ? '...' : 'Código'}
                        </button>
                      </div>
                      
                      {qrCodes[sessao] && botStatuses[sessao] === 'aguardando_qr' && (
                        <div className="mt-2 p-2 bg-white border border-slate-200 rounded-xl flex justify-center">
                           <img src={qrCodes[sessao]} alt={`QR Code ${sessao}`} className="w-48 h-48 rounded-lg shadow-sm" />
                        </div>
                      )}

                      {pairingCodes[sessao] && botStatuses[sessao] === 'aguardando_codigo' && (
                        <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center">
                           <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Código de Pareamento</p>
                           <div className="text-2xl font-black tracking-widest text-indigo-600 font-mono">
                             {pairingCodes[sessao]}
                           </div>
                        </div>
                      )}

                      <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Injeção Manual (creds.json)</span>
                          </div>
                          <textarea 
                            value={sessionDataTexts[sessao] || ''}
                            onChange={e => setSessionDataTexts(prev => ({...prev, [sessao]: e.target.value}))}
                            placeholder='{ "creds": { ... } }'
                            className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-[9px] font-mono"
                          />
                          <button 
                            disabled={injectingSessions[sessao] || !sessionDataTexts[sessao]}
                            onClick={async () => {
                              if (!settings.webhookUrl || !settings.webhookSecret) return alert("Configure as chaves do bot.");
                              
                              let sessionDataObj;
                              try {
                                sessionDataObj = JSON.parse(sessionDataTexts[sessao]);
                              } catch (e) {
                                return alert("JSON inválido.");
                              }

                              setInjectingSessions(prev => ({...prev, [sessao]: true}));
                              
                              try {
                                const response = await fetch(`${settings.webhookUrl.replace(/\/$/, '')}/api/injetar-sessao`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    idSessao: sessao,
                                    senha: settings.webhookSecret,
                                    credsJson: sessionDataObj
                                  })
                                });

                                const result = await response.json();

                                if (response.ok) {
                                  alert(`✅ Sucesso na injeção da sessão ${sessao}.`);
                                  setSessionDataTexts(prev => ({...prev, [sessao]: ''}));
                                } else {
                                  alert(`❌ Erro: ${result.erro || result.mensagem}`);
                                }
                              } catch (error) {
                                alert("❌ Erro de comunicação.");
                              } finally {
                                setInjectingSessions(prev => ({...prev, [sessao]: false}));
                              }
                            }}
                            className="w-full py-3 bg-slate-800 text-white rounded-xl text-[10px] font-bold hover:bg-slate-900 disabled:opacity-50"
                          >
                            {injectingSessions[sessao] ? 'Injetando...' : 'Injetar creds.json'}
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(settings.botSessions || []).length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400">
                    Nenhuma sessão configurada.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
