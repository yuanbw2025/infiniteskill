import * as pdfjs from "pdfjs-dist";
// @ts-ignore
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import ePub from "epubjs";

// Set worker path using Vite's URL import
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return await extractTextFromPdf(file);
    case 'txt':
    case 'md':
    case 'markdown':
      return await extractTextFromTxt(file);
    case 'epub':
      return await extractTextFromEpub(file);
    default:
      throw new Error(`不支持的文件格式: .${extension}。目前支持 PDF, TXT, MD, EPUB。`);
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText;
}

async function extractTextFromTxt(file: File): Promise<string> {
  return await file.text();
}

async function extractTextFromEpub(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  
  await book.ready;
  
  let fullText = "";
  const spine = book.spine;
  
  // @ts-ignore
  for (let i = 0; i < spine.length; i++) {
    // @ts-ignore
    const item = spine.get(i);
    const doc = await item.load(book.load.bind(book));
    const text = doc.textContent || doc.body.textContent || "";
    fullText += text + "\n\n";
  }
  
  return fullText;
}
