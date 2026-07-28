import React, { useState, useRef, useEffect } from 'react';
import { Prospect, MessageTemplate } from '../types';
import { storage } from '../services/storageService';
import { Users, Plus, Edit2, Trash2, X, Download, Upload, MessageSquare, Send, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

const ProspectsPage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>(storage.getProspects());
  const [templates, setTemplates] = useState<MessageTemplate[]>(storage.getMessageTemplates());
  
  const [isAddingProspect, setIsAddingProspect] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const [prospectName, setProspectName] = useState('');
  const [prospectPhone, setProspectPhone] = useState('');
  const [prospectEmail, setProspectEmail] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [templateImage, setTemplateImage] = useState('');

  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Polling function if prospects update externally
    const interval = setInterval(() => {
      setProspects(storage.getProspects());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const resetProspectForm = () => {
    setProspectName('');
    setProspectPhone('');
    setProspectEmail('');
    setEditingProspectId(null);
    setIsAddingProspect(false);
  };

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateMessage('');
    setTemplateImage('');
    setEditingTemplateId(null);
    setIsAddingTemplate(false);
  };

  const handleSaveProspect = () => {
    if (!prospectName || !prospectPhone) return;
    const p: Prospect = {
      id: editingProspectId || Math.random().toString(36).substr(2, 9),
      name: prospectName,
      phone: prospectPhone,
      email: prospectEmail,
      createdAt: editingProspectId ? prospects.find(x => x.id === editingProspectId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };
    storage.saveProspect(p);
    setProspects(storage.getProspects());
    resetProspectForm();
  };

  const handleEditProspect = (p: Prospect) => {
    setProspectName(p.name);
    setProspectPhone(p.phone);
    setProspectEmail(p.email || '');
    setEditingProspectId(p.id);
    setIsAddingProspect(true);
  };

  const handleDeleteProspect = (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      storage.deleteProspect(id);
      setProspects(storage.getProspects());
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName || !templateMessage) return;
    const t: MessageTemplate = {
      id: editingTemplateId || Math.random().toString(36).substr(2, 9),
      name: templateName,
      message: templateMessage,
      imageUrl: templateImage
    };
    storage.saveMessageTemplate(t);
    setTemplates(storage.getMessageTemplates());
    resetTemplateForm();
  };

  const handleEditTemplate = (t: MessageTemplate) => {
    setTemplateName(t.name);
    setTemplateMessage(t.message);
    setTemplateImage(t.imageUrl || '');
    setEditingTemplateId(t.id);
    setIsAddingTemplate(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Excluir modelo?')) {
      storage.deleteMessageTemplate(id);
      setTemplates(storage.getMessageTemplates());
    }
  };

  const handleExportExcel = () => {
    const dataToExport = prospects.map(p => ({
      ID: p.id,
      Nome: p.name,
      Telefone: p.phone,
      Email: p.email || '',
      DataAdicao: new Date(p.createdAt).toLocaleDateString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
    XLSX.writeFile(workbook, "prospectos_campanhas.xlsx");
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
          if (!item.Nome || !item.Telefone) return;
          const p: Prospect = {
            id: item.ID || Math.random().toString(36).substr(2, 9),
            name: String(item.Nome),
            phone: String(item.Telefone),
            email: item.Email ? String(item.Email) : '',
            createdAt: new Date().toISOString()
          };
          storage.saveProspect(p);
        });

        setProspects(storage.getProspects());
        alert(`${data.length} prospectos processados!`);
        if (excelInputRef.current) excelInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Erro ao importar excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleSelectAll = () => {
    if (selectedProspects.length === prospects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(prospects.map(p => p.id));
    }
  };

  const handleSendMessages = async () => {
    if (selectedProspects.length === 0) return alert('Selecione ao menos um prospecto.');
    if (!selectedTemplateId) return alert('Selecione um modelo de mensagem.');

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const settings = storage.getSettings();
    const useWebhook = !!(settings.webhookUrl && settings.webhookSecret);

    if (!useWebhook && selectedProspects.length > 0) {
      const proceed = window.confirm("O Servidor Bot não está configurado com URL e Senha. O envio será feito abrindo abas do WhatsApp Web manualmente.\n\nPara envio automático e oculto, configure o link do Bot no menu 'Configurações'.\n\nDeseja continuar pelas abas do WhatsApp Web agora?");
      if (!proceed) {
        setIsSendingMessage(false);
        return;
      }
    }
    
    let successCount = 0;

    for (let i = 0; i < selectedProspects.length; i++) {
      const pid = selectedProspects[i];
      const p = prospects.find(x => x.id === pid);
      if (p) {
        let text = template.message.replace(/{nome}/g, p.name);
        if (template.imageUrl) {
          text += `\n\nVeja nossa imagem anexa: ${template.imageUrl}`;
        }
        
        const cleanPhone = p.phone.replace(/\D/g, '');

        if (useWebhook) {
          // Set to pending initially
          storage.saveProspect({ ...p, webhookStatus: 'PENDING' });
          setProspects(storage.getProspects());

          try {
            const resp = await fetch(`${settings.webhookUrl!.replace(/\/$/, '')}/api/enviar-mensagem`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   idSessao: settings.botSessionId || 'vendas',
                   telefone: cleanPhone,
                   mensagem: text,
                   senha: settings.webhookSecret
               })
            });
            
            try {
              const dados = await resp.json();
              if (dados.sucesso || resp.ok) {
                storage.saveProspect({ ...p, webhookStatus: 'SUCCESS' });
                successCount++;
              } else {
                console.error("Erro do bot (json):", dados.erro);
                storage.saveProspect({ ...p, webhookStatus: 'ERROR' });
              }
            } catch (e) {
               // Fallback when response is not JSON
               if (resp.ok) {
                 storage.saveProspect({ ...p, webhookStatus: 'SUCCESS' });
                 successCount++;
               } else {
                 console.error("Erro do bot (status):", resp.status);
                 storage.saveProspect({ ...p, webhookStatus: 'ERROR' });
               }
            }
          } catch (e: any) {
            console.error("Erro ao enviar pelo webhook", e);
            alert(`Falha ao contactar o servidor Bot (Render): ${e.message}\n\nSe não apareceu nada no log do Render, o navegador bloqueou a requisição por falta de CORS no servidor do Bot.\n\nPara corrigir, adicione ao seu index.js (Bot):\n\nconst cors = require('cors');\napp.use(cors());\n\nIsso permitirá que o site envie os disparos para ele.`);
            storage.saveProspect({ ...p, webhookStatus: 'ERROR' });
          }
          setProspects(storage.getProspects());
        } else {
          // Fallback to window.open
          setTimeout(() => {
            const encodedText = encodeURIComponent(text);
            const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`, '_blank');
          }, i * 1500); 
        }
      }
    }

    if (useWebhook) {
      alert(`${successCount} mensagem(ns) enviada(s) com sucesso pelo Bot!`);
    }

    setIsSendingMessage(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplateImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel Esquerdo - Templates */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 h-fit space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg text-slate-800 font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Modelos Rápidos
            </h3>
            <button onClick={() => setIsAddingTemplate(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isAddingTemplate && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 space-y-4">
              <input type="text" placeholder="Nome do Modelo (ex: Black Friday)" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm" />
              <textarea placeholder="Sua mensagem. Use {nome} para saudação personalizada." value={templateMessage} onChange={e => setTemplateMessage(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm h-32" />
              
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Imagem Opcional (Link ou Upload)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="URL da Imagem" value={templateImage} onChange={e => setTemplateImage(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-xs" />
                  <label className="p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center justify-center shrink-0">
                     <ImageIcon className="w-4 h-4 text-slate-500" />
                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={resetTemplateForm} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                <button onClick={handleSaveTemplate} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Salvar</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {templates.length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-4">Nenhum modelo cadastrado.</p>
            ) : (
               templates.map(t => (
                 <div key={t.id} className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-slate-700 text-sm">{t.name}</span>
                     <div className="flex gap-1">
                       <button onClick={() => handleEditTemplate(t)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                       <button onClick={() => handleDeleteTemplate(t.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                     </div>
                   </div>
                   <p className="text-xs text-slate-500 truncate">{t.message}</p>
                 </div>
               ))
            )}
          </div>
        </div>

        {/* Painel Direito - Prospectos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" /> Prospectos 
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{prospects.length}</span>
              </h3>
              <p className="text-sm text-slate-500">Lista para contato de campanhas</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
               <button onClick={handleExportExcel} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 border border-emerald-100" title="Exportar"><Download className="w-4 h-4"/></button>
               <button onClick={() => excelInputRef.current?.click()} className="p-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 border border-amber-100" title="Importar"><Upload className="w-4 h-4"/></button>
               <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
               
               <button onClick={() => setIsSendingMessage(!isSendingMessage)} className="p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 border border-indigo-100 font-bold text-xs flex items-center gap-2">
                 <Send className="w-4 h-4" /> Enviar Campanha
               </button>
               
               <button onClick={() => setIsAddingProspect(true)} className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
                 <Plus className="w-4 h-4"/> Novo
               </button>
            </div>
          </div>

          {isSendingMessage && (
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-4 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1 mt-1">
                <label className="text-[10px] font-black text-indigo-800 uppercase">Qual modelo enviar para os {selectedProspects.length} marcados?</label>
                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 outline-none">
                  <option value="">Selecione um modelo...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button onClick={handleSendMessages} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl w-full sm:w-auto h-[46px] shadow-lg shadow-indigo-200">
                Disparar
              </button>
            </div>
          )}

          {isAddingProspect && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nome</label>
                <input type="text" value={prospectName} onChange={e => setProspectName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</label>
                <input type="text" value={prospectPhone} onChange={e => setProspectPhone(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Email (Opcional)</label>
                <input type="email" value={prospectEmail} onChange={e => setProspectEmail(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="flex gap-2 items-end">
                <button onClick={resetProspectForm} className="flex-1 py-3 text-slate-500 font-bold bg-white border border-slate-200 rounded-xl">Cancelar</button>
                <button onClick={handleSaveProspect} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Salvar</button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 w-12 text-center">
                      <input type="checkbox" checked={selectedProspects.length === prospects.length && prospects.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-indigo-600 rounded" />
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Nome</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Contato</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Status do Bot</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Adicionado</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prospects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={selectedProspects.includes(p.id)} onChange={(e) => {
                          if (e.target.checked) setSelectedProspects([...selectedProspects, p.id]);
                          else setSelectedProspects(selectedProspects.filter(id => id !== p.id));
                        }} className="w-4 h-4 accent-indigo-600 rounded" />
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-700">{p.name}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-black text-slate-600">{p.phone}</div>
                        {p.email && <div className="text-[10px] text-slate-400">{p.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {!p.webhookStatus ? <span className="text-[10px] text-slate-400">Não Enviado</span> : p.webhookStatus === 'PENDING' ? <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">Enviando...</span> : p.webhookStatus === 'SUCCESS' ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Enviado com Sucesso</span> : <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Erro ao Enviar</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => handleEditProspect(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white rounded-lg border border-slate-200 shadow-sm"><Edit2 className="w-3 h-3"/></button>
                        <button onClick={() => handleDeleteProspect(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 shadow-sm"><Trash2 className="w-3 h-3"/></button>
                      </td>
                    </tr>
                  ))}
                  {prospects.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">Nenhum prospecto cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProspectsPage;
