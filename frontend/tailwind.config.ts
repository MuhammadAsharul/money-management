import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)"],
                mono: ["var(--font-geist-mono)"], // Keeping mono if needed, or remove if unused
            },
            colors: {
                background: "rgb(var(--background) / <alpha-value>)",
                foreground: "rgb(var(--foreground) / <alpha-value>)",
                card: "rgb(var(--card) / <alpha-value>)",
                "card-hover": "rgb(var(--card-hover) / <alpha-value>)",
                border: "rgb(var(--border) / <alpha-value>)",
                input: "rgb(var(--input) / <alpha-value>)",
                primary: "rgb(var(--primary) / <alpha-value>)",
                "primary-hover": "rgb(var(--primary-hover) / <alpha-value>)",
                secondary: "rgb(var(--secondary) / <alpha-value>)",
                accent: "rgb(var(--accent) / <alpha-value>)",
                danger: "rgb(var(--danger) / <alpha-value>)",
                warning: "rgb(var(--warning) / <alpha-value>)",
                muted: "rgb(var(--muted) / <alpha-value>)",
            },
        },
    },
    plugins: [],
};
export default config;
