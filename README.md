 Private AI Chatbot

A completely local AI chatbot that runs directly on your computer — no cloud, no data sharing, no external APIs.
All your conversations stay private and secure.

This project demonstrates how modern open-source AI models like Llama 3 can be used locally to create a functional, privacy-focused assistant for learning and productivity.

 Features

 Complete Privacy: 100% local processing — no internet connection required after setup.

 Local AI Model: Runs Llama 3 using Ollama or LM Studio instead of cloud APIs.

 Interactive Chat: Real-time, natural language responses.

 Optional Chat History: Save and review past conversations in SQLite.

 Data Control: Erase all saved data instantly.

 Modern Interface: Built with React + TailwindCSS for a clean, responsive UI.

 Customizable Modes: Switch AI behaviors like “General Assistant,” “Study Helper,” or “Coding Support.”

 Technology Stack
Frontend

React 18 + TypeScript

TailwindCSS for styling

Framer Motion for animations

shadcn/ui components

Axios for API communication

Backend

Python 3.8+ with Flask

Ollama or LM Studio for local AI inference

SQLAlchemy + SQLite for persistent chat history

CORS enabled for frontend communication

Bleach for input sanitization

📁 Project Structure
private-ai-chatbot/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Chat and settings pages
│   │   ├── services/        # API connection logic
│   │   └── ...
│   └── package.json
├── backend/                  # Flask backend
│   ├── app.py               # Main server (Llama/Ollama integration)
│   ├── models.py            # SQLite database models
│   ├── requirements.txt
│   └── chatbot.db
└── README.md

⚙️ Installation & Setup
🧾 Prerequisites

Node.js 16+ and pnpm

Python 3.8+

Ollama or LM Studio installed

Git

1. Clone and Setup Frontend
pnpm install

2. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate  # (Windows)
# or source venv/bin/activate (macOS/Linux)
pip install -r requirements.txt

3. Start Ollama or LM Studio

Run your local AI model (e.g., Llama 3):

ollama run llama3


Or launch the model in LM Studio, ensuring it listens locally (default: http://localhost:1234).

4. Start the Backend Server
cd backend
python app.py


Backend will run on http://localhost:5000

5. Start the Frontend
cd frontend
pnpm run dev


Then open http://localhost:5173
 in your browser.

 Usage Guide

Type your message and press Enter

Wait for your local Llama model to respond

Switch between modes for different assistant behaviors

Manage your chat history in settings

 Privacy & Security

All AI processing happens locally

No API keys or external servers

Local SQLite database only

Data can be erased instantly

 Development & Contributions

To add new features:

Backend → Add routes in app.py

Frontend → Add components in src/components/

Environment Variables (.env in backend):

FLASK_ENV=development
DATABASE_URL=sqlite:///chatbot.db
MODEL_PROVIDER=ollama
MODEL_NAME=llama3

 Troubleshooting

Backend not found error:
→ Ensure Flask backend is running on port 5000.

Model not responding:
→ Confirm that Ollama or LM Studio is running with the correct model.

Port already in use:
→ Stop other running instances or change the port in app.py.

💬 Team Quotes

“The best way to predict the future is to invent it.” — Alan Kay
Added by Josue Neiculeo



 License

This project is open source and available under the MIT License.

 Acknowledgments

Hugging Face for Transformers

Meta for the Llama 3 model

React and Flask communities for excellent documentation

Ollama and LM Studio for making local AI accessible