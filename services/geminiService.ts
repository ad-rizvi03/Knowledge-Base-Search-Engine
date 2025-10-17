import { GoogleGenAI } from "@google/genai";
import { DocumentFile } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

export async function* generateAnswerStream(documents: DocumentFile[], query: string, abortSignal: AbortSignal): AsyncGenerator<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const readableDocuments = documents.filter(doc => doc.readable);

  if (readableDocuments.length === 0) {
    yield "I can't answer without any readable documents. Please upload some supported files (e.g., TXT, PDF, DOCX).";
    return;
  }

  const context = readableDocuments
    .map(doc => `[Document: ${doc.name}]\n${doc.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are an intelligent assistant. Your task is to answer the user's question based ONLY on the provided context from the documents.
Your answer MUST be grounded in the information within the documents.
After providing your answer, you MUST cite the source document(s) you used by adding a line at the very end in the format: "[Source: document_name.ext]".
If you use multiple documents, cite each one on a new line in the same format.
If the answer is not found within the context, you MUST state that you could not find an answer in the provided documents and do not cite any sources.
Do not use any external knowledge. Be concise and accurate.

--- CONTEXT START ---
${context}
--- CONTEXT END ---

Question: "${query}"

Answer:`;

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: prompt,
    });

    for await (const chunk of stream) {
      if (abortSignal.aborted) {
        console.log("Streaming aborted by user.");
        return;
      }
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error generating answer from Gemini:", error);
    if (error instanceof Error) {
      yield `\n\nSorry, an error occurred: ${error.message}`;
    } else {
      yield "\n\nAn unknown error occurred while generating the answer.";
    }
  }
}