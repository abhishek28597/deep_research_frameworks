# AI Council

A multi-model LLM orchestration system that uses a "council" approach to generate high-quality responses through collaborative deliberation among multiple AI models.

## Overview

AI Council implements a 3-stage deliberation process where multiple LLM models work together to provide comprehensive answers:

1. **Stage 1**: Each council member provides an individual response
2. **Stage 2**: Each model ranks all responses (anonymized) to identify the best answers
3. **Stage 3**: A chairman model synthesizes the top-ranked responses into a final answer

This approach leverages the collective intelligence of multiple models to produce more reliable and well-rounded responses.

## Features

- 🤖 **Multi-Model Collaboration**: Uses multiple Groq models working in parallel
- 📊 **3-Stage Deliberation Process**: Structured approach to response generation
- 🎯 **Ranking System**: Models evaluate and rank each other's responses
- 🧠 **Chairman Synthesis**: Final model synthesizes top responses
- 💬 **Conversation Management**: Persistent conversation history with mode-based organization
- 🗂️ **Mode-Based Organization**: Conversations organized by mode (Council, Super Chat, DxO, etc.)
- 🗑️ **Delete Conversations**: Remove conversations you no longer need
- 📥 **Export Conversations**: Download conversations as formatted text files
- 🔍 **Mode Filtering**: Filter conversation history by specific mode
- 🚀 **Real-time Streaming**: Server-Sent Events for live response updates
- 🐳 **Docker Support**: Containerized deployment option
- ⚡ **Fast Development**: Hot reload for both frontend and backend

## Architecture

### Council Process

