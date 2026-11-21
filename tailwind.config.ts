import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,tsx}"],
  darkMode: "media",
  theme: {
    fontFamily: {
      "roboto-mono": ['"Raleway"', "sans-serif"],
    },
    extend: {
      colors: {
        primary: "rgb(var(--color-primary))",

        bg: {
          base: "rgb(var(--color-bg-base))",
          gradient: {
            from: "rgb(var(--color-bg-gradient-from))",
            via: "rgb(var(--color-bg-gradient-via))",
            to: "rgb(var(--color-bg-gradient-to))",
          },
        },

        surface: {
          DEFAULT: "rgb(var(--color-surface))",
          elevated: "rgb(var(--color-surface-elevated))",
          hover: "rgb(var(--color-surface-hover))",
          input: "rgb(var(--color-surface-input))",
        },

        text: {
          primary: "rgb(var(--color-text-primary))",
          secondary: "rgb(var(--color-text-secondary))",
          muted: "rgb(var(--color-text-muted))",
          subtle: "rgb(var(--color-text-subtle))",
          disabled: "rgb(var(--color-text-disabled))",
        },

        border: {
          DEFAULT: "rgb(var(--color-border-default))",
          light: "rgb(var(--color-border-light))",
          input: "rgb(var(--color-border-input))",
          inputLight: "rgb(var(--color-border-input-light))",
        },

        action: {
          DEFAULT: "rgb(var(--color-action))",
          hover: "rgb(var(--color-action-hover))",
          focus: "rgb(var(--color-action-focus))",
          dark: "rgb(var(--color-action-dark))",
        },

        success: {
          DEFAULT: "rgb(var(--color-success))",
        },

        danger: {
          DEFAULT: "rgb(var(--color-danger))",
          hover: "rgb(var(--color-danger-hover))",
        },

        warning: {
          DEFAULT: "rgb(var(--color-warning))",
          hover: "rgb(var(--color-warning-hover))",
        },

        ring: {
          black: "rgb(var(--color-ring-black))",
          gray: "rgb(var(--color-ring-gray))",
        },
      },
      borderRadius: {
        "var-sm": "var(--radius-sm)",
        "var-md": "var(--radius-md)",
        "var-lg": "var(--radius-lg)",
        "var-xl": "var(--radius-xl)",
        "var-full": "var(--radius-full)",
      },
      boxShadow: {
        "var-md": "var(--shadow-md)",
        "var-lg": "var(--shadow-lg)",
      },
      transitionDuration: {
        "var-fast": "var(--transition-fast)",
        "var-normal": "var(--transition-normal)",
        "var-slow": "var(--transition-slow)",
      },
    },
  },
  plugins: [],
} satisfies Config;
