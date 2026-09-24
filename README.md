# Coastal Karnataka Guide

> An intelligent travel companion for exploring Coastal Karnataka — starting with Mangalore.

---

## What Is This?

Coastal Karnataka Guide is a mobile travel companion that feels like a knowledgeable local walking beside you. It is not a map application or a generic chatbot. It knows where you are, understands the history and culture of what surrounds you, and tells you stories that bring a place to life.

---

## Long-Term Vision

- Detect your location and recognise nearby attractions automatically.
- Narrate engaging, location-aware audio stories as you walk.
- Let you ask questions conversationally about any place you visit.
- Suggest what to see next based on your location, interests, and available time.
- Eventually support camera-based landmark recognition.
- Expand across Coastal Karnataka and beyond.

---

## Initial Focus: Mangalore

The first version of the product is a curated walking experience in **Mangalore (Kudla)**, Karnataka, India. It covers heritage temples, colonial-era landmarks, coastal spots, and local culture.

Planned initial tour stops include:
- Kadri Manjunatha Temple
- St. Aloysius Chapel
- Mangaladevi Temple
- Sultan Battery
- Tannirbhavi Beach

---

## Target Platforms

- **Android**
- **iOS**

---

## Current Status

> **Early development — MVP in progress.**

The project is in its initial setup phase. No application features have been built yet. The architecture and engineering approach are being established before any code is written.

---

## Environment Setup

1. Clone the repository.
2. Copy \.env.example\ to \.env\.
3. Fill in real API keys in \.env\. Never commit \.env\.

---

## Project Principles

- Simple, maintainable architecture over clever engineering.
- Modular design so new cities can be added without changing existing code.
- Secrets and API keys stay out of the repository at all times.
- Every milestone leaves the app in a working, committable state.

---

## Repository Structure (Planned)

\\\
coastal-karnataka-guide/
├── app/          # Mobile application source (React Native / Expo)
├── data/         # Tour content — routes, stops, audio
│   └── mangalore/
├── docs/         # Project documentation
├── tests/        # Unit tests for business logic
├── .env.example  # Environment variable template
└── README.md
\\\

---

## License

To be decided.
