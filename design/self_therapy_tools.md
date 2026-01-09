# Self-Therapizing Tools: The Unity Within 3.0 Vision

> "The first place people learn how to sit with themselves safely."

This document outlines the implementation plan for the "Self-Therapizing Tools" that empower users to heal, grounded in evidence but designed for scale and safety.

## 1. Emotional Check-In Ritual (Micro-Therapy)
- **Concept**: Name feeling -> Rate intensity -> Choose grounding action.
- **Why**: Emotional naming reduces distress; builds literacy.
- **Tech**: Enhanced `MoodLogger` with "Next Step" suggestions (Breathe, Write, Talk).

## 2. Guided Breathing with Meaning (Nervous System Reset)
- **Concept**: Context-aware breathing, not generic timers.
- **Scenarios**:
    - "Before an exam" (Calm focus)
    - "When your heart feels heavy" (Grief/Sadness)
    - "When you feel stuck" (Anxiety/Overwhelm)
- **Tech**: `Breathe.tsx` component with scenario selection and culturally generic animations (expanding rings).

## 3. Thought Unloading (Cognitive Dump)
- **Concept**: "Write everything. No fixing. Just release."
- **Tech**: `Journal.tsx` "Free Flow" mode. 2-5 min timer. Disable backspace option?

## 4. "Name the Feeling" Translator
- **Concept**: User describes -> AI helps label. "I feel tired but angry" -> "Frustrated Exhaustion".
- **Tech**: Dedicated Buddie mode or dedicated widget.

## 5. Self-Compassion Builder
- **Concept**: Rewrite harsh self-talk (CBT principle).
- **Tech**: AI-assisted rewriting tool. "Transform this thought."

## 6. Story Reframing (Meaning-Making)
- **Concept**: 3-step reflection on painful stories.
- **Tech**: Structured Journaling template.

## 7. Safe Anonymous Peer Listening
- **Concept**: Being seen reduces isolation.
- **Tech**: Existing `ChatRoom` with "Listener Guidelines" pinned. AI Moderation (Done).

## 8. Micro-Gratitude
- **Concept**: "Name one small thing that didn't hurt today."
- **Tech**: Evening push notification or Dashboard "Night" card.

## 9. Mood-Triggered Journaling
- **Concept**: Recurring low mood triggers gentle journaling nudge.
- **Tech**: Frontend logic checking `user_moods` history.

## 10. Values & Direction
- **Concept**: Anchoring identity.
- **Tech**: "Profile" or "Wellness" section feature.

---

## 🚀 Implementation Priority (Immediate)
1. **Guided Breathing with Meaning**: Transform generic breathe tool into scenario-based tool.
2. **Emotional Check-In Upgrade**: Add "What to do next" flow to Mood Logger.
3. **Thought Unloading**: Add "Brain Dump" mode to Journal.
