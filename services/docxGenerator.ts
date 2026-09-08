import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, Header, Footer, ImageRun, BorderStyle, VerticalAlign, PageNumber } from 'docx';
import { ReportData } from '../types';

// Local implementation of saveAs to avoid module import issues
const saveAs = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Constants for styling
const FONT_FAMILY = "Times New Roman"; // Standard for legal docs
const FONT_SIZE_TEXT = 24; // 12pt (docx uses half-points)
const FONT_SIZE_TITLE = 28; // 14pt

const createHeading = (text: string) => {
  return new Paragraph({
    text: text,
    heading: "Heading1",
    spacing: { before: 200, after: 200 },
    style: "Heading1",
  });
};

const createSubHeading = (text: string) => {
    return new Paragraph({
      text: text,
      heading: "Heading2",
      spacing: { before: 150, after: 100 },
      style: "Heading2",
    });
};

const createText = (text: string, bold = false) => {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_FAMILY, size: FONT_SIZE_TEXT, bold })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
  });
};

const createQARow = (q: string, a: string, index: number) => {
  return [
    new Paragraph({
      children: [new TextRun({ text: `${index + 1}. ${q}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT, bold: true })],
      spacing: { before: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `R: ${a}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })],
      spacing: { after: 200 },
    }),
  ];
};

