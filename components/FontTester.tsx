
import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Search, 
  Download, 
  Settings2, 
  Maximize2, 
  ExternalLink,
  ChevronRight,
  Palette,
  AlignLeft,
  Grid
} from 'lucide-react';
import { storage } from '../services/storageService';

const GOOGLE_FONTS = [
  { name: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', category: 'Sans Serif' },
  { name: 'Montserrat', category: 'Sans Serif' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Dancing Script', category: 'Script' },
  { name: 'Pacifico', category: 'Script' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Oswald', category: 'Sans Serif' },
  { name: 'Lobster', category: 'Display' },
  { name: 'Anton', category: 'Sans Serif' },
  { name: 'Satisfy', category: 'Script' },
  { name: 'Caveat', category: 'Handwriting' },
  { name: 'Great Vibes', category: 'Script' },
  { name: 'Cinzel', category: 'Serif' },
  { name: 'Courgette', category: 'Handwriting' },
  { name: 'Poppins', category: 'Sans Serif' },
  { name: 'Lato', category: 'Sans Serif' },
  { name: 'Alex Brush', category: 'Script' },
  { name: 'Ubuntu', category: 'Sans Serif' },
  { name: 'Merriweather', category: 'Serif' }
];

const FontTester: React.FC = () => {
  const [text, setText] = useState('Texto de Exemplo');
  const [fontSize, setFontSize] = useState(48);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customFonts, setCustomFonts] = useState(storage.getCustomFonts());

  const settings = storage.getSettings();
  const primaryColor = settings.theme.primaryColor;

  // Combine Google Fonts with Custom Fonts
  const allFonts = [
    ...customFonts.map(f => ({ name: f.name, category: 'Personalizada' })),
    ...GOOGLE_FONTS
  ];

  const categories = ['Todas', 'Personalizada', ...Array.from(new Set(GOOGLE_FONTS.map(f => f.category)))];

  const filteredFonts = allFonts.filter(f => 
    (selectedCategory === 'Todas' || f.category === selectedCategory) &&
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // 1. Load Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const googleFontNames = GOOGLE_FONTS.map(f => f.name.replace(' ', '+')).join('|');
    link.href = `https://fonts.googleapis.com/css2?family=${googleFontNames}&display=swap`;
    document.head.appendChild(link);

    // 2. Inject Custom Fonts CSS
    const style = document.createElement('style');
    let css = '';
    customFonts.forEach(font => {
      css += `
        @font-face {
          font-family: '${font.name}';
          src: url(${font.data}) format('${font.format}');
        }
      `;
    });
    style.innerHTML = css;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, [customFonts]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-[24px] text-white shadow-xl shadow-indigo-100">
              <Type className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Laboratório de Fontes</h3>
              <p className="text-sm text-slate-500 font-medium">Teste o visual das fontes antes de produzir.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setIsDarkMode(false)} 
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${!isDarkMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              CLARO
            </button>
            <button 
              onClick={() => setIsDarkMode(true)} 
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${isDarkMode ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              ESCURO
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-5 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto de Visualização</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                value={text} 
                onChange={e => setText(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                placeholder="Escreva algo..."
              />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
              Tamanho da Fonte <span>{fontSize}px</span>
            </label>
            <div className="flex items-center gap-4 px-2">
              <input 
                type="range" 
                min="12" 
                max="120" 
                value={fontSize} 
                onChange={e => setFontSize(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar fonte..."
                  className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold outline-none"
                />
             </div>
             <button className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors">
               <Settings2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Font Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-[40px] transition-all duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          {filteredFonts.map(font => (
            <div 
              key={font.name} 
              className={`group p-8 rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between min-h-[220px] ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{font.name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{font.category}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {font.category !== 'Personalizada' && (
                    <a 
                      href={`https://fonts.google.com/specimen/${font.name.replace(' ', '+')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`p-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase transition-all ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Download className="w-3 h-3" /> BAIXAR
                    </a>
                  )}
                  {font.category === 'Personalizada' && (
                    <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">INSTALADA</span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <p 
                  style={{ 
                    fontFamily: `'${font.name}', sans-serif`, 
                    fontSize: `${fontSize}px`,
                    color: isDarkMode ? '#F8FAFC' : '#1E293B'
                  }}
                  className="leading-tight transition-all duration-300 text-center whitespace-nowrap"
                >
                  {text || 'Digite seu texto'}
                </p>
              </div>

              <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-100/10">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {font.category === 'Personalizada' ? 'FONTE IMPORTADA' : 'Google Fonts Ready'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {filteredFonts.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <Type className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-bold text-sm uppercase">Nenhuma fonte encontrada com este nome.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Palette className="w-5 h-5"/></div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">Cores Reais</h5>
            <p className="text-xs text-slate-500 leading-relaxed">O modo escuro ajuda a simular impressões em fundos escuros ou brindes pretos.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Grid className="w-5 h-5"/></div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">Variedade de Grade</h5>
            <p className="text-xs text-slate-500 leading-relaxed">Temos mais de 20 fontes profissionais pré-selecionadas e suporte às suas fontes personalizadas.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><ExternalLink className="w-5 h-5"/></div>
          <div>
            <h5 className="font-bold text-slate-800 text-sm mb-1">Upload de Fontes</h5>
            <p className="text-xs text-slate-500 leading-relaxed">Você pode importar arquivos .ttf ou .otf nas configurações do sistema para testar aqui.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontTester;
