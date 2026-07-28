
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, PricingMode, AppSettings } from '../types';
import { storage } from './storageService';

export const pdfService = {
  generateQuotation: (quotation: Quotation) => {
    const doc = new jsPDF();
    const settings = storage.getSettings();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Logo if exists
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 30);
      } catch (e) {
        console.error('Erro ao carregar logo no PDF', e);
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(quotation.status === 'PENDING' ? 'ORÇAMENTO' : 'PEDIDO DE VENDA', 14, settings.logoUrl ? 50 : 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Nº: ${quotation.id}`, 14, settings.logoUrl ? 58 : 30);
    doc.text(`Data: ${new Date(quotation.createdAt).toLocaleDateString()}`, 14, settings.logoUrl ? 63 : 35);

    // Business Info from Settings
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(settings.businessName, pageWidth - 14, 22, { align: 'right' });
    doc.text(settings.address, pageWidth - 14, 27, { align: 'right' });
    doc.text(`${settings.phone} | ${settings.email}`, pageWidth - 14, 32, { align: 'right' });

    // Client Info
    const clientY = settings.logoUrl ? 75 : 45;
    doc.setDrawColor(200);
    doc.line(14, clientY, pageWidth - 14, clientY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, clientY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.customerName.toUpperCase(), 40, clientY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('CONTATO:', 14, clientY + 17);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.customerContact, 40, clientY + 17);

    // Items Table
    const tableData = quotation.items.map((item, index) => {
      let productDetails = item.productName;
      let extras = [];
      if (item.selectedSize) extras.push(`TAM: ${item.selectedSize}`);
      if (item.selectedTheme) extras.push(`TEMA: ${item.selectedTheme}`);
      if (item.productionTime) extras.push(`PRAZO: ${item.productionTime}`);
      
      const extraStr = extras.length > 0 ? `\n(${extras.join(' | ')})` : '';

      return [
        index + 1,
        productDetails + extraStr,
        item.width && item.height ? `${item.width.toFixed(0)}x${item.height.toFixed(0)}cm` : '-',
        item.quantity,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)
      ];
    });

    autoTable(doc, {
      startY: clientY + 30,
      head: [['#', 'Produto / Detalhes', 'Medidas', 'Qtd', 'Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [67, 56, 202] },
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 15 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Payment Section
    doc.setDrawColor(240);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, pageWidth - 28, 40, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DETALHES DO PAGAMENTO', 20, finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    const methodMap = { CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Cartão de Débito', CREDIT: 'Cartão de Crédito' };
    doc.text(`Forma: ${methodMap[quotation.paymentMethod || 'CASH']}`, 20, finalY + 18);
    
    if (quotation.paymentMethod === 'CREDIT' && quotation.installments) {
      doc.text(`Parcelamento: ${quotation.installments}x`, 20, finalY + 25);
    }
    
    if (quotation.paymentOption === 'SPLIT') {
      doc.setFont('helvetica', 'bold');
      doc.text(`CONDIÇÃO: 50% Sinal (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.total / 2)}) + 50% Entrega`, 20, finalY + 32);
    } else {
      doc.text('CONDIÇÃO: Pagamento Integral Antecipado', 20, finalY + 32);
    }

    // Totals Summary on the right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.subtotal)}`, pageWidth - 20, finalY + 10, { align: 'right' });
    if (quotation.shippingValue) doc.text(`Frete: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.shippingValue)}`, pageWidth - 20, finalY + 15, { align: 'right' });
    if (quotation.gatewayFee) doc.text(`Taxas Cartão: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.gatewayFee)}`, pageWidth - 20, finalY + 20, { align: 'right' });

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    const totalText = `VALOR TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.total)}`;
    doc.text(totalText, pageWidth - 14, finalY + 35, { align: 'right' });

    // Footer / Terms
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    const terms = [
      'Validade deste orçamento: 7 dias.',
      'Prazo de entrega: Consultar conforme cada item detalhado na tabela.',
      'A produção inicia somente após a confirmação do pagamento/sinal.'
    ];
    terms.forEach((line, i) => doc.text(line, 14, finalY + 55 + (i * 5)));

    // SOCIAL MEDIA FOOTER
    const socialY = pageHeight - 15;
    doc.setFontSize(7);
    doc.setTextColor(180);
    const socials = [];
    if (settings.socialLinks.instagram) socials.push(`Instagram: ${settings.socialLinks.instagram}`);
    if (settings.socialLinks.facebook) socials.push(`Facebook: ${settings.socialLinks.facebook}`);
    if (settings.socialLinks.website) socials.push(`Site: ${settings.socialLinks.website}`);
    if (settings.socialLinks.tiktokShop) socials.push(`TikTok: ${settings.socialLinks.tiktokShop}`);
    
    const socialStr = socials.join(' | ');
    doc.text(socialStr, pageWidth / 2, socialY, { align: 'center' });

    return doc;
  }
};
