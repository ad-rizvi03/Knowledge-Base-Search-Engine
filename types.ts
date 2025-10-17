export interface DocumentFile {
  name: string;
  content: string;
  type: string;
  readable: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  citations?: string[];
}