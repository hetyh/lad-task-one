"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = require("jspdf-autotable");
const fs_1 = require("fs");
const font = (0, fs_1.readFileSync)('fonts/JetBrainsMono-Regular.ttf', 'base64');
async function pdfCreate(sitesWordsArray) {
    try {
        const doc = new jspdf_1.jsPDF();
        const date = new Date();
        doc.addFileToVFS('JetBrainsMono-Regular.ttf', font);
        doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono-Regular', 'normal');
        doc.setFont('JetBrainsMono-Regular');
        doc.text('Results', 10, 10);
        doc.setFontSize(13);
        doc.text(date.toLocaleString(), 10, 20);
        let sitesRowArray = [];
        for (const { siteName, wordsTop } of sitesWordsArray) {
            sitesRowArray.push([siteName, ...wordsTop]);
        }
        (0, jspdf_autotable_1.default)(doc, {
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
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
exports.default = pdfCreate;
