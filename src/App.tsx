import React, { useState, useRef } from 'react';
import {
  FileDown, Plus, Trash2, BookOpen, User, Check, FileSpreadsheet,
  Loader2, School2, Sparkles, Menu, X, 
  Building2, ClipboardList, PenTool, Wand2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { EducationalLevel, CurricularDevelopment, PDCWeekEntry } from './types';
import { generateWordDocument } from './services/wordGenerator';
import { MAPA_MESES, CURRICULO_PRIMARIA } from './curriculumData';
import { generateObjective, generatePlanningScreed, suggestAdaptation } from './services/geminiService';

const MATERIAS = {
  [EducationalLevel.PRIMARIA]: ["Valores Espiritualidades y Religiones", "Comunicación y Lenguajes", "Artes Plásticas y Visuales", "Educación Musical", "Educación Física y Deportes", "Ciencias Sociales", "Ciencias Naturales", "Matemática", "Técnica Tecnológica"]
};

const NIVELES = [
  { id: EducationalLevel.PRIMARIA, label: "NIVEL PRIMARIO", icon: School2, description: "Educación Primaria Comunitaria Vocacional" }
];

const INITIAL_STATE: CurricularDevelopment = {
  id: '1', planNumber: '1', level: EducationalLevel.PRIMARIA, distrito: '', unidadEducativa: '', maestra: '', director: '',
  anioEscolaridad: '1er Año de Escolaridad', camposAreas: '', trimestre: 'PRIMER TRIMESTRE', mes: 'FEBRERO', gestion: '2026', fechaInicio: '', fechaFin: '',
  objetivoHolistico: '', entries: Array.from({ length: 4 }, (_, i) => ({
    id: 'e-' + Date.now() + '-' + i,
    label: 'Semana ' + (i + 1),
    objetivoAprendizaje: '', contenidos: '',
    momentos: '', recursos: '', periodos: '12', criterios: ''
  })),
  criteriosEvaluacion: { ser: '', saber: '', hacer: '' }, adaptacionesNoSignificativas: '', 
  adaptacionesSignificativas: []
};

const ANIOS_ESCOLARIDAD = {
  [EducationalLevel.PRIMARIA]: ["1er Año de Escolaridad", "2do Año de Escolaridad", "3er Año de Escolaridad", "4to Año de Escolaridad", "5to Año de Escolaridad", "6to Año de Escolaridad"]
};

const TRIMESTRES = ["PRIMER TRIMESTRE", "SEGUNDO TRIMESTRE", "TERCER TRIMESTRE"];
const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

export default function App() {
  const [pdc, setPdc] = useState<CurricularDevelopment>(INITIAL_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'import' | 'prompt'>('editor');
  const [promptData, setPromptData] = useState({ 
    curso: '1er Año de Escolaridad', 
    trimestre: 'PRIMER TRIMESTRE', 
    mes: 'FEBRERO', 
    areas: [] as string[], 
    temas: '' 
  });

  const [pasteText, setPasteText] = useState('');
  const [activeAdaptationId, setActiveAdaptationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efecto para autocompletar temas según currículo maestro para Primaria
  React.useEffect(() => {
    const anio = promptData.curso;
    const mes = promptData.mes.toUpperCase();
    const trimestre = promptData.trimestre.toUpperCase();
    
    const trimesterMonths: Record<string, string[]> = {
      "PRIMER TRIMESTRE": ["FEBRERO", "MARZO", "ABRIL"],
      "SEGUNDO TRIMESTRE": ["MAYO", "JUNIO", "JULIO"],
      "TERCER TRIMESTRE": ["AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE"]
    };

    const validMonths = trimesterMonths[trimestre] || [];
    const relativeMonthIdx = validMonths.indexOf(mes);

    if (relativeMonthIdx !== -1) {
      const startIndex = relativeMonthIdx * 4;
      const nuevosTemas = promptData.areas
        .map(area => {
          const trimesterData = CURRICULO_PRIMARIA[anio]?.[area] || {};
          const contents = trimesterData[trimestre];
          if (contents) {
            const semanasMes = contents.slice(startIndex, startIndex + 4);
            return `${area}: ${semanasMes.join(", ")}`;
          }
          return "";
        })
        .filter(t => t !== "")
        .join("\n");
      
      setPromptData(prev => ({ ...prev, temas: nuevosTemas }));
    } else {
      setPromptData(prev => ({ ...prev, temas: "[El mes no corresponde al trimestre]" }));
    }
  }, [promptData.mes, promptData.areas, promptData.curso, promptData.trimestre]);

  const getAIPrompt = () => {
    return `Actúa como un Experto Pedagogo boliviano especialista en EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL. Genera un PDC PROFESIONAL para:
- NIVEL: PRIMARIA
- AÑO DE ESCOLARIDAD: ${promptData.curso}
- TRIMESTRE: ${promptData.trimestre}
- MES: ${promptData.mes}
- ÁREAS DE SABERES Y CONOCIMIENTO: ${promptData.areas.join(', ')}
- CONTENIDOS OFICIALES: ${promptData.temas}

ESTRUCTURA OBLIGATORIA (Usa barras "|" entre cada columna):

DISTRITO EDUCATIVO: [Nombre]
UNIDAD EDUCATIVA: [Nombre]
DIRECTOR(A): [Nombre]
AÑO DE ESCOLARIDAD: ${promptData.curso}
MAESTRA(O): [Nombre]
TRIMESTRE: ${promptData.trimestre}
MES: ${promptData.mes}

OBJETIVO HOLÍSTICO: [Redacta el párrafo completo integrando SER, SABER, HACER, DECIDIR enfocados en las áreas seleccionadas]

TABLA DE PLANIFICACIÓN (6 COLUMNAS):
Nro | OBJETIVO DE APRENDIZAJE | CONTENIDOS | MOMENTOS METODOLÓGICOS | RECURSOS | CRITERIOS DE EVALUACIÓN
1 | [Objetivo de aprendizaje] | [Contenidos específicos] | (PRÁCTICA) [Actividad] (TEORÍA) [Conceptos] (VALORACIÓN) [Reflexión] (PRODUCCIÓN) [Producto] | [Materiales] | (SER) ... (SABER) ... (HACER)
2 | [Objetivo de aprendizaje] | [Contenidos específicos] | (PRÁCTICA) ... (TEORÍA) ... (VALORACIÓN) ... (PRODUCCIÓN) | [Materiales] | (SER) ... (SABER) ... (HACER)
3 | [Objetivo de aprendizaje] | [Contenidos específicos] | (PRÁCTICA) ... (TEORÍA) ... (VALORACIÓN) ... (PRODUCCIÓN) | [Materiales] | (SER) ... (SABER) ... (HACER)
4 | [Objetivo de aprendizaje] | [Contenidos específicos] | (PRÁCTICA) ... (TEORÍA) ... (VALORACIÓN) ... (PRODUCCIÓN) | [Materiales] | (SER) ... (SABER) ... (HACER)

REGLAS: No uses saltos de línea dentro de las celdas. Asegura coherencia entre contenidos y objetivos.`;
  };

  const togglePromptArea = (area: string) => {
    setPromptData(prev => ({
      ...prev,
      areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area]
    }));
  };

  const handleImportRawText = () => {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      
      const getValue = (key: string) => {
        const line = lines.find(l => l.toUpperCase().includes(key.toUpperCase()));
        if (!line) return '';
        const parts = line.split(/[:\t|]/);
        const keyIdx = parts.findIndex(p => p.toUpperCase().includes(key.toUpperCase()));
        return parts[keyIdx + 1] ? parts[keyIdx + 1].trim() : '';
      };

      const dataRows = lines.filter(l => {
        const up = l.toUpperCase();
        const separators = (l.match(/[\t|]/g) || []).length;
        return separators >= 5 && !up.includes("DISTRITO") && !up.includes("DIRECTOR");
      });

      setPdc(prev => ({
        ...prev,
        distrito: getValue("DISTRITO") || prev.distrito,
        unidadEducativa: getValue("UNIDAD EDUCATIVA") || getValue("U.E.") || prev.unidadEducativa,
        director: getValue("DIRECTOR") || prev.director,
        anioEscolaridad: getValue("AÑO DE ESCOLARIDAD") || getValue("CURSO") || prev.anioEscolaridad,
        maestra: getValue("MAESTRA") || prev.maestra,
        trimestre: getValue("TRIMESTRE") || prev.trimestre,
        mes: getValue("MES") || prev.mes,
        objetivoHolistico: lines.find(l => l.toUpperCase().includes("OBJETIVO HOLÍSTICO"))?.split(':')?.[1]?.trim() || prev.objetivoHolistico,
        entries: prev.entries.map((entry, i) => {
          const rawRow = dataRows[i];
          if (!rawRow) return entry;
          let cols = rawRow.split(/[\t|]/).map(c => c.trim()).filter(c => c !== '');
          if (cols[0] && /^[1-4]$/.test(cols[0])) cols.shift();
          return { 
            ...entry, 
            periodos: cols[0] || '12',
            objetivoAprendizaje: cols[1] || '',
            contenidos: cols[2] || '',
            momentos: cols[3] || '',
            recursos: cols[4] || '',
            criterios: cols[5] || ''
          };
        })
      }));
      setActiveTab('editor');
      alert("¡Importación exitosa!");
    } catch (e) { alert("Error al importar."); }
  };

  const handleGenerateObjective = async () => {
    if (!pdc.camposAreas) { alert("Seleccione áreas primero."); return; }
    setIsGenerating(true);
    try {
      const result = await generateObjective(pdc.level, pdc.anioEscolaridad, pdc.camposAreas, pdc.trimestre);
      setPdc(prev => ({ ...prev, objetivoHolistico: result }));
    } catch (error) { console.error(error); } finally { setIsGenerating(false); }
  };

  const handleAutocompletePlanning = async () => {
    if (!pdc.objetivoHolistico) { alert("Genere el objetivo primero."); return; }
    setIsGenerating(true);
    try {
      const startIndex = MAPA_MESES[pdc.mes.toUpperCase()] * 4;
      const subjects = pdc.camposAreas.split(', ');
      const allTopics = subjects.map(s => {
        const topics = CURRICULO_PRIMARIA[pdc.anioEscolaridad]?.[s]?.[pdc.trimestre] || [];
        return `${s}: ${topics.slice(startIndex, startIndex + 4).join(', ')}`;
      }).join(' | ');

      const results = await generatePlanningScreed(pdc.level, pdc.anioEscolaridad, pdc.camposAreas, pdc.objetivoHolistico, allTopics);
      setPdc(prev => ({
        ...prev,
        entries: prev.entries.map((entry, idx) => {
          const ai = results[idx] || {};
          return { ...entry, ...ai, objetivoAprendizaje: ai.objetivo_semanal || entry.objetivoAprendizaje };
        })
      }));
    } catch (error) { alert("Error de IA."); } finally { setIsGenerating(false); }
  };

  const handleSuggestAdaptation = async (idx: number) => {
    const item = pdc.adaptacionesSignificativas[idx];
    if (!item.contenido || !item.discapacidad) return;
    setActiveAdaptationId(item.id);
    try {
      const res = await suggestAdaptation(item.contenido, item.discapacidad);
      const na = [...pdc.adaptacionesSignificativas];
      na[idx] = { ...na[idx], adaptacion: res.accion, criterios: res.evaluacion };
      setPdc({ ...pdc, adaptacionesSignificativas: na });
    } finally { setActiveAdaptationId(null); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-[13px] font-medium text-slate-900 font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-12 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Planificación /</span>
            <span className="text-slate-800 font-black uppercase text-[11px] tracking-tight">NIVEL PRIMARIO</span>
          </div>
          <ActionButton onClick={async () => { setIsExporting(true); await generateWordDocument(pdc); setIsExporting(false); }} icon={isExporting ? Loader2 : FileDown} label="GENERAR DOCUMENTO" color="indigo" disabled={isExporting} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-1 border-b border-slate-200 mb-2">
            <TabButton active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} icon={PenTool} label="Editor Manual" />
            <TabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon={ClipboardList} label="Pegar Texto Plano" />
            <TabButton active={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')} icon={Sparkles} label="Generador de Prompt IA" />
          </div>

          {activeTab === 'prompt' ? (
            <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField label="Año de Escolaridad" value={promptData.curso} options={ANIOS_ESCOLARIDAD[EducationalLevel.PRIMARIA]} onChange={(v) => setPromptData({...promptData, curso: v})} />
                <SelectField label="Trimestre" value={promptData.trimestre} options={TRIMESTRES} onChange={(v) => setPromptData({...promptData, trimestre: v})} />
                <SelectField label="Mes" value={promptData.mes} options={MESES} onChange={(v) => setPromptData({...promptData, mes: v})} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Áreas de Saberes</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {MATERIAS[EducationalLevel.PRIMARIA].map(area => (
                    <label key={area} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${promptData.areas.includes(area) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <input type="checkbox" className="hidden" checked={promptData.areas.includes(area)} onChange={() => togglePromptArea(area)} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{area}</span>
                      {promptData.areas.includes(area) && <Check className="w-3 h-3 ml-auto" />}
                    </label>
                  ))}
                </div>
              </div>
              <textarea value={promptData.temas} onChange={(e) => setPromptData({...promptData, temas: e.target.value})} className="w-full p-3 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded resize-none" rows={3} placeholder="Contenidos..." />
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded">
                <div className="bg-slate-900 p-4 rounded text-[10px] font-mono text-indigo-300 whitespace-pre-wrap max-h-[150px] overflow-y-auto">{getAIPrompt()}</div>
                <button onClick={() => { navigator.clipboard.writeText(getAIPrompt()); alert("Prompt copiado"); }} className="mt-4 w-full py-3 bg-indigo-600 text-white rounded font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg">
                  <Sparkles className="w-4 h-4" /> Copiar Prompt Maestro
                </button>
              </div>
            </div>
          ) : activeTab === 'import' ? (
            <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} className="w-full h-[400px] p-4 font-mono text-[11px] bg-slate-900 text-green-400 rounded outline-none" placeholder="Pega aquí tu PDC..." />
              <button onClick={handleImportRawText} className="w-full py-3 bg-indigo-600 text-white rounded font-black uppercase tracking-widest flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Importar Ahora</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-wrap gap-4">
                <InputField label="Plan Nro." value={pdc.planNumber} onChange={(v) => setPdc({...pdc, planNumber: v})} />
                <InputField label="Gestión" value={pdc.gestion} onChange={(v) => setPdc({...pdc, gestion: v})} />
                <InputField label="Mes" value={pdc.mes} onChange={(v) => setPdc({...pdc, mes: v})} />
                <InputField label="Año" value={pdc.anioEscolaridad} onChange={(v) => setPdc({...pdc, anioEscolaridad: v})} />
                <InputField label="Maestra(o)" value={pdc.maestra} onChange={(v) => setPdc({...pdc, maestra: v})} />
                <InputField label="Trimestre" value={pdc.trimestre} onChange={(v) => setPdc({...pdc, trimestre: v})} />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-50 border-b p-2 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Objetivo Holístico</span>
                  <button onClick={handleGenerateObjective} className="bg-indigo-600 text-white px-2 py-1 rounded">Sugerencia IA</button>
                </div>
                <textarea value={pdc.objetivoHolistico} onChange={(e) => setPdc({...pdc, objetivoHolistico: e.target.value})} className="w-full p-3 text-xs font-semibold outline-none min-h-[80px]" />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-x-auto shadow-sm">
                <div className="bg-slate-50 border-b p-2 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Planificación Semanal</span>
                  <button onClick={handleAutocompletePlanning} className="bg-blue-600 text-white px-2 py-1 rounded">Autocompletar IA</button>
                </div>
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                      <th className="px-3 py-2 border-r w-16 text-center">PER.</th>
                      <th className="px-3 py-2 border-r">OBJETIVO DE APRENDIZAJE</th>
                      <th className="px-3 py-2 border-r">CONTENIDOS</th>
                      <th className="px-3 py-2 border-r w-1/3">MOMENTOS</th>
                      <th className="px-3 py-2 border-r">RECURSOS</th>
                      <th className="px-3 py-2">CRITERIOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdc.entries.map((e, idx) => (
                      <tr key={e.id} className="border-b">
                        <td className="p-1 border-r"><input type="text" value={e.periodos} onChange={(v) => updateEntry(idx, 'periodos', v.target.value)} className="w-full text-center font-black outline-none" /></td>
                        <TableC value={e.objetivoAprendizaje} onChange={(v) => updateEntry(idx, 'objetivoAprendizaje', v)} borderR />
                        <TableC value={e.contenidos} onChange={(v) => updateEntry(idx, 'contenidos', v)} borderR />
                        <TableC value={e.momentos} onChange={(v) => updateEntry(idx, 'momentos', v)} borderR />
                        <TableC value={e.recursos} onChange={(v) => updateEntry(idx, 'recursos', v)} borderR />
                        <TableC value={e.criterios} onChange={(v) => updateEntry(idx, 'criterios', v)} isAccent />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  function updateEntry(idx: number, field: keyof PDCWeekEntry, value: string) {
    const ne = [...pdc.entries]; (ne[idx] as any)[field] = value; setPdc({...pdc, entries: ne});
  }
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
      <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {label}</div>
    </button>
  );
}

function ActionButton({ onClick, icon: Icon, label, color, disabled }: any) {
  const colors: any = { indigo: 'bg-indigo-600 text-white hover:bg-indigo-700' };
  return (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border transition-all ${colors[color]}`}>
      <Icon className={`w-3.5 h-3.5 ${disabled ? 'animate-spin' : ''}`} /> <span>{label}</span>
    </button>
  );
}

function InputField({ label, value, onChange }: any) {
  return (
    <div className="flex-1 min-w-[120px]">
      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded bg-slate-50 px-2 py-1.5 text-xs font-bold" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded bg-slate-50 px-3 py-2 text-xs font-bold">
        {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TableC({ value, onChange, borderR, isAccent }: any) {
  return (
    <td className={`p-0 ${borderR ? 'border-r' : ''} ${isAccent ? 'bg-indigo-50/20' : ''}`}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full p-2 text-[11px] font-medium bg-transparent outline-none resize-none" />
    </td>
  );
}
