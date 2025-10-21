/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens for long-term scalability
        background: {
          DEFAULT: "#FDFCF9",   // Primary background - warm cream
          subtle: "#F8F7F4",    // Lightest cream
          muted: "#F0EDE7",     // Light parchment
          elevated: "#FFFFFF",  // Pure white for cards/modals
        },
        text: {
          DEFAULT: "#413F3D",   // Primary text - charcoal
          subtle: "#6B665A",    // Secondary text - deep taupe
          muted: "#8E8779",     // Tertiary text
          inverted: "#FFFFFF",  // Text on dark backgrounds
        },
        primary: {
          50: "#FDF8E8",        // Lightest gold tint
          100: "#F9EFCD",       // Light gold
          200: "#F3E19B",       // Soft gold
          300: "#E6CE6A",       // Medium gold
          400: "#D4B73A",       // Rich gold
          DEFAULT: "#B8860B",   // Classic dark goldenrod
          600: "#9A7109",       // Deep gold
          700: "#7D5C07",       // Darker gold
          800: "#614806",       // Bronze
          900: "#463404",       // Deep bronze
          hover: "#9A7109",     // Hover state
          foreground: "#FFFFFF" // Text/icons on primary
        },
        secondary: {
          50: "#F4F7ED",        // Lightest green
          100: "#E8F0DA",       // Light olive
          200: "#D1E1B5",       // Soft olive
          300: "#AECA7D",       // Medium olive
          DEFAULT: "#6B8E23",   // Heritage olive green
          600: "#5E7C1F",       // Deep olive
          700: "#4F681A",       // Darker olive
          800: "#3F5215",       // Forest
          900: "#2F3E10",       // Deep forest
          hover: "#5E7C1F",
          foreground: "#FFFFFF"
        },
        neutral: {
          50: "#F8F7F4",        // Lightest cream
          100: "#F0EDE7",       // Light parchment
          200: "#E8E4DC",       // Soft beige
          300: "#D3CEC3",       // Warm gray
          400: "#B5AFA3",       // Taupe
          500: "#8E8779",       // Muted brown
          600: "#6B665A",       // Deep taupe
          700: "#4A453D",       // Almost charcoal
          800: "#2D2A25",       // Rich brown-black
          900: "#1A1816",       // Deepest charcoal
        },
        accent: {
          burgundy: "#6B2C2C",  // Deep wine for premium features
          saddle: "#8B4513",    // Saddle brown
          forest: "#2F4F2F",    // Dark forest green
          cream: "#FFF8DC",     // Cornsilk cream
        },
        // Utility roles (alerts, states, etc.)
        success: {
          DEFAULT: "#6B8E23",   // Use secondary green for success
          light: "#E8F0DA",
          dark: "#4F681A",
        },
        warning: {
          DEFAULT: "#D4A574",   // Muted amber (old money style)
          light: "#F5E6D3",
          dark: "#A67C52",
        },
        danger: {
          DEFAULT: "#9B4444",   // Muted red (not bright)
          light: "#F4E4E4",
          dark: "#7A3636",
        },
        info: {
          DEFAULT: "#5B7C8D",   // Slate blue (muted)
          light: "#E8EEF1",
          dark: "#445C6A",
        },
      },
      fontFamily: {
        serif: ["Lora", "Crimson Pro", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Playfair Display", "Lora", "Georgia", "serif"], // For hero sections
      },
      fontSize: {
        'display': ['4.5rem', { 
          lineHeight: '1.1', 
          letterSpacing: '-0.02em',
          fontWeight: '700'
        }],
        'hero': ['3.5rem', { 
          lineHeight: '1.2', 
          letterSpacing: '-0.01em',
          fontWeight: '600'
        }],
        'subtitle': ['1.75rem', {
          lineHeight: '1.4',
          letterSpacing: '-0.005em',
          fontWeight: '500'
        }],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(65, 63, 61, 0.08)',
        'lifted': '0 4px 25px rgba(65, 63, 61, 0.12)',
        'elegant': '0 10px 40px rgba(65, 63, 61, 0.15)',
        'subtle': '0 1px 8px rgba(65, 63, 61, 0.06)',
        'premium': '0 20px 60px rgba(65, 63, 61, 0.18)',
      },
      borderRadius: {
        'elegant': '0.5rem',  // Slightly rounded, not too modern
        'classic': '0.25rem', // Subtle rounding
      },
      letterSpacing: {
        'relaxed': '0.025em',
        'elegant': '0.05em',  // For uppercase headings
      },
      lineHeight: {
        'relaxed': '1.75',
        'generous': '2',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
}
