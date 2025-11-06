# Paratranslator

Interactive paragraph translator and language learning tool built with Next.js, React, and TypeScript.

## Features

### 📖 Reading Mode
- **Interactive Sentences**: Click any sentence to see its Vietnamese translation inline
- **Edit Translations**: Modify translations with visual diff comparison
- **Download Edited**: Save your edited translations as a JSON file
- **Search & Highlight**: Full-text search with case-sensitive option (Ctrl+F)
- **File Loading**: Load JSON article files from your computer
- **Copy Functions**: Copy individual sentences or all English text
- **Quiz Integration**: Load quiz files to practice alongside reading

### 🎯 Quiz Practice
- **Multiple Question Types**:
  - Multiple Choice (single/multi-select)
  - True/False/Not Given
  - Short Answer Questions
  - Gap-fill Completion
  - Matching Tasks (headings to paragraphs)
- **Interactive Features**:
  - Instant answer checking
  - Detailed explanations
  - Progress tracking
  - Score statistics
  - Keyboard navigation (arrow keys)

### 🎧 Listening Mode
- Coming soon...

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

### Build for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Quick Deploy with Docker (Recommended)

```bash
./docker-deploy.sh
```

Your site will be live at `https://your-domain.com`

For detailed deployment instructions (Docker, Cloudflare Tunnel, domain setup, etc.), see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## File Formats

### Article Format (`sample-article.json`)

Articles should be JSON files with this structure:

```json
[
  [
    {
      "english": "First sentence of paragraph 1.",
      "vietnamese": "Câu đầu tiên của đoạn 1."
    },
    {
      "english": "Second sentence of paragraph 1.",
      "vietnamese": "Câu thứ hai của đoạn 1."
    }
  ],
  [
    {
      "english": "First sentence of paragraph 2.",
      "vietnamese": "Câu đầu tiên của đoạn 2."
    }
  ]
]
```

### Quiz Format (`sample-quiz.json`)

See `public/sample-quiz.json` for examples of all question types.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Diff Visualization**: diff library

## Project Structure

```
paratranslator/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page with tabs
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── Tabs.tsx
│   ├── ParagraphTranslator.tsx
│   ├── InteractiveParagraph.tsx
│   ├── InteractiveSentence.tsx
│   ├── QuizPractice.tsx
│   └── ListeningMode.tsx
├── lib/
│   ├── types/           # TypeScript type definitions
│   └── data/            # Sample data
└── public/              # Static assets and sample files
    ├── sample-article.json
    └── sample-quiz.json
```

## Development Notes

- Uses browser File API for loading JSON files (no backend required)
- All state managed with React hooks
- Fully responsive design
- Keyboard shortcuts for enhanced productivity

## License

MIT
