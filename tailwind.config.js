/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                unity: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    200: '#fecdd3',
                    300: '#fda4af',
                    400: '#fb7185',
                    500: '#f43f5e', // Primary Pink
                    600: '#e11d48',
                    700: '#be123c',
                    800: '#9f1239',
                    900: '#881337',
                    black: '#18181b', // Soft black
                },
                wellness: {
                    calm: '#e0f2fe',
                    serene: '#dcfce7',
                    gentle: '#fce7f3',
                    tranquil: '#f0e7ff',
                    balance: '#fef3c7',
                },
            },
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
                heading: ['Poppins', 'sans-serif'],
            },
            animation: {
                'breathe': 'breathe 4s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
            },
            keyframes: {
                breathe: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.05)', opacity: '0.95' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'pulse-gentle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
            },
            borderRadius: {
                '3xl': '1.5rem',
            },
        },
    },
    plugins: [],
}
