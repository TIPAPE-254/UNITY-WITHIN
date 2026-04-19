import React, { useMemo, useState } from 'react';
import { Copy, CheckCircle, Sparkles } from 'lucide-react';

export const Education: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(
    () => `Here's a focused, single prompt just for the Learn/Education page — built around everything in your PRD:

Hit **Copy prompt** and paste it straight into Claude Code, Cursor, or v0.

The two things to fill in before pasting are the [REPLACE] placeholders in the TECH NOTES section — your framework and your styling library. Everything else — the course data, the component breakdown, the M-Pesa flow, the filter logic, the drawer behaviour — is already written out and ready to build from.

---

LEARN / EDUCATION PAGE — FULL BUILD PROMPT

Build a Learn/Education page for the Unity Within app using the brand's warm, calming palette and soft UI styling. The page should feel supportive and premium, with light gradients, rounded cards, subtle shadows, and gentle hover states.

Goals
- Make learning feel approachable and calming.
- Provide a structured path with courses and categories.
- Include quick filters and a content drawer.
- Support a paid premium course flow with M-Pesa.

Page Sections
1. Hero
- Title: "Learn to care for your mind"
- Subtitle: "Short, warm lessons on mental health, self-acceptance, and healing."
- CTA: "Start learning" (primary), "Browse all courses" (secondary)

2. Quick Filters
- Pills for: Anxiety, Self-love, Stress, Relationships, Career, Sleep
- Active pill uses bold highlight

3. Course Grid (cards)
- 6 cards in a responsive grid
- Each card: title, category tag, time to complete, short description, "Open" button
- Use Unity Within styling (rounded, soft gradients)

Course Data (use exactly)
1. Understanding Anxiety — Education — 3 min read
2. The Art of Self-Love — Self-Growth — 5 min read
3. Setting Healthy Boundaries — Relationships — 4 min read
4. Imposter Syndrome — Career & Self — 4 min read
5. Reset Your Nervous System — Wellness — 6 min read
6. Break the Overthinking Loop — Mindset — 5 min read

4. Premium Course Section
- Highlight card: "Unity Within Masterclass"
- Description: "A structured 4-week program with guided lessons, exercises, and mentor support."
- Price: "KES 1,500"
- CTA: "Unlock with M-Pesa"
- Include 3 bullet benefits

5. Learning Drawer (slide-over)
When user clicks a course card:
- Open a right-side drawer
- Show course title, category, duration
- Show key points (3 bullets)
- "Start lesson" button
- "Save for later" secondary button

6. M-Pesa Flow (modal)
When user clicks "Unlock with M-Pesa":
- Modal with phone input, amount, pay button
- Message: "Enter your M-Pesa number to receive the payment prompt."
- Simulate success state: "Payment received. Unlocking your course..."

Tech Notes
- Framework: [REPLACE]
- Styling: [REPLACE]
- Use the same shared layout, fonts, and button styling as the Unity Within app

Design Notes
- Use the Unity Within palette: soft pinks, warm purples, and white backgrounds
- Prefer rounded corners (xl/2xl)
- Light shadows, no harsh borders
- Gentle hover animations
---
` ,
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                <Sparkles size={14} />
                Learn & Education
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
                Education Page Build Prompt
              </h1>
              <p className="text-gray-600 mt-2">
                Use this prompt to generate the Learn page with Unity Within styling.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>

          <div className="mt-8 bg-[#fff7fb] border border-pink-100 rounded-2xl p-6">
            <p className="text-sm text-pink-700 font-semibold mb-3">
              Replace the [REPLACE] placeholders before pasting into Claude Code, Cursor, or v0.
            </p>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
{promptText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
