🧠 Knowledge-base Search Engine using Retrieval-Augmented Generation (RAG)

An intelligent search system that lets you upload multiple documents (PDF, TXT, DOCX) and query them in natural language.
It retrieves the most relevant information using semantic search and generates a context-aware synthesized answer using an LLM (Large Language Model).

🚀 Features

📂 Upload and process multiple document formats (PDF, TXT, DOCX)

🧩 Extract and embed document text into a vector database (FAISS / Chroma)

🔍 Retrieve contextually relevant chunks for user queries

🤖 Generate concise, synthesized answers using RAG (Retrieval-Augmented Generation)

⚡ FastAPI backend with modular architecture

💬 Optional React frontend for a clean and interactive interface

🧰 Tech Stack

Backend:

Python 3.10+

FastAPI

LangChain / LlamaIndex

FAISS or Chroma (Vector Database)

OpenAI API (or local LLM)

Uvicorn

Frontend (Optional):

React.js

Tailwind CSS

Axios for API communication

🧠 System Architecture
                ┌────────────────────────────┐
                │        User Query          │
                └──────────────┬─────────────┘
                               │
                               ▼
                 ┌────────────────────────────┐
                 │      Query Embedding        │
                 └──────────────┬─────────────┘
                               │
                 ┌──────────────▼──────────────┐
                 │    Vector Database (FAISS)  │
                 │   Retrieve relevant chunks  │
                 └──────────────┬──────────────┘
                               │
                 ┌──────────────▼──────────────┐
                 │  LLM (RAG Pipeline)         │
                 │  Synthesizes final answer   │
                 └──────────────┬──────────────┘
                               │
                               ▼
                 ┌────────────────────────────┐
                 │     Display Final Answer    │
                 └────────────────────────────┘

⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/<your-username>/knowledge-base-search-engine.git
cd knowledge-base-search-engine

2️⃣ Set Up Backend
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt

3️⃣ Environment Variables

Create a .env file inside the backend folder and add:

OPENAI_API_KEY=your_api_key_here

4️⃣ Run Backend
uvicorn main:app --reload


Backend will start at:
👉 http://127.0.0.1:8000

5️⃣ (Optional) Run Frontend

If you’re using the React UI:

cd frontend
npm install
npm start

💡 How It Works

Upload your documents via the /upload endpoint or the frontend.

The backend extracts and splits text into chunks.

Embeddings are generated for each chunk and stored in a vector DB.

When a user submits a query, the system finds the most similar chunks.

Retrieved text is passed to an LLM with a prompt:

"Using the provided context, answer the user’s question succinctly and accurately."


The LLM synthesizes and returns the final answer.

🧩 Example API Usage
Upload Documents

POST /upload

curl -X POST "http://127.0.0.1:8000/upload" \
     -F "files=@document.pdf"

Query the Knowledge Base

POST /query

curl -X POST "http://127.0.0.1:8000/query" \
     -H "Content-Type: application/json" \
     -d '{"query": "What is the difference between regression and classification?"}'


Response:

{
  "answer": "Regression predicts continuous values, while classification predicts categorical labels."
}

📁 Project Structure
knowledge-base-search/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── utils/
│   │   ├── extract_text.py
│   │   ├── embed_store.py
│   │   ├── query_engine.py
│   └── models/
│       └── document.py
├── frontend/ (optional)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── README.md
└── demo/
    └── demo_video.mp4

🧾 Example Prompt for LLM
Using the provided documents, answer the user’s question succinctly and accurately.
Context: {retrieved_text}
Question: {user_query}

🧪 Evaluation Criteria

✅ Retrieval Accuracy

✅ Quality of Synthesized Answer

✅ Code Structure & Modularity

✅ Proper LLM Integration

✅ UI/UX (if frontend included)

🌐 Deployment (Optional)

Backend: Render / Railway

Frontend: Vercel / Netlify

Store embeddings in persistent storage if needed

📸 Demo

🎥 Add your demo video or screenshots here
(e.g., demo/demo_video.mp4 or link to YouTube)

🤝 Contributing

Feel free to fork, enhance, or open issues.
Contributions are welcome to improve accuracy, performance, and UI.
