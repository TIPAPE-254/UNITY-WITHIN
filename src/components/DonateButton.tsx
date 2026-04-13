import React from 'react';
import { Heart } from 'lucide-react';

interface DonateButtonProps {
    variant?: 'default' | 'compact' | 'banner';
    className?: string;
}

export const DonateButton: React.FC<DonateButtonProps> = ({
    variant = 'default',
    className = ''
}) => {
    const handleDonate = () => {
        window.open('https://www.paypal.com/donate/?hosted_button_id=3M8XSAFB6LAM8', '_blank');
    };

    if (variant === 'compact') {
        return (
            <button
                onClick={handleDonate}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-unity-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium ${className}`}
            >
                <Heart size={16} className="fill-current" />
                <span>Donate</span>
            </button>
        );
    }

    if (variant === 'banner') {
        return (
            <div className={`bg-gradient-to-br from-unity-50 to-pink-50 p-6 rounded-3xl border border-unity-100 ${className}`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-unity-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Heart className="text-white fill-current" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-unity-black">Support Unity Within</h3>
                            <p className="text-sm text-gray-600">Help us continue providing mental health support</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDonate}
                        className="px-6 py-3 bg-gradient-to-r from-unity-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold whitespace-nowrap"
                    >
                        Donate via PayPal
                    </button>
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <button
            onClick={handleDonate}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-unity-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold ${className}`}
        >
            <Heart size={20} className="fill-current" />
            <span>Support Us</span>
        </button>
    );
};
