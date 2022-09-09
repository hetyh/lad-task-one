import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { readFileSync } from 'fs';

const font = readFileSync('fonts/JetBrainsMono-Regular.ttf', 'base64');

async function pdfCreate(
  sitesWordsArray: {
    siteName: string;
    wordsTop: string[];
  }[],
): Promise<string> {
  try {
    const doc = new jsPDF();
    const date = new Date();
    doc.addFileToVFS('JetBrainsMono-Regular.ttf', font);
    doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono-Regular', 'normal');
    doc.setFont('JetBrainsMono-Regular');

    doc.text('Results', 10, 10);
    doc.setFontSize(13);
    doc.text(date.toLocaleString(), 10, 20);

    let sitesRowArray: Array<Array<string>> = [];

    for (const { siteName, wordsTop } of sitesWordsArray) {
      sitesRowArray.push([siteName, ...wordsTop]);
    }

    autoTable(doc, {
      head: [['URL', 'First word', 'Second word', 'Third word']],
      body: sitesRowArray,
      theme: 'grid',
      bodyStyles: {
        font: 'JetBrainsMono-Regular',
      },
      headStyles: {
        font: 'JetBrainsMono-Regular',
      },
      startY: 30,
    });

    return doc.output('dataurlstring').slice(51);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

export default pdfCreate;
