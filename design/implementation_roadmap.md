# UNITY WITHIN: Technical Implementation Roadmap

**Version:** 2.0 (Aligned with World-Changing Master Prompt)
**Role:** Principal Product Architect & Ethical AI Engineer

This document outlines the technical execution plan to transform Unity Within into the emotional support ecosystem described in the Master Prompt.

## 1. Core Platform & Ethics (Foundational)
- [x] **Data Privacy Review**: Audit database schema to ensure strict separation of PII (Identity) and Emotional Data.
- [x] **Safety Layer**: Implement global middleware to detect crisis keywords in *all* user inputs (Journal, Chat, Moods) before processing.
- [x] **Accessibility**: Optimize bundle size and asset loading for low-bandwidth environments (2G/3G areas).

## 2. Feature Enhancements (Immediate)

### A. AI Companion (BUDDIE) - *Priority 1*
- **Current State**: Active & Intelligent.
- **Upgrade**:
    - [x] Integrate Google Gemini 2.0 Flash.
    - [x] System Prompt: Inject "Kenyan Youth/Trauma-Aware" persona.
    - [x] Safety: Force non-clinical responses and crisis escalation protocols.

### B. Mood Tracking
- **Current State**: Enhanced.
- **Upgrade**:
    - [x] Update DB schema for `intensity` (1-10).
    - [x] UI Update: Slider for intensity.
    - [x] Visualization: Switch to soft, flowing charts (Area chart with gradients).

### C. Journaling & Voice
- **Current State**: Voice-enabled.
- **Upgrade**:
    - [x] Implement Web Speech API for Speech-to-Text.
    - [x] Add "Calm Recording" UI visualization.

### D. Anonymous Peer Chat
- **Current State**: Specialized & Dark Mode.
- **Upgrade**:
    - [x] Create specialized rooms (Hustle, Heartbreak, Exam Stress).
    - [x] UI: Dark/Slate theme for intimate safety.
    - [ ] Enforce visual anonymity (Avatar generators, no real names).

## 3. Future Priorities (Next Up)
- [x] **Crisis Resource UI**: Floating "Get Help" button available everywhere.
- [x] **Journal Reflections**: AI-powered reflective questions request button.
- [x] **Community Safety**: AI Moderation for chat messages.
- [x] **Landing Page**: Update value proposition to match "World-Changing" vision.

## 4. Next Steps
- [x] **Data Privacy Review**: Enforce anonymous data fetching for chat APIs.
- [x] **Accessibility**: Optimize image assets and bundle size (Component Lazy Loading).
- [x] **Admin Dashboard**: Visualize flagged messages and crisis reports.

## 5. Self-Therapizing Tools (v3.0 - In Progress)
- [x] **Guided Breathing with Meaning**: Context-aware breathing tools (Stuck, Heavy Heart, Exam).
- [x] **Emotional Check-In Ritual**: Add "What to do next" post-submission flow.
- [x] **Thought Unloading**: Free-write timer in Journal.
- [x] **Name the Feeling**: AI labeling assistant.
- [x] **Story Reframer**: Cognitive Narrative rebuilding tool.
- [x] **Self-Compassion Builder**: Reframe harsh self-talk.
- [x] **Micro-Gratitude**: "One small thing that didn't hurt" dashboard widget.
- [x] **Values & Direction**: Find one tiny step forward.
- [x] **Body Scan**: Internal weather/physical awareness check.
- [x] **Safe Space Builder**: Immersive sensory visualization.

## 6. Legacy / Other
