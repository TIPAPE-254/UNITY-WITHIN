import React from 'react';
import { FcGoogle } from "react-icons/fc";

interface GoogleButtonProps {
    onClick?: () => void;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="
        w-full flex items-center justify-center gap-3 
        bg-white border border-gray-300 
        rounded-xl py-3 px-4 
        shadow-sm hover:shadow-md 
        transition-all duration-200 
        text-black font-medium
      "
        >
            <FcGoogle size={24} />
            Continue with Google
        </button>
    );
};
