# Peptide Research Assistant

A research-grounded product demo for peptide education, source transparency, and evidence-aware Q&A. The system is designed to behave like a research assistant rather than a generic chatbot: it distinguishes between confirmed evidence, mixed evidence, and unsupported claims, and it stays inside the peptide-research domain.

## What this project does

This demo shows a central research layer that can power multiple front-end surfaces:

- a standalone website
- a Shopify storefront concept
- a WordPress integration concept
- an admin dashboard for research stats and configuration

It is built around a curated peptide research library and a simple intent-routing engine so the assistant can answer in a controlled, transparent way.

## Core behaviors

- research-first answers with citations
- explicit uncertainty handling instead of invented certainty
- domain guardrails for off-topic requests
- refusal of individualized medical dosing or treatment advice
- evidence-aware summaries for human studies, comparisons, and limitations

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Open the demo in a browser:
   ```text
   http://localhost:3000
   ```

## Verify it is working

Run the tests:

```bash
npm test
```

The current test suite validates the core conversation logic, including greeting handling, medical boundaries, evidence limitations, and off-topic domain guardrails. The project is currently passing all 5 core tests.

## Project structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   ├── shopify.html
│   ├── wordpress.html
│   └── styles.css
├── src/
│   ├── researchData.js
│   └── researchEngine.js
├── tests/
│   └── researchEngine.test.js
├── server.js
├── package.json
├── README.md
└── .env.example
```

## API endpoints

- GET /api/health
- GET /api/configuration
- GET /api/sources
- GET /api/sources/:id
- GET /api/admin/stats
- POST /api/chat

## Research model

The demo uses a curated library in [src/researchData.js](src/researchData.js) and a routing engine in [src/researchEngine.js](src/researchEngine.js). The engine classifies user intent before picking a response, which keeps greetings, comparisons, limitations, and off-topic questions separate instead of sending everything through one generic research path.

## Safety and limitations

This project is a demo and not a medical decision support system.

Important limits:

- it is intentionally built around a small curated data set
- it does not provide individualized medical treatment advice
- it should not be treated as a substitute for professional medical judgment
- any production deployment should add stronger auth, rate limiting, and source review controls

## Demo notes

### Shopify
This concept reflects modern storefront integration patterns, including merchant configuration and embedded assistant experiences.

### WordPress
This concept reflects plugin-style integration patterns such as settings, secure API configuration, and content-safe embedding.

## Recommended next steps

- add richer source ingestion and indexing
- improve conversation memory for follow-up questions
- expand the comparison and human-study UI rendering
- add stronger admin controls and production security
- connect the curated layer to a real retrieval or RAG stack when ready
