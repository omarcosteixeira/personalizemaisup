
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Upload, 
  Download, 
  Maximize2, 
  RefreshCcw, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Key,
  Building,
  Palette
} from 'lucide-react';

// Removed conflicting Window interface extension for aistudio.
// Using window as any for aistudio calls to ensure compatibility with the environment-provided AIStudio type.

const MockupGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '16:9' | '9:16' | '3:4' | '4:3'>('1:1');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMockup = async () => {
    if (!prompt && !baseImage) {
      setError("Descreva o mockup ou envie uma imagem de referência.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Accessing aistudio via window as any to avoid type definition conflicts with the pre-configured AIStudio type.
      const aistudio = (window as any).aistudio;
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }

      // Initialize GoogleGenAI right before the call to ensure the latest API key is used.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [];
      
      if (baseImage) {
        parts.push({
          inlineData: {
            data: baseImage.split(',')[1],
            mimeType: 'image/png'
          }
        });
      }

      parts.push({
        text: `Crie um mockup profissional de alta fidelidade para uma gráfica rápida. O produto deve parecer real, em um ambiente de estúdio ou contexto de uso realístico. Detalhes: ${prompt}. Estilo: Fotografia comercial, iluminação de estúdio, 8k, ultra detalhado.`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio,
            imageSize: selectedSize
          }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("O modelo não retornou uma imagem. Tente uma descrição diferente.");
      }

    } catch (err: any) {
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.error(err);
      }
      if (err.name === 'AbortError' || err.message?.includes('aborted') || String(err).includes('aborted')) {
        setError("Seleção de chave ou geração cancelada.");
      } else if (err.message?.includes("Requested entity was not found")) {
        setError("Erro de chave de API. Por favor, selecione uma chave válida com faturamento ativo.");
        try {
          await (window as any).aistudio.openSelectKey();
        } catch (e) {
          /* ignore aborts here */
        }
      } else {
        setError(err.message || "Erro ao gerar mockup. Tente novamente.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mockup-grafica-pro-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Configurações */}
          <div className="lg:w-1/3 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-indigo-600" /> Mockups IA
              </h3>
              <p className="text-sm text-slate-500">Crie apresentações incríveis para seus clientes em segundos.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Ideia</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Cartão de visita texturizado sobre mesa de madeira com planta ao fundo..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referência de Produto (Opcional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden ${baseImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                >
                  {baseImage ? (
                    <>
                      <img src={baseImage} className="w-full h-full object-cover" alt="Referência" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <RefreshCcw className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Subir Foto Real</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qualidade</label>
                  <select 
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="1K">1K (Padrão)</option>
                    <option value="2K">2K (HD)</option>
                    <option value="4K">4K (Ultra)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formato</label>
                  <select 
                    value={selectedRatio}
                    onChange={(e) => setSelectedRatio(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="1:1">Quadrado (1:1)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="9:16">Stories (9:16)</option>
                    <option value="4:3">Clássico (4:3)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button 
                onClick={generateMockup}
                disabled={isGenerating}
                className={`w-full py-5 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    GERANDO MOCKUP...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    GERAR APRESENTAÇÃO
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="flex-1 space-y-6">
            <div className="relative aspect-square lg:aspect-auto lg:h-full bg-slate-50 rounded-[48px] border-2 border-slate-100 overflow-hidden flex items-center justify-center group shadow-inner">
              {isGenerating ? (
                <div className="text-center space-y-6 animate-pulse">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-indigo-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-indigo-900">Nossa IA está criando...</p>
                    <p className="text-sm text-slate-400">Ajustando iluminação e texturas realistas</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <>
                  <img src={generatedImage} className="w-full h-full object-cover" alt="Mockup Gerado" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                    <button 
                      onClick={downloadImage}
                      className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-2xl"
                    >
                      <Download className="w-5 h-5" /> Baixar Imagem {selectedSize}
                    </button>
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Pronto para o seu catálogo</p>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 opacity-30">
                  <ImageIcon className="w-20 h-20 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-400">O seu mockup aparecerá aqui</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-3xl border border-indigo-100">
               <div className="p-3 bg-white rounded-2xl shadow-sm"><Key className="w-5 h-5 text-indigo-600" /></div>
               <div className="flex-1">
                 <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Informação de Processamento</p>
                 <p className="text-xs text-indigo-600/80">Este recurso utiliza o modelo de alta performance **Gemini 3 Pro Image**. Certifique-se de usar sua própria API Key.</p>
               </div>
               <button onClick={() => (window as any).aistudio.openSelectKey().catch(() => {})} className="px-4 py-2 bg-white border border-indigo-200 rounded-xl text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-100 transition-colors">Configurar Chave</button>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas e Exemplos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Fotografia Realista", desc: "Use termos como 'iluminação volumétrica', 'depth of field' e '8k' para mais realismo.", icon: Maximize2 },
          { title: "Contexto de Uso", desc: "Descreva o ambiente, como 'em um escritório moderno' ou 'mãos segurando o produto'.", icon: Building },
          { title: "Consistência de Marca", desc: "Mencione cores específicas da sua identidade visual no campo de descrição.", icon: Palette }
        ].map((dica, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-start gap-4 shadow-sm">
             <div className="p-3 bg-slate-50 rounded-2xl"><dica.icon className="w-5 h-5 text-indigo-600" /></div>
             <div>
               <h5 className="font-bold text-slate-800 text-sm mb-1">{dica.title}</h5>
               <p className="text-xs text-slate-500 leading-relaxed">{dica.desc}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockupGenerator;
