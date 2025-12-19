# DeepR Council Frontend

React + Vite frontend for the Deep Research Council application.

## Features

- **Council Research**: Submit research questions and get comprehensive answers from multiple AI models
- **Real-time Updates**: See results stream in as each stage completes
- **3-Stage Process**:
  1. Individual model responses
  2. Peer rankings and evaluations
  3. Final synthesized answer from chairman model
- **Dark Theme UI**: Modern, clean interface matching the design specifications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Backend Integration

The frontend expects the backend to be running on `http://localhost:8000`. Make sure the backend is started before using the frontend.

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Layout and navigation components
│   └── Council/         # Council research components
├── services/
│   └── api.js          # API service with SSE support
└── utils/
    └── constants.js    # Constants and configuration
```

## Technologies

- React 19
- Vite 7
- React Router DOM
- React Markdown
- Tailwind CSS
