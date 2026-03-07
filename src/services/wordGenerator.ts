import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, VerticalAlign, PageOrientation, BorderStyle } from "docx";
import * as FileSaver from "file-saver";
import { CurricularDevelopment } from "../types";

export const generateWordDocument = async (pdc: CurricularDevelopment) => {
  const doc = new Document({
    sections: [{
      properties: { 
        page: { 
          orientation: PageOrientation.LANDSCAPE, 
          size: { width: 16838, height: 11906 }, 
          margin: { top: 500, right: 500, bottom: 500, left: 500 } 
        } 
      },
      children: [
        new Paragraph({ 
          children: [new TextRun({ text: "PLAN DE DESARROLLO CURRICULAR (PDC)", bold: true, size: 28, font: "Arial" })], 
          alignment: AlignmentType.CENTER, spacing: { after: 200 } 
        }),
        createDataTable(pdc),
        new Paragraph({ children: [new TextRun({ text: "\nOBJETIVO HOLÍSTICO:", bold: true, size: 18, font: "Arial" })] }),
        new Paragraph({ children: [new TextRun({ text: pdc.objetivoHolistico || " ", size: 16, font: "Arial" })], spacing: { after: 200 }, alignment: AlignmentType.JUSTIFIED }),
        ...createMainTables(pdc),
        new Paragraph({ children: [new TextRun({ text: "\nADAPTACIONES CURRICULARES SIGNIFICATIVAS", bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } }),
        createSignificantTable(pdc),
        new Paragraph({ children: [new TextRun({ text: "\n\n\n__________________________          __________________________", size: 16 })], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
        new Paragraph({ children: [new TextRun({ text: "Firma del Maestro(a)                    Firma del Director(a)", bold: true, size: 14 })], alignment: AlignmentType.CENTER }),
      ]
    }]
  });
  const blob = await Packer.toBlob(doc);
  const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;
  saveAs(blob, `PDC_${pdc.mes}_PRIMARIA.docx`);
};

function createCell(text: string, options: { bold?: boolean, fill?: string, align?: AlignmentType, colSpan?: number, size?: number } = {}) {
  return new TableCell({ 
    children: [ 
      new Paragraph({ 
        children: [new TextRun({ text: text || "", bold: options.bold, size: options.size || 16, font: "Arial" })], 
        alignment: options.align || AlignmentType.LEFT 
      }) 
    ], 
    columnSpan: options.colSpan, 
    shading: options.fill ? { fill: options.fill } : undefined, 
    verticalAlign: VerticalAlign.CENTER, 
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    borders: { 
        top: { style: BorderStyle.SINGLE, size: 1 }, 
        bottom: { style: BorderStyle.SINGLE, size: 1 }, 
        left: { style: BorderStyle.SINGLE, size: 1 }, 
        right: { style: BorderStyle.SINGLE, size: 1 } 
    } 
  });
}

function createDataTable(pdc: CurricularDevelopment) {
  const rangoFechas = `Del: ${pdc.fechaInicio || "..."} Al: ${pdc.fechaFin || "..."}`;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [createCell("Distrito:", { bold: true, fill: "F2F2F2" }), createCell(pdc.distrito), createCell("Unidad Educativa:", { bold: true, fill: "F2F2F2" }), createCell(pdc.unidadEducativa)] }),
      new TableRow({ children: [createCell("Nivel:", { bold: true, fill: "F2F2F2" }), createCell(pdc.level), createCell("Año Escolaridad:", { bold: true, fill: "F2F2F2" }), createCell(pdc.anioEscolaridad)] }),
      new TableRow({ children: [createCell("Director(a):", { bold: true, fill: "F2F2F2" }), createCell(pdc.director), createCell("Maestra/o:", { bold: true, fill: "F2F2F2" }), createCell(pdc.maestra)] }),
      new TableRow({ children: [createCell("Áreas:", { bold: true, fill: "F2F2F2" }), createCell(pdc.camposAreas), createCell("Trimestre:", { bold: true, fill: "F2F2F2" }), createCell(pdc.trimestre)] }),
      new TableRow({ children: [createCell("Gestión:", { bold: true, fill: "F2F2F2" }), createCell(pdc.gestion), createCell("Fecha Ejecución:", { bold: true, fill: "F2F2F2" }), createCell(rangoFechas)] }),
    ]
  });
}

function createMainTables(pdc: CurricularDevelopment) {
  const headerRow = new TableRow({
    children: [
      createCell("PERIODOS", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER }),
      createCell("OBJETIVO APRENDIZAJE", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER }),
      createCell("CONTENIDOS", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER }),
      createCell("MOMENTOS METODOLÓGICOS", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER }),
      createCell("RECURSOS", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER }),
      createCell("CRITERIOS", { bold: true, fill: "D9E1F2", align: AlignmentType.CENTER })
    ]
  });

  const bodyRows = pdc.entries.map(e => {
    return new TableRow({
        children: [
            createCell(e.periodos, { align: AlignmentType.CENTER }),
            createCell(e.objetivoAprendizaje),
            createCell(e.contenidos),
            createCell(e.momentos),
            createCell(e.recursos),
            createCell(e.criterios)
        ]
    });
  });

  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] })];
}

function createSignificantTable(pdc: CurricularDevelopment) {
  const rows = [ new TableRow({ children: [ createCell("CONTENIDO ADAPTADO", { bold: true, fill: "E0E0E0", align: AlignmentType.CENTER }), createCell("ESTUDIANTE", { bold: true, fill: "E0E0E0", align: AlignmentType.CENTER }), createCell("ACCIÓN PEDAGÓGICA", { bold: true, fill: "E0E0E0", align: AlignmentType.CENTER }), createCell("EVALUACIÓN", { bold: true, fill: "E0E0E0", align: AlignmentType.CENTER }) ] }) ];
  pdc.adaptacionesSignificativas.forEach(item => { rows.push(new TableRow({ children: [ createCell(item.contenido), createCell(item.discapacidad), createCell(item.adaptacion), createCell(item.criterios) ] })); });
  if (pdc.adaptacionesSignificativas.length === 0) rows.push(new TableRow({ children: [createCell("No se registran adaptaciones significativas.", { colSpan: 4, align: AlignmentType.CENTER })] }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}
