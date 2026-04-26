import React from 'react';

const Contact: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-6 text-unity-600">Contact Us</h1>
    <p className="text-gray-700 mb-4">Have questions, feedback, or need support? Reach out to us anytime.</p>
    <ul className="text-gray-700 mb-4">
      <li><strong>Email:</strong> <a href="mailto:tipapematayo@gmail.com" className="text-unity-500 underline">support@unitywithin.example.com</a></li>
      <li><strong>Instagram:</strong> <a href="https://www.instagram.com/_unity_within_" className="text-unity-500 underline">@unitywithin</a></li>
      <li><strong>Twitter:</strong> <a href="https://twitter.com/unitywithin" className="text-unity-500 underline">@unitywithin</a></li>
    </ul>
    <p className="text-gray-700">We value your privacy and will respond as soon as possible.</p>
  </main>
);

export default Contact;
