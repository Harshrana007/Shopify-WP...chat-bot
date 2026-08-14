# Architecture

## Product overview

This project demonstrates a single research-grounded AI assistant with three distribution surfaces:

- Standalone website
- Shopify storefront integration
- WordPress plugin integration

Each surface connects to the same central API and the same curated research library.

## High-level flow

Website / Shopify / WordPress
  -> Central API (/api/chat, /api/sources, /api/configuration)
  -> Retrieval layer using curated research sources
  -> AI orchestrator with evidence and safety policies
  -> Response validator and citation system
  -> User answer with source metadata

## Source-of-truth data model

The source library contains sample research records with:

- title
- authors
- year
- journal
- DOI
- PubMed ID
- evidence level
- study type
- peptide/topic
- limitations
- status
- last verified date

This is intentionally a demonstration corpus. It is not a medical claim dataset and should be treated as a product prototype.

## Backend structure

- server.js implements API routes and static file serving
- src/researchData.js defines configuration and sample sources
- src/researchEngine.js handles retrieval, evidence filtering, and safety rules

## Shopify integration concept

A merchant-facing app dashboard can manage:

- assistant name
- storefront placement
- welcome message
- enabled/disabled state
- theme app extension activation path

The demo page represents the app configuration flow and storefront preview without depending on a live Shopify backend.

## WordPress integration concept

The WordPress demo shows:

- plugin activation configuration
- secure API key storage concept
- shortcode and Gutenberg-ready behavior
- frontend widget rendering without exposing secrets

## Deployment notes

- Local demo runs with Node.js + Express
- Environment secrets are kept in .env and never committed
- Production deployment should add request limits, authentication, and tenant isolation

## Limitations

This is a demonstration system and not a live medical decision support tool. The knowledge base is curated and intentionally limited.