export const generateDocx = async (data: ReportData) => {
  // Helper for Table Cells
  const cell = (text: string, bold = false, fill?: string) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: FONT_FAMILY, size: FONT_SIZE_TEXT })] })],
    shading: fill ? { fill } : undefined,
    width: { size: 50, type: WidthType.PERCENTAGE },
  });

  // Helper for Base64 image extraction
  const getImageData = (dataUrl: string) => {
      try {
        const base64Data = dataUrl.split(',')[1];
        return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      } catch (e) {
          console.error("Error processing image", e);
          return null;
      }
  };

  const logoData = data.logoUrl ? getImageData(data.logoUrl) : null;

  // Table Data construction
  const processTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [cell("Autoridade requisitante", true, "E1ECF6"), cell(data.processo.autoridade)] }),
      new TableRow({ children: [cell("Número do processo", true, "E1ECF6"), cell(data.processo.numero)] }),
      new TableRow({ children: [cell("Natureza da ação", true, "E1ECF6"), cell(data.processo.natureza)] }),
      new TableRow({ children: [cell("Registro IMC", true, "E1ECF6"), cell(data.processo.registroImc || (data.processo as any).registroImesc || '')] }),
      new TableRow({ children: [cell("Data da perícia", true, "E1ECF6"), cell(data.processo.dataPericia)] }),
      new TableRow({ children: [cell("Dados do Requerente", true, "CCCCCC"), cell("", false, "CCCCCC")] }), // Header row style
      new TableRow({ children: [cell("Nome", true, "E1ECF6"), cell(data.processo.requerente.nome)] }),
      new TableRow({ children: [cell("Data de Nascimento", true, "E1ECF6"), cell(data.processo.requerente.nascimento)] }),
      new TableRow({ children: [cell("RG", true, "E1ECF6"), cell(data.processo.requerente.rg)] }),
      new TableRow({ children: [cell("CPF", true, "E1ECF6"), cell(data.processo.requerente.cpf)] }),
      new TableRow({ children: [cell("Endereço", true, "E1ECF6"), cell(data.processo.requerente.endereco)] }),
      new TableRow({ children: [cell("Requerido", true, "CCCCCC"), cell(data.processo.requerido)] }),
    ],
  });

  // Header Table Structure (Logo Left, Text Center)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
    },
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: logoData ? [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: logoData,
                                    transformation: {
                                        width: 60,
                                        height: 60,
                                    },
                                }),
                            ],
                        }),
                    ] : [],
                }),
                new TableCell({
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "GOVERNO DO ESTADO DE SÃO PAULO | SECRETARIA DA JUSTIÇA E CIDADANIA",
                                    font: FONT_FAMILY,
                                    size: 16,
                                    bold: true,
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Instituto de Medicina Social e de Criminologia de São Paulo – IMC",
                                    font: FONT_FAMILY,
                                    size: 16,
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Rua Barra Funda, 824 – São Paulo / SP – CEP: 01152-000",
                                    font: FONT_FAMILY,
                                    size: 14,
                                }),
                            ],
                            border: {
                                bottom: { style: BorderStyle.SINGLE, space: 5, color: "000000" }
                            }
                        }),
                    ],
                }),
            ],
        }),
    ],
  });

  // Footer Table Structure
  const footerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
      },
      rows: [
          new TableRow({
              children: [
                  new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                          new Paragraph({
                              children: [
                                  new TextRun({ text: data.peritoName || "", bold: true, size: 16, font: FONT_FAMILY }),
                              ]
                          }),
                          new Paragraph({
                              children: [
                                  new TextRun({ text: data.peritoCrm ? `CRM: ${data.peritoCrm}` : "", size: 16, font: FONT_FAMILY }),
                              ]
                          }),
                      ],
                  }),
                  new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.BOTTOM,
                      children: [
                          new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                  new TextRun({ text: `PASTA IMC: ${data.folderNumber || "S/N"}`, bold: true, size: 16, font: FONT_FAMILY }),
                              ]
                          }),
                           new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                  new TextRun({ text: "Página ", size: 16, font: FONT_FAMILY }),
                                  new TextRun({
                                      children: [PageNumber.CURRENT],
                                      size: 16,
                                      font: FONT_FAMILY
                                  }),
                                  new TextRun({ text: " de ", size: 16, font: FONT_FAMILY }),
                                  new TextRun({
                                      children: [PageNumber.TOTAL_PAGES],
                                      size: 16,
                                      font: FONT_FAMILY
                                  }),
                              ]
                          }),
                      ]
                  })
              ]
          })
      ]
  });

  // Document Structure
  const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                run: {
                    size: 28,
                    bold: true,
                    color: "000000",
                    font: FONT_FAMILY,
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                run: {
                    size: 24,
                    bold: true,
                    color: "000000",
                    font: FONT_FAMILY,
                    allCaps: true,
                },
            },
        ]
    },
    sections: [
      // 1. Cover Page Section
      {
        properties: {
             page: {
                margin: {
                    top: 1000,
                    right: 1000,
                    bottom: 1000,
                    left: 1000,
                },
            },
        },
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 },
                children: logoData ? [
                    new ImageRun({
                        data: logoData,
                        transformation: { width: 100, height: 100 },
                    })
                ] : [],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "GOVERNO DO ESTADO DE SÃO PAULO", font: FONT_FAMILY, size: 24, bold: true })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "SECRETARIA DA JUSTIÇA E CIDADANIA", font: FONT_FAMILY, size: 24, bold: true })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 2000 },
                children: [new TextRun({ text: "Instituto de Medicina Social e de Criminologia de São Paulo – IMC", font: FONT_FAMILY, size: 24 })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                heading: "Heading1",
                spacing: { after: 2000 },
                children: [new TextRun({ text: "LAUDO MÉDICO-LEGAL", font: FONT_FAMILY, size: 48, bold: true })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000 },
                children: [new TextRun({ text: `Perito: ${data.peritoName}`, font: FONT_FAMILY, size: 28, bold: true })]
            }),
             new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `CRM: ${data.peritoCrm}`, font: FONT_FAMILY, size: 24 })]
            }),
            new Paragraph({
                 alignment: AlignmentType.CENTER,
                 spacing: { before: 2000 },
                 children: [new TextRun({ text: `São Paulo, ${new Date().toLocaleDateString('pt-BR')}`, font: FONT_FAMILY, size: 24 })]
            }),
        ],
      },
      // 2. Main Report Section
      {
        properties: {
             page: {
                margin: {
                    top: 1000,
                    right: 1000,
                    bottom: 1000,
                    left: 1000,
                },
            },
        },
        headers: {
          default: new Header({
            children: [headerTable],
          }),
        },
        footers: {
          default: new Footer({
            children: [footerTable],
          }),
        },
        children: [
            // Internal Title (Optional, keeping for continuity)
            new Paragraph({
                text: "LAUDO MÉDICO-LEGAL",
                alignment: AlignmentType.CENTER,
                heading: "Heading1",
                spacing: { before: 800, after: 800 },
            }),

            // 1. PREÂMBULO
            createHeading("1. PREÂMBULO"),
            createSubHeading("1.1. DADOS DO PROCESSO"),
            processTable,
            new Paragraph({ text: "", spacing: { after: 200 } }), // spacer

            createSubHeading("1.2. DADOS DO PERITO"),
            createText(data.peritoIntro),

            createSubHeading("1.3. RESUMO DA EXORDIAL"),
            createText(data.resumoExordial),

            createSubHeading("1.4. RESUMO DA CONTESTAÇÃO"),
            createText(data.resumoContestacao),

            createSubHeading("1.5. DESPACHO SANEADOR"),
            createText(data.despachoSaneador),

            // 2. HISTÓRICO
            createHeading("2. HISTÓRICO"),
            createSubHeading("2.1. CONTEXTO PERICIAL"),
            createText(data.historico.contexto || "Sem dados."),
            createSubHeading("2.2. ANAMNESE MÉDICO PERICIAL"),
            createText(data.historico.anamnese || "Sem dados."),
            createSubHeading("2.3. ANTECEDENTES PESSOAIS"),
            createText(data.historico.antecedentesPessoais || "Sem dados."),
            createSubHeading("2.4. ANTECEDENTES FAMILIARES"),
            createText(data.historico.antecedentesFamiliares || "Sem dados."),
            createSubHeading("2.5. ANTECEDENTES SOCIOEDUCACIONAIS"),
            createText(data.historico.antecedentesSocio || "Sem dados."),
            createSubHeading("2.6. DOCUMENTOS MÉDICO LEGAIS"),
            createText(data.historico.documentosLegais || "Vide anexo."),

            // 3. DESCRIÇÃO
            createHeading("3. DESCRIÇÃO"),
            createSubHeading("3.1. EXAME FÍSICO GERAL"),
            createText(data.exameFisicoGeral),
            createSubHeading("3.2. EXAME FÍSICO ESPECÍFICO"),
            createText(data.exameFisicoEspecifico),

            // 4. DISCUSSÃO
            createHeading("4. DISCUSSÃO"),
            createSubHeading("4.1. MÉTODO E TÉCNICA"),
            createText(data.metodoTecnica),
            createSubHeading("4.2. LITERATURA MÉDICA"),
            createText(data.literatura),
            createSubHeading("4.3. CONTEXTUALIZAÇÃO DA PERICIADA"),
            createText(data.contextualizacao),

            // 5. CONCLUSÕES
            createHeading("5. CONCLUSÕES"),
            createText(data.conclusao),

            // 6. QUESITOS
            createHeading("6. RESPOSTA AOS QUESITOS"),
            
            createSubHeading("6.1. QUESITOS DO JUÍZO"),
            ...(data.quesitosJuizo.length > 0 
                ? data.quesitosJuizo.flatMap((q, i) => createQARow(q.question, q.answer, i))
                : [createText("Sem quesitos do juízo.")]),

            createSubHeading("6.2. QUESITOS DO REQUERENTE"),
            ...(data.quesitosRequerente.length > 0 
                ? data.quesitosRequerente.flatMap((q, i) => createQARow(q.question, q.answer, i))
                : [createText("Sem quesitos do requerente.")]),

            createSubHeading("6.3. QUESITOS DO REQUERIDO"),
            ...(data.quesitosRequerido.length > 0 
                ? data.quesitosRequerido.flatMap((q, i) => createQARow(q.question, q.answer, i))
                : [createText("Sem quesitos do requerido.")]),

            // 7. ENCERRAMENTO
            createHeading("7. ENCERRAMENTO"),
            createText("O conteúdo deste trabalho espelha o presente entendimento deste perito sobre a matéria em litígio, sendo fundamentado nas informações disponibilizadas e no conhecimento científico à época dos fatos."),
            createText("Este laudo, tal como se apresenta, está protegido pela legislação vigente de direito autoral e qualquer reprodução parcial ou total deve respeitar as normas científicas."),
            
            new Paragraph({ text: "", spacing: { after: 400 } }),
            
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "São Paulo, " + new Date().toLocaleDateString('pt-BR'), font: FONT_FAMILY, size: FONT_SIZE_TEXT }),
                ]
            }),
            new Paragraph({ text: "", spacing: { after: 800 } }),
            
             new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: data.peritoName || "Assinatura do Perito", font: FONT_FAMILY, size: FONT_SIZE_TEXT, bold: true }),
                ]
            }),
             new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: `CRM: ${data.peritoCrm || "-"}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }),
                ]
            }),

            // 8. REFERENCES
            createHeading("8. REFERÊNCIAS BIBLIOGRÁFICAS"),
            createText(data.literatura)
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `Laudo_IMC_${data.folderNumber.replace(/[^a-zA-Z0-9]/g, '_') || 'Draft'}.docx`);
  });
};