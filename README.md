# Peptide Research Assistant

A research-grounded AI assistant demo focused on peptide research, evidence-based answers, citations, and safe handling of uncertainty.

## Product concept

This project demonstrates one central AI and research layer that powers three surfaces:

1. Standalone website
2. Shopify storefront app demo
3. WordPress plugin demo

The assistant behaves like a research literature assistant rather than a generic chatbot. It uses a controlled source library, anchors answers to evidence, shows uncertainty, and refuses to fabricate unsupported claims.

## Quick start

1. Install dependencies:
   npm install
2. Start the app:
   npm start
3. Open:
   http://localhost:3000

## Environment variables

Copy .env.example to .env and adjust values as needed.

## API

- GET /api/health
- GET /api/configuration
- GET /api/sources
- GET /api/sources/:id
- GET /api/admin/stats
- POST /api/chat

## Research handling

The demo uses a curated source library in src/researchData.js and a small retrieval engine in src/researchEngine.js.

Key behaviors:

- citations are attached to substantive answers
- evidence thresholds are enforced
- individualized medical advice is refused safely
- unsupported claims trigger an insufficient-evidence message
- conflicting or mixed evidence is acknowledged instead of hidden

## Shopify notes

This is a concept demo for a modern Shopify app architecture. It reflects current patterns such as app configuration, theme app extension install flow, and storefront embed concepts.

## WordPress notes

This demo reflects native plugin design principles: capability checks, safe API handling, escaping, sanitization, configuration settings, shortcode support, and a secure backend pattern.

## Security review

This is a demo environment. Production deployment should add:

- authenticated merchant/admin access
- stronger rate limiting
- tenant separation
- real API key management
- logging and abuse protection
- secure storage for private configuration

## Demo limitations

- The research library is intentionally small and curated for demonstration.
- The app is not a clinical decision support system.
- Scientific facts should be independently verified before production use.

## Production recommendations

- Replace sample papers with a verified ingestion pipeline
- Add database-backed storage and indexing
- Add admin review, moderation, and source verification flows
- Add real Shopify and WordPress integration security and auth
- Expand multi-tenant configuration and analytics
