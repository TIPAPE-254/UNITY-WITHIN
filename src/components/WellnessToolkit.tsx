import React from 'react';

export const WellnessToolkit: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-pink-100">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Wellness Toolkit</h1>
      <p className="text-gray-600 mb-8">Explore 10 evidence-based, gamified tools for self-acceptance, healing, and growth. All tools are trauma-informed, inclusive, and clinically grounded.</p>

      {/* Layer 1: Self-Awareness */}
      <h2 className="text-xl font-bold text-pink-600 mt-8 mb-4">Self-Awareness</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Mood XP & Emotion Leveling */}
        <ToolCard
          icon="🌱"
          title="Mood XP & Emotion Leveling"
          bg="bg-pink-50"
          border="border-pink-100"
          desc="Earn Emotional XP for healthy actions. Watch your Inner Self avatar evolve as you grow emotionally. No punishment for missed days!"
          button="View Progress"
        />
        {/* Adaptive Challenge Engine */}
        <ToolCard
          icon="🎯"
          title="Adaptive Challenge Engine"
          bg="bg-blue-50"
          border="border-blue-100"
          desc="Mood check-ins adjust your daily challenges. Gentle support on hard days, deeper growth when you’re ready. Always user-controlled."
          button="Start Challenge"
        />
        {/* Mood Pattern Insights */}
        <ToolCard
          icon="📊"
          title="Mood Pattern Insights"
          bg="bg-black text-white"
          border="border-black"
          desc="See your emotional patterns and triggers over time. Insights are private, empowering, and never used for comparison."
          button="View Insights"
        />
      </div>

      {/* Layer 2: Active Healing */}
      <h2 className="text-xl font-bold text-pink-600 mt-8 mb-4">Active Healing</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Inner Quest Board */}
        <ToolCard
          icon="🗺️"
          title="Inner Quest Board"
          bg="bg-white"
          border="border-pink-200"
          desc="Navigate a visual healing map with CBT-based quests. Unlock new zones, complete daily quests, and celebrate your journey."
          button="Open Quest Board"
        />
        {/* Gamified Journaling */}
        <ToolCard
          icon="📔"
          title="Gamified Journaling"
          bg="bg-pink-50"
          border="border-pink-100"
          desc="Reflect with AI-powered prompts and themed chapters. Earn XP, unlock milestone letters, and see your growth over time."
          button="Start Journaling"
        />
        {/* AI Coping Companion */}
        <ToolCard
          icon="🤖"
          title="AI Coping Companion"
          bg="bg-black text-white"
          border="border-black"
          desc="Chat with an empathetic AI for CBT/ACT support, grounding, and affirmations. Crisis mode always escalates to human help."
          button="Chat Now"
        />
        {/* Mindfulness Mini-Games */}
        <ToolCard
          icon="🎮"
          title="Mindfulness Mini-Games"
          bg="bg-blue-50"
          border="border-blue-100"
          desc="Short, playful games for breathing, grounding, and self-compassion. All games are accessible and mapped to real techniques."
          button="Play a Game"
        />
      </div>

      {/* Layer 3: Growth & Connection */}
      <h2 className="text-xl font-bold text-pink-600 mt-8 mb-4">Growth & Connection</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Self-Acceptance Streak Tracker */}
        <ToolCard
          icon="🔥"
          title="Self-Acceptance Streak Tracker"
          bg="bg-pink-50"
          border="border-pink-200"
          desc="Build compassionate daily habits with a Grace Day mechanic. Celebrate milestones, never punished for missed days."
          button="Track Streak"
        />
        {/* Non-Competitive Badge System */}
        <ToolCard
          icon="🏅"
          title="Non-Competitive Badge System"
          bg="bg-white"
          border="border-pink-100"
          desc="Earn beautiful badges for personal milestones. Display them in your private Inner Garden—no leaderboards, no comparison."
          button="View Badges"
        />
        {/* Community Wellness Quests */}
        <ToolCard
          icon="🤝"
          title="Community Wellness Quests"
          bg="bg-pink-50"
          border="border-pink-100"
          desc="Join monthly group healing challenges. Progress is collective, anonymous, and always safe. Opt out anytime."
          button="See Community Quests"
        />
        {/* SDT Goal-Setting Framework */}
        <ToolCard
          icon="🎯"
          title="SDT Goal-Setting Framework"
          bg="bg-white"
          border="border-pink-100"
          desc="Set goals for autonomy, competence, and connection. Track progress visually and reflect weekly."
          button="Set Goals"
        />
      </div>
    </div>
  );
};

// ToolCard component for DRYness and consistent style
interface ToolCardProps {
  icon: string;
  title: string;
  desc: string;
  button: string;
  bg: string;
  border: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, desc, button, bg, border }) => (
  <div className={`rounded-2xl ${border} ${bg} p-6 flex flex-col items-start shadow hover:shadow-lg transition`}>
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="font-bold text-lg mb-1">{title}</h3>
    <p className="text-gray-700 mb-3 flex-1">{desc}</p>
    <button className="mt-auto px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300">{button}</button>
  </div>
);
