
import React, { useState } from 'react';
import { Phone, X, ShieldAlert } from 'lucide-react';
import { createPortal } from 'react-dom';

export const CrisisResource: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 md:top-6 md:right-8 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-white transition-all z-[60] group animate-pulse hover:animate-none"
                title="Immediate Crisis Help"
                id="crisis-btn"
            >
                <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldAlert className="text-red-500" size={24} />
                                    Immediate Support
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">You matter. Help is available.</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <a
                                href="tel:+254715765561"
                                className="flex items-center gap-4 p-4 rounded-xl bg-unity-50 hover:bg-unity-100 transition-colors border border-unity-100 group"
                            >
                                <div className="bg-white p-2 rounded-full text-unity-600 shadow-sm group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-unity-900">UNITY WITHIN Support</div>
                                    <div className="text-sm text-unity-600">+254 715 765 561</div>
                                </div>
                            </a>

                            <a
                                href="tel:1199"
                                className="flex items-center gap-4 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors border border-red-100 group"
                            >
                                <div className="bg-white p-2 rounded-full text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-red-800">Red Cross Kenya</div>
                                    <div className="text-sm text-red-600">Dial 1199 (Free)</div>
                                </div>
                            </a>

                            <a
                                href="tel:+254722178177"
                                className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 group"
                            >
                                <div className="bg-white p-2 rounded-full text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-blue-800">Befrienders Kenya</div>
                                    <div className="text-sm text-blue-600">+254 722 178 177</div>
                                </div>
                            </a>

                            <a
                                href="tel:999"
                                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 group"
                            >
                                <div className="bg-white p-2 rounded-full text-gray-700 shadow-sm group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">Police / Emergency</div>
                                    <div className="text-sm text-gray-600">Dial 999</div>
                                </div>
                            </a>
                        </div>

                        <p className="text-xs text-center text-gray-400 mt-6">
                            If you are in immediate danger, please go to the nearest hospital.
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
