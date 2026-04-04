import * as pdfjsLib from 'pdfjs-dist';

function readTextFromItems(items) {
  return items
    .map((item) => (typeof item?.str === 'string' ? item.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = readTextFromItems(textContent.items);
    if (pageText) {
      fullText += `${pageText}\n\n`;
    }
  }

  const normalized = fullText.trim();

  if (!normalized) {
    throw new Error('This PDF did not contain readable text. Try a text-based PDF instead of a scanned image.');
  }

  return normalized;
}
