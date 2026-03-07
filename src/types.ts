
export enum EducationalLevel {
  PRIMARIA = "EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL"
}

export interface PDCWeekEntry {
  id: string;
  label: string;
  // Primaria specific
  objetivoAprendizaje: string;
  contenidos: string;
  momentos: string;
  recursos: string;
  periodos: string;
  criterios: string;
}

export interface CurricularDevelopment {
  id: string;
  planNumber: string;
  level: EducationalLevel;
  distrito: string;
  unidadEducativa: string;
  maestra: string;
  director: string;
  anioEscolaridad: string;
  camposAreas: string;
  trimestre: string;
  mes: string;
  gestion: string;
  fechaInicio: string;
  fechaFin: string;
  objetivoHolistico: string;
  
  entries: PDCWeekEntry[];
  
  criteriosEvaluacion: {
    ser: string;
    saber: string;
    hacer: string;
  };
  
  adaptacionesNoSignificativas: string;
  
  adaptacionesSignificativas: Array<{
    id: string;
    contenido: string;
    discapacidad: string;
    adaptacion: string;
    criterios: string;
  }>;
}