```
User Query
    ↓
┌─────────────────────────────────────┐
│  Stage 1: Individual Responses      │
│  - Model A → Response A             │
│  - Model B → Response B             │
│  - Model C → Response C             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Stage 2: Ranking & Evaluation     │
│  - Each model ranks all responses   │
│  - Aggregate rankings calculated    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Stage 3: Chairman Synthesis        │
│  - Top responses identified          │
│  - Final synthesized answer         │
└─────────────────────────────────────┘
    ↓
Final Response
```

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 20+** and **npm** (for frontend)
- **Groq API Key** (get one at [console.groq.com](https://console.groq.com))
- **Docker & Docker Compose** (optional, for containerized deployment)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### API Key Setup

The Groq API key is configured in `backend/config.py`. You can either:

1. **Keep it in config.py** (default - already set):
```python
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-api-key-here")
```

2. **Use environment variable** (optional):
```bash
export GROQ_API_KEY="your-api-key-here"
```

### Council Models

Default council members are configured in `backend/config.py`:
- `openai/gpt-oss-20b`
- `llama-3.1-8b-instant`
- `moonshotai/kimi-k2-instruct-0905`

Chairman model: `openai/gpt-oss-120b`

You can modify these in `backend/config.py` to use different models.

## Running the Application

### Option 1: Using Startup Script (Recommended for Development)

From the project root:

```bash
./startup.sh
```

This will:
- Start the backend server on `http://localhost:8000`
- Start the frontend dev server on `http://localhost:5173`
- Enable hot reload for both services

### Option 2: Manual Start

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Option 3: Docker Deployment

1. **Start with Docker Compose:**
```bash
./docker-startup.sh
```

Or manually:
```bash
docker-compose up --build
```

2. **View logs:**
```bash
docker-compose logs -f
```

3. **Stop services:**
```bash
docker-compose down
```

The Docker setup includes:
- Automatic container building
- Volume mounting for data persistence
- Hot reload for development
- Network isolation between services

## API Documentation

### Base URL
- Local: `http://localhost:8000`
- Docker: `http://localhost:8000`

### Endpoints

#### Health Check
```
GET /
```
Returns service status.

#### List Conversations
```
GET /api/conversations?mode={mode}
```
Returns metadata for all conversations. Optionally filter by mode using the `mode` query parameter.

**Query Parameters:**
- `mode` (optional): Filter conversations by mode (e.g., "Council", "Super Chat", "DxO")

#### Create Conversation
```
POST /api/conversations
Body: { "mode": "Council" }
```
Creates a new conversation and returns conversation object. The `mode` field specifies the conversation type (defaults to "Council" if not provided).

#### Get Conversation
```
GET /api/conversations/{conversation_id}
```
Returns full conversation with all messages.

#### Send Message (Streaming)
```
POST /api/conversations/{conversation_id}/message/stream
Body: { "content": "Your question here" }
```
Sends a message and streams the 3-stage council response via Server-Sent Events.

#### Send Message (Non-streaming)
```
POST /api/conversations/{conversation_id}/message
Body: { "content": "Your question here" }
```
Sends a message and returns the complete response when finished.

#### Delete Conversation
```
DELETE /api/conversations/{conversation_id}
```
Deletes a conversation permanently. Returns success status.

#### Export Conversation
```
GET /api/conversations/{conversation_id}/export
```
Exports a conversation as a formatted text file. The file includes:
- Conversation metadata (title, mode, creation date)
- All user messages
- All assistant responses with complete Stage 1, 2, and 3 details
- Aggregate rankings

## Project Structure

```
ai_council/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── council.py           # 3-stage council logic
│   ├── config.py            # Configuration (API keys, models)
│   ├── storage.py           # Conversation storage
│   ├── groq_client.py       # Groq API client
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend container config
│   ├── data/
│   │   └── conversations/   # Stored conversations
│   └── venv/                # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service
│   │   └── utils/           # Utilities
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   └── Dockerfile           # Frontend container config
├── data/
│   └── conversations/       # Shared conversation storage
├── docker-compose.yml       # Docker orchestration
├── startup.sh              # Development startup script
├── docker-startup.sh       # Docker startup script
└── README.md               # This file
```

## Data Storage

Conversations are stored as JSON files in the `data/conversations/` directory. Each conversation file contains:

- `id`: Unique conversation identifier
- `created_at`: ISO timestamp
- `title`: Conversation title (auto-generated from first message)
- `mode`: Conversation mode/type (e.g., "Council", "Super Chat", "DxO", "Ensemble", "Shoppr")
- `messages`: Array of user and assistant messages
  - User messages: `{ "role": "user", "content": "..." }`
  - Assistant messages: `{ "role": "assistant", "stage1": [...], "stage2": [...], "stage3": {...}, "aggregate_rankings": [...], "label_to_model": {...} }`

The data directory is:
- **Local development**: `./data/conversations/`
- **Docker**: Mounted as volume at `./data:/app/data`

## Conversation Management

### Mode-Based Organization

Conversations are organized by **mode**, allowing you to separate different types of interactions:
- **Council**: Multi-model deliberation (default)
- **Super Chat**: Single-model conversations
- **DxO**: Decision analysis mode
- **Ensemble**: Ensemble analysis mode
- **Shoppr**: Shopping/research mode

### Conversation History

Access conversation history from the navigation bar:
- View all conversations or filter by mode
- Conversations are grouped by mode with visual indicators
- Each conversation shows:
  - Title and creation date
  - Message count
  - Mode badge
  - Export and delete actions

### Exporting Conversations

Export any conversation as a formatted text file:
- Click the export icon (download) on any conversation
- File includes complete conversation with all stages
- Useful for archiving, sharing, or offline review

### Deleting Conversations

Remove conversations you no longer need:
- Click the delete icon (trash) on any conversation
- Confirmation dialog prevents accidental deletion
- Deletion is permanent and cannot be undone

## Development

### Hot Reload

Both development methods support hot reload:
- **Startup script**: Automatic reload on code changes
- **Docker**: Code mounted as volumes for live updates

### Creating Conversations with Different Modes

When creating conversations programmatically, specify the mode:

```javascript
// Frontend example
const conversation = await createConversation('Council');
const superChat = await createConversation('Super Chat');
const dxo = await createConversation('DxO');
```

```python
# Backend example
conversation = storage.create_conversation(conversation_id, mode="Council")
```

### Frontend Environment Variables

The frontend can be configured via environment variables:
- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)

Set in `frontend/.env` or pass to Docker container.

### Backend Environment Variables

- `GROQ_API_KEY`: Groq API key (optional, can be in config.py)
- `DATA_DIR`: Data directory path (default: `data/conversations`)

## Troubleshooting

### Port Already in Use

If ports 8000 or 5173 are already in use:
- **Backend**: Change port in `startup.sh` or `docker-compose.yml`
- **Frontend**: Change port in `frontend/vite.config.js`

### Docker Issues

- **Build fails**: Ensure Docker is running and has sufficient resources
- **Data not persisting**: Check volume mounts in `docker-compose.yml`
- **Services not connecting**: Verify network configuration

### API Key Issues

- Ensure your Groq API key is valid
- Check `backend/config.py` for correct key
- Verify API key has sufficient quota

## License

This project is open source and available for use and modification.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions, please open an issue on the project repository.

