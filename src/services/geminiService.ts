import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let client: GoogleGenAI | null = null;
if (API_KEY) { client = new GoogleGenAI({ apiKey: API_KEY }); }

export const generateObjective = async (level: string, year: string, subjects: string, context?: string): Promise<string> => {
  if (!client) throw new Error("API Key no configurada.");
  const prompt = `Actúa como un experto pedagogo boliviano especialista en EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL (Ley 070). 
  Redacta un OBJETIVO HOLÍSTICO para el año: ${year}. 
  Áreas: ${subjects}. 
  Contexto: ${context}. 
  Estructura obligatoria: Integrar armoniosamente las dimensiones SER (valores), SABER (conocimientos), HACER (práctica/habilidades) y DECIDIR (impacto social) en un solo párrafo cohesivo y técnico. 
  Responde solo con el texto del objetivo.`;
  const response = await client.models.generateContent({ model: "gemini-1.5-flash", contents: prompt });
  return response.text || "";
};

export const generatePlanningScreed = async (level: string, year: string, subjects: string, objective: string, topics?: string) => {
  if (!client) throw new Error("API Key no configurada.");
  const prompt = `Actúa como un experto en diseño curricular boliviano especialista en EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL. 
  Basado en Año de Escolaridad: ${year}, Áreas: ${subjects} y el Objetivo Holístico: "${objective}". 
  
  CONTENIDOS OFICIALES A DESARROLLAR (OBLIGATORIO):
  ${topics || "Usar los temas oficiales del currículo boliviano de Primaria para este año."}

  Genera una planificación técnica para 4 semanas en formato JSON [ {semana, objetivo_semanal, contenidos, momentos, recursos, criterios} ]. 
  
  REQUISITOS CRÍTICOS PARA PRIMARIA:
  1. "objetivo_semanal": Un objetivo de aprendizaje específico para la semana, redactado en infinitivo, técnico y alineado al tema.
  2. "contenidos": Distribuye los CONTENIDOS OFICIALES proporcionados de forma coherente en las 4 semanas.
  3. "momentos": Un solo párrafo fluido que integre armónicamente: (PRÁCTICA), (TEORÍA), (VALORACIÓN) y (PRODUCCIÓN).
  4. "criterios": Desglosa las dimensiones: (SER), (SABER), (HACER) en un solo párrafo técnico.
  
  Responde estrictamente en JSON.`;
  const result = await client.models.generateContent({ model: "gemini-1.5-flash", config: { responseMimeType: "application/json" }, contents: prompt });
  return JSON.parse(result.response.text() || "[]");
};

/**
 * Sugiere adaptaciones curriculares significativas para un caso específico
 */
export const suggestAdaptation = async (content: string, disability: string) => {
  if (!client) throw new Error("API Key no configurada.");
  
  const prompt = `
    Actúa como un experto en Educación Especial e Inclusiva en Bolivia.
    Contenido a adaptar: "${content}"
    Discapacidad o Condición: "${disability}"
    
    Genera una propuesta técnica en formato JSON con:
    - accion: Estrategia pedagógica específica para este estudiante.
    - evaluacion: Cómo se evaluará el aprendizaje considerando su condición.
    
    Respuesta estrictamente en JSON: {"accion": "...", "evaluacion": "..."}
  `;

  try {
    const result = await client.models.generateContent({ 
      model: "gemini-1.5-flash", 
      config: { responseMimeType: "application/json" },
      contents: prompt 
    });
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Error en IA de adaptaciones:", error);
    return { accion: "Error al generar sugerencia", evaluacion: "Verificar conexión" };
  }
};
