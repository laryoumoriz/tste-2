
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportData } from '../types';

// Helper: Clean HTML to PDF-friendly text
const cleanHtml = (html: string): string => {
  if (!html) return "";
  
  // 1. Replace block elements with newlines to preserve structure
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• '); // Bullet points

  // 2. Strip all remaining HTML tags
  const tmp = document.createElement("DIV");
  tmp.innerHTML = text;
  text = tmp.textContent || tmp.innerText || "";

  return text.trim();
};

// Core function to create the jsPDF object
const createPdfDocument = (data: ReportData): jsPDF => {
  const doc = new jsPDF();
  const tocItems: { title: string, page: number }[] = [];
  
  // Constants
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 45; // Space for header
  const marginBottom = 30; // Space for footer
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;

  // --- 1. COVER PAGE ---
  const generateCover = () => {
      let y = 40;
      
      // Logo
      if (data.logoUrl) {
        try {
            // Maintain aspect ratio, fix width to approx 30mm
            const imgProps = doc.getImageProperties(data.logoUrl);
            const ratio = imgProps.width / imgProps.height;
            const width = 30;
            const height = width / ratio;
            doc.addImage(data.logoUrl, 'JPEG', (pageWidth - width) / 2, y, width, height);
            y += height + 10;
        } catch (e) {
            console.warn("Logo error", e);
            y += 40;
        }
      } else {
          y += 40;
      }

      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("GOVERNO DO ESTADO DE SÃO PAULO", pageWidth / 2, y, { align: "center" });
      y += 7;
      doc.text("SECRETARIA DA JUSTIÇA E CIDADANIA", pageWidth / 2, y, { align: "center" });
      y += 10;
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text("Instituto de Medicina Social e de Criminologia de São Paulo – IMESC", pageWidth / 2, y, { align: "center" });
      
      y += 60;
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      doc.text("LAUDO MÉDICO-LEGAL", pageWidth / 2, y, { align: "center" });

      y += 40;
      doc.setFontSize(16);
      doc.text(`Perito: ${data.peritoName}`, pageWidth / 2, y, { align: "center" });
      y += 10;
      doc.setFontSize(14);
      doc.text(`CRM: ${data.peritoCrm}`, pageWidth / 2, y, { align: "center" });

      y += 50;
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      doc.text(`São Paulo, ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, y, { align: "center" });
  };

  generateCover();

  // --- 2. PREPARE TOC PAGE ---
  doc.addPage();
  const tocPageNumber = doc.getNumberOfPages(); // Should be 2
  // We will come back to this page later

  // --- 3. CONTENT INITIALIZATION ---
  doc.addPage(); // Page 3 starts content
  let cursorY = marginTop;

  // --- Helper Functions ---

  const addText = (text: string, fontSize = 12, fontStyle = 'normal', align: 'left' | 'center' | 'justify' = 'left') => {
    // Clean HTML if it looks like HTML (Rich Text fields)
    const cleanText = (text && (text.includes('<p>') || text.includes('<br>'))) ? cleanHtml(text) : text;
    if (!cleanText) return;

    doc.setFont("times", fontStyle);
    doc.setFontSize(fontSize);
    
    const lineHeight = fontSize * 0.5;
    
    // Split text into lines that fit the content width
    const lines = doc.splitTextToSize(cleanText, contentWidth);

    // Iterate through lines to handle page breaks inside paragraphs
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if we need a new page
        if (cursorY > pageHeight - marginBottom) {
            doc.addPage();
            cursorY = marginTop;
        }

        // Print the line
        if (align === 'center') {
             doc.text(line, pageWidth / 2, cursorY, { align: 'center' });
        } else if (align === 'justify') {
             doc.text(line, marginLeft, cursorY, { align: 'justify', maxWidth: contentWidth });
        } else {
             doc.text(line, marginLeft, cursorY);
        }

        cursorY += lineHeight;
    }
    
    // Add spacing after paragraph
    cursorY += 2; 
  };

  const addHeading = (text: string) => {
    cursorY += 5;
    if (cursorY > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
    
    // Add to TOC
    tocItems.push({ title: text, page: doc.getNumberOfPages() });

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(text.toUpperCase(), marginLeft, cursorY);
    cursorY += 10;
  };

  const addSubHeading = (text: string) => {
    if (cursorY > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
    
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(text.toUpperCase(), marginLeft, cursorY);
    cursorY += 8;
  };

  const addHeader = (pageNum: number) => {
    // Logo
    if (data.logoUrl) {
        try {
            doc.addImage(data.logoUrl, 'JPEG', marginLeft, 10, 25, 25);
        } catch (e) {
            console.warn("Could not add logo", e);
        }
    }

    // Header Text
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("GOVERNO DO ESTADO DE SÃO PAULO | SECRETARIA DA JUSTIÇA E CIDADANIA", 50, 15);
    
    doc.setFont("times", "normal");
    doc.text("Instituto de Medicina Social e de Criminologia de São Paulo – IMESC", 50, 20);
    doc.setFontSize(9);
    doc.text("Rua Barra Funda, 824 – São Paulo / SP – CEP: 01152-000", 50, 25);
    
    // Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(50, 27, pageWidth - marginRight, 27);
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15;

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(data.peritoName || "", marginLeft, footerY - 5);
    doc.setFont("times", "normal");
    doc.text(`CRM: ${data.peritoCrm || ""}`, marginLeft, footerY);

    doc.setFont("times", "bold");
    doc.text(`PASTA IMESC: ${data.folderNumber || "S/N"}`, pageWidth - marginRight, footerY - 5, { align: "right" });
    
    doc.setFont("times", "normal");
    doc.text(`${pageNum}`, pageWidth - marginRight, footerY, { align: "right" });
  };

  // --- CONTENT GENERATION ---

  // 1. Preâmbulo
  addHeading("1. PREÂMBULO");
  addSubHeading("1.1. DADOS DO PROCESSO");

  // Table using autoTable
  autoTable(doc, {
    startY: cursorY,
    head: [],
    body: [
      [{ content: 'Autoridade requisitante', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.autoridade],
      [{ content: 'Número do processo', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.numero],
      [{ content: 'Natureza da ação', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.natureza],
      [{ content: 'Registro IMESC', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.registroImesc],
      [{ content: 'Data da perícia', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.dataPericia],
      // Requerente Header
      [{ content: 'Dados do Requerente', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center', fillColor: [204, 204, 204] } }],
      [{ content: 'Nome', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.requerente.nome],
      [{ content: 'Data de Nascimento', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.requerente.nascimento],
      [{ content: 'RG', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.requerente.rg],
      [{ content: 'CPF', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.requerente.cpf],
      [{ content: 'Endereço', styles: { fontStyle: 'bold', fillColor: [225, 236, 246] } }, data.processo.requerente.endereco],
      [{ content: 'Requerido', styles: { fontStyle: 'bold', fillColor: [204, 204, 204] } }, data.processo.requerido],
    ],
    theme: 'grid',
    styles: { font: 'times', fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60 } },
    margin: { left: marginLeft, right: marginRight },
  });

  // Update cursor after table
  cursorY = (doc as any).lastAutoTable.finalY + 10;

  addSubHeading("1.2. DADOS DO PERITO");
  addText(data.peritoIntro, 12, "normal", "justify");

  addSubHeading("1.3. RESUMO DA EXORDIAL");
  addText(data.resumoExordial, 12, "normal", "justify");

  addSubHeading("1.4. RESUMO DA CONTESTAÇÃO");
  addText(data.resumoContestacao, 12, "normal", "justify");

  addSubHeading("1.5. DESPACHO SANEADOR");
  addText(data.despachoSaneador, 12, "normal", "justify");

  // 2. Historico
  addHeading("2. HISTÓRICO");
  addSubHeading("2.1. CONTEXTO PERICIAL");
  addText(data.historico.contexto || "Sem dados.", 12, "normal", "justify");
  addSubHeading("2.2. ANAMNESE MÉDICO PERICIAL");
  addText(data.historico.anamnese || "Sem dados.", 12, "normal", "justify");
  addSubHeading("2.3. ANTECEDENTES PESSOAIS");
  addText(data.historico.antecedentesPessoais || "Sem dados.", 12, "normal", "justify");
  addSubHeading("2.4. ANTECEDENTES FAMILIARES");
  addText(data.historico.antecedentesFamiliares || "Sem dados.", 12, "normal", "justify");
  addSubHeading("2.5. ANTECEDENTES SOCIOEDUCACIONAIS");
  addText(data.historico.antecedentesSocio || "Sem dados.", 12, "normal", "justify");
  addSubHeading("2.6. DOCUMENTOS MÉDICO LEGAIS");
  addText(data.historico.documentosLegais || "Vide anexo.", 12, "normal", "justify");

  // 3. Descrição
  addHeading("3. DESCRIÇÃO");
  addSubHeading("3.1. EXAME FÍSICO GERAL");
  addText(data.exameFisicoGeral, 12, "normal", "justify");
  addSubHeading("3.2. EXAME FÍSICO ESPECÍFICO");
  addText(data.exameFisicoEspecifico, 12, "normal", "justify");

  // 4. Discussão
  addHeading("4. DISCUSSÃO");
  addSubHeading("4.1. MÉTODO E TÉCNICA");
  addText(data.metodoTecnica, 12, "normal", "justify");
  addSubHeading("4.2. LITERATURA MÉDICA");
  addText(data.literatura, 12, "normal", "justify");
  addSubHeading("4.3. CONTEXTUALIZAÇÃO DA PERICIADA");
  addText(data.contextualizacao, 12, "normal", "justify");

  // 5. Conclusões
  addHeading("5. CONCLUSÕES");
  addText(data.conclusao, 12, "normal", "justify");

  // 6. Quesitos
  addHeading("6. RESPOSTA AOS QUESITOS");

  const printQuesitos = (title: string, quesitos: any[]) => {
    addSubHeading(title);
    if (quesitos.length === 0) {
        addText("Sem quesitos.", 12, "italic");
        return;
    }
    quesitos.forEach((q, i) => {
        // We do a rough check for title, but we rely on addText to split the body if needed
        // Just checking if we are at the very bottom before starting a question block
        if (cursorY > pageHeight - marginBottom - 15) {
            doc.addPage();
            cursorY = marginTop;
        }
        
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        
        // Print Question
        const qText = `${i + 1}. ${q.question}`;
        const qLines = doc.splitTextToSize(qText, contentWidth);
        for(let line of qLines) {
             if (cursorY > pageHeight - marginBottom) { doc.addPage(); cursorY = marginTop; }
             doc.text(line, marginLeft, cursorY);
             cursorY += 5;
        }
        cursorY += 2;

        doc.setFont("times", "normal");
        // Print Answer using addText logic manually to ensure splitting
        const aText = `R: ${q.answer}`;
        const aLines = doc.splitTextToSize(aText, contentWidth);
        for(let line of aLines) {
             if (cursorY > pageHeight - marginBottom) { doc.addPage(); cursorY = marginTop; }
             doc.text(line, marginLeft, cursorY);
             cursorY += 5;
        }
        cursorY += 5; // Spacing between items
    });
  };

  printQuesitos("6.1. QUESITOS DO JUÍZO", data.quesitosJuizo);
  printQuesitos("6.2. QUESITOS DO REQUERENTE", data.quesitosRequerente);
  printQuesitos("6.3. QUESITOS DO REQUERIDO", data.quesitosRequerido);

  // 7. Encerramento
  addHeading("7. ENCERRAMENTO");
  addText("O conteúdo deste trabalho espelha o presente entendimento deste perito sobre a matéria em litígio, sendo fundamentado nas informações disponibilizadas e no conhecimento científico à época dos fatos.", 12, "normal", "justify");
  addText("Este laudo, tal como se apresenta, está protegido pela legislação vigente de direito autoral e qualquer reprodução parcial ou total deve respeitar as normas científicas.", 12, "normal", "justify");

  cursorY += 20;
  // Signatures
  // Check if enough space for signature block (approx 40mm)
  if (cursorY > pageHeight - marginBottom - 40) {
      doc.addPage();
      cursorY = marginTop + 30;
  }

  addText(`São Paulo, ${new Date().toLocaleDateString('pt-BR')}`, 12, "normal", "center");
  cursorY += 15;
  
  doc.setFont("times", "bold");
  doc.text(data.peritoName || "Assinatura do Perito", pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;
  doc.setFont("times", "normal");
  doc.text(`CRM: ${data.peritoCrm || "-"}`, pageWidth / 2, cursorY, { align: 'center' });

  // 8. References (from template logic)
  addHeading("8. REFERÊNCIAS BIBLIOGRÁFICAS");
  addText(data.literatura, 12, "normal", "justify");

  // --- 4. FILL TABLE OF CONTENTS ---
  doc.setPage(tocPageNumber);
  
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("ÍNDICE", pageWidth / 2, 40, { align: "center" });
  
  let tocY = 60;
  doc.setFont("times", "normal");
  doc.setFontSize(12);

  tocItems.forEach(item => {
      doc.text(item.title, marginLeft, tocY);
      const pageStr = item.page.toString();
      doc.text(pageStr, pageWidth - marginRight, tocY, { align: "right" });
      
      // Dotted leader
      const titleWidth = doc.getTextWidth(item.title);
      const pageNumWidth = doc.getTextWidth(pageStr);
      const startDot = marginLeft + titleWidth + 2;
      const endDot = pageWidth - marginRight - pageNumWidth - 2;
      
      if (endDot > startDot) {
          const dotChar = ".";
          const dotWidth = doc.getTextWidth(dotChar);
          const numDots = Math.floor((endDot - startDot) / dotWidth);
          doc.text(dotChar.repeat(numDots), startDot, tocY);
      }

      tocY += 10;
  });

  // --- 5. POST PROCESSING: HEADERS & FOOTERS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    // Skip Header/Footer on Cover Page (1)
    if (i === 1) continue; 
    
    doc.setPage(i);
    addHeader(i);
    addFooter(i, totalPages);
  }

  return doc;
}

export const generatePdf = (data: ReportData) => {
  const doc = createPdfDocument(data);
  doc.save(`Laudo_IMESC_${data.folderNumber.replace(/[^a-zA-Z0-9]/g, '_') || 'Draft'}.pdf`);
};

export const generatePdfPreviewUrl = (data: ReportData): string => {
    const doc = createPdfDocument(data);
    // Use datauristring instead of bloburl to avoid iframe loading issues/race conditions
    return doc.output('datauristring');
}
