# Private AI Chatbot

A completely local AI chatbot application that runs on your machine with full privacy. No external API calls, no data collection, and no cloud dependencies.

## Team Quotes

"The best way to predict the future is to invent it." — Alan Kay  
Added by Josue Neiculeo  

"Code is like humor. When you have to explain it, it’s bad." — Cory House
Added by Critobal Baeriswyl 

## Features

-  **Complete Privacy**: All processing happens locally on your machine
-  **Local AI Model**: Uses distilgpt2 from Hugging Face Transformers
-  **Optional Chat History**: Save conversations locally in SQLite database
-  **Data Control**: Erase all saved data with one click
-  **Modern UI**: Clean, responsive interface built with React and TailwindCSS
-  **Real-time Chat**: Instant responses with loading indicators
-  **Easy Setup**: Simple installation and run process

## Technology Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- Framer Motion for animations
- Shadcn/ui components
- Axios for API communication

### Backend
- Python 3.8+
- Flask web framework
- Hugging Face Transformers (distilgpt2)
- SQLAlchemy with SQLite
- CORS enabled for frontend communication

## Project Structure

```
private-ai-chatbot/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── ...
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # Flask backend application
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── requirements.txt    # Python dependencies
│   └── chatbot.db          # SQLite database (created automatically)
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js 16+ and pnpm
- Python 3.8+
- Git

### 1. Clone and Setup Frontend

The frontend is already set up in the current directory. Install dependencies:

```bash
# Install frontend dependencies
pnpm install
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. First-Time Model Download

The first time you run the backend, it will automatically download the distilgpt2 model from Hugging Face (approximately 500MB). This only happens once.

## Running the Application

### 1. Start the Backend Server

```bash
# Make sure you're in the backend directory and virtual environment is activated
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

**Note**: The first startup may take a few minutes as it downloads the AI model.

### 2. Start the Frontend Development Server

In a new terminal:

```bash
# Make sure you're in the frontend directory
pnpm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Open Your Browser

Navigate to `http://localhost:5173` to use the chatbot.

## Usage Guide

### Basic Chat
1. Type your message in the input field at the bottom
2. Press Enter or click the Send button
3. Wait for the AI to generate a response
4. Continue the conversation

### Settings
- **Save Chat History**: Toggle this to save conversations in the local database
- **Erase All Data**: Permanently delete all saved chat history

### Privacy Features
- All AI processing happens locally on your machine
- No internet connection required after initial model download
- Chat history is stored locally in SQLite database
- No data is sent to external servers

## API Endpoints

The backend provides the following REST API endpoints:

- `POST /chat` - Send a message and get AI response
- `GET /history` - Retrieve chat history
- `POST /erase` - Delete all chat data
- `GET /health` - Health check

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError" when starting backend:**
```bash
# Make sure virtual environment is activated and dependencies are installed
pip install -r requirements.txt
```

**"Model download fails":**
- Ensure you have internet connection for first-time setup
- Check available disk space (need ~1GB for model and dependencies)

**"Port 5000 already in use":**
```bash
# Find and kill the process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:5000 | xargs kill -9
```
## Team Quotes

"The best way to predict the future is to invent it." — Alan Kay
Added by Josue Neiculeo

### Frontend Issues

**"Backend server is not running" message:**
- Ensure the Flask backend is running on port 5000
- Check that CORS is properly configured
- Verify the API base URL in `src/services/api.ts`

**Build or dependency issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
pnpm install
```

## Development

### Adding New Features

1. **Backend**: Add new routes in `app.py` and models in `models.py`
2. **Frontend**: Create new components in `src/components/` and update API service

### Environment Variables

Create a `.env` file in the backend directory for configuration:

```env
FLASK_ENV=development
DATABASE_URL=sqlite:///chatbot.db
MODEL_NAME=distilgpt2
```

## Security Considerations

- Input sanitization is implemented using bleach
- SQL injection protection via SQLAlchemy ORM
- CORS configured for specific origins only
- No external network calls after model download
- Local SQLite database with no remote access

## Performance Notes

- **First Response**: May take 10-30 seconds as the model loads into memory
- **Subsequent Responses**: Typically 2-5 seconds depending on hardware
- **Memory Usage**: Approximately 1-2GB RAM when model is loaded
- **Storage**: ~500MB for model files, minimal for chat history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Ensure all dependencies are properly installed
3. Verify both frontend and backend are running
4. Check browser console and terminal logs for error messages

## Acknowledgments

- Hugging Face for the Transformers library and distilgpt2 model
- OpenAI for inspiration in conversational AI
- The React and Flask communities for excellent documentation