import React from 'react';

const FAQ: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6 text-unity-600">Frequently Asked Questions</h1>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">How can I practice self-acceptance?</h2>
      <p className="text-gray-700">Self-acceptance starts with acknowledging your feelings without judgment. Unity Within offers journaling, peer support, and guided exercises to help you on this journey.</p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Is my information private?</h2>
      <p className="text-gray-700">Yes. Your privacy is our top priority. All conversations and journals are encrypted and anonymous.</p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">How do I join a support group?</h2>
      <p className="text-gray-700">Navigate to the Community Circles section and select a group that fits your needs. You can join anonymously and leave at any time.</p>
    </section>
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Is Unity Within free?</h2>
      <p className="text-gray-700">Yes, Unity Within is completely free for all users.</p>
    </section>
  </main>
);

export default FAQ;
