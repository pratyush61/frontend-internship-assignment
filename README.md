# Recall — AI-Powered Study Set Generator

Recall turns a topic or a set of notes into a structured study set using the Gemini API. Instead of returning a chatbot-style conversation, it generates study material that can be reviewed as flashcards and practised with a quiz.

## Project Links

- **Live demo:** https://frontend-internship-assignment-chi.vercel.app/
- **GitHub repository:** https://github.com/pratyush61/frontend-internship-assignment
- **Screen recording:** https://drive.google.com/file/d/1dcKVwqh_c3CGSxGfU5rnZiYL00Ud34Dp/view?usp=sharing

## Features

- Generate a structured study set from a topic or pasted notes.
- Review generated material using interactive flashcards.
- Practise with a quiz and revisit incorrect answers.
- Validate model output before rendering it.
- Show loading, empty, and error states during generation.
- Handle malformed or unexpected model output, empty responses, API failures, and slow requests.
- Cancel an in-progress generation request.
- Prevent stale responses from overwriting newer state.
- Retry generation after an error.
- Shuffle the study set.
- Preserve a draft locally between visits.
- Export study material as Markdown.
- Clear the current study set.
- Use keyboard shortcuts for quiz interactions.
- Provide an error boundary as a fallback for unexpected rendering errors.
- Apply best-effort request rate limiting.
- Responsive interface for desktop and smaller screens.

## Tech Stack

- **React** — user interface
- **JavaScript** — application logic
- **Gemini API** — runtime study-content generation
- **Vercel** — deployment

## Getting Started

### Prerequisites

- Node.js and npm
- A Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/pratyush61/frontend-internship-assignment.git
cd frontend-internship-assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the Gemini API key

Configure the Gemini API key using the environment-variable name expected by the server-side API handler in this repository. For local development, put the key in your local environment configuration.

**Security:** Never commit API keys or other secrets to GitHub. If you use a `.env` file, ensure it is listed in `.gitignore`. Keep the key on the server side; do not expose a private key in client-side code.

### 4. Start the application

```bash
npm start
```

Open the local URL shown in your terminal. Confirm that `npm start` is the correct script in `package.json` for your final version before submitting.

## How It Works

1. The user enters a topic or study notes.
2. The application sends the request to its server-side API handler.
3. The handler calls Gemini to generate structured study content.
4. The response is parsed and validated before being used by the interface.
5. The generated content is displayed as flashcards and quiz questions.
6. The user can review, practise, retry, shuffle, export, or clear the study set.

Recall is designed around structured study content rather than an open-ended chatbot conversation. The application validates model output instead of assuming every API response is usable.

## Error Handling and Reliability

The application is designed to handle common failure cases, including malformed or unexpected model output, empty responses, API failures, slow requests, cancellation, and outdated responses. Loading and error states communicate the current status, while response validation helps prevent invalid data from being rendered as study material.

The study-generation hook supports cancelling an in-progress request. An error boundary provides a fallback for rendering errors that escape normal component-level handling.

## Known Limitations

- AI-generated study content can be incorrect, incomplete, or misleading. Verify important information against trusted sources.
- Streaming generation is not implemented.
- Follow-up refinement of an existing study set is not implemented.
- Session history is limited; this is not a full multi-session study-management system.
- Rate limiting is best-effort and in-memory. In serverless deployments, limits may not be shared across instances and should not be treated as production-grade abuse prevention.
- Very long notes may be rejected by the application's input-length limit.
- Availability and output quality depend on the Gemini API, network conditions, and API configuration.
- Browser and real-device behaviour can vary.

## Testing

Run the following commands from the project directory:

```bash
npm test
npm run build
```

These commands run the test script and production build script defined by the project. Run them against the exact final commit before submission and only report results that you have verified.

## AI Usage Note

I used **Claude and ChatGPT** as development assistants during this project for debugging, code suggestions, UI improvements, and documentation.

During debugging, AI assistance helped me investigate a runtime crash caused by a missing `cancel` handler in the study-generation hook. I also used AI feedback while refining the interface and preparing the project documentation.

I reviewed and applied suggested changes and remain responsible for the final implementation. The study content is generated at runtime using the **Gemini API**.

## Time Spent

Approximately **6–7 hours** across implementation, debugging, UI refinement, testing, and documentation.
