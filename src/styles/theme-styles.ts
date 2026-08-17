interface Rgb {
  r: number;
  g: number;
  b: number;
}
type Rem = number;

interface CssVariables {
  // Background
  bgBase: Rgb;
  bgGradientFrom: Rgb;
  bgGradientVia: Rgb;
  bgGradientTo: Rgb;
  // Surface
  surface: Rgb;
  surfaceElevated: Rgb;
  surfaceHover: Rgb;
  surfaceInput: Rgb;
  // Text
  textPrimary: Rgb;
  textSecondary: Rgb;
  textMuted: Rgb;
  textSubtle: Rgb;
  textDisabled: Rgb;
  // Border
  borderDefault: Rgb;
  borderLight: Rgb;
  borderInput: Rgb;
  borderInputLight: Rgb;
  // Primary
  primary: Rgb;
  // Semantic
  action: Rgb;
  actionHover: Rgb;
  actionFocus: Rgb;
  actionDark: Rgb;
  success: Rgb;
  danger: Rgb;
  dangerHover: Rgb;
  warning: Rgb;
  warningHover: Rgb;
  // Ring
  ringBlack: Rgb;
  ringGray: Rgb;
  // Radius
  radiusSm: Rem;
  radiusMd: Rem;
  radiusLg: Rem;
  radiusXl: Rem;
  radiusFull: Rem;
  // Shadows
  shadowMd: string;
  shadowLg: string;
  // Transitions
  transitionFast: string;
  transitionNormal: string;
  transitionSlow: string;
  // Typography
  fontFamilyUrl: string;
  fontFamily: string;
}

const rgb = ({ r, g, b }: Rgb) => `${r}, ${g}, ${b}`;
const rem = (value: Rem) => `${value}rem`;

export const classicTheme: CssVariables = {
  bgBase: { r: 15, g: 23, b: 42 },
  bgGradientFrom: { r: 51, g: 65, b: 85 },
  bgGradientVia: { r: 30, g: 41, b: 59 },
  bgGradientTo: { r: 17, g: 24, b: 39 },
  surface: { r: 30, g: 41, b: 59 },
  surfaceElevated: { r: 31, g: 41, b: 55 },
  surfaceHover: { r: 51, g: 65, b: 85 },
  surfaceInput: { r: 71, g: 85, b: 105 },
  textPrimary: { r: 255, g: 255, b: 255 },
  textSecondary: { r: 209, g: 213, b: 219 },
  textMuted: { r: 156, g: 163, b: 175 },
  textSubtle: { r: 107, g: 114, b: 128 },
  textDisabled: { r: 75, g: 85, b: 99 },
  borderDefault: { r: 55, g: 65, b: 81 },
  borderLight: { r: 100, g: 116, b: 139 },
  borderInput: { r: 75, g: 85, b: 99 },
  borderInputLight: { r: 209, g: 213, b: 219 },
  primary: { r: 255, g: 137, b: 6 },
  action: { r: 59, g: 130, b: 246 },
  actionHover: { r: 37, g: 99, b: 235 },
  actionFocus: { r: 96, g: 165, b: 250 },
  actionDark: { r: 30, g: 64, b: 175 },
  success: { r: 15, g: 118, b: 110 },
  danger: { r: 239, g: 68, b: 68 },
  dangerHover: { r: 185, g: 28, b: 28 },
  warning: { r: 250, g: 204, b: 21 },
  warningHover: { r: 253, g: 224, b: 71 },
  ringBlack: { r: 0, g: 0, b: 0 },
  ringGray: { r: 55, g: 65, b: 81 },
  radiusSm: 0.125,
  radiusMd: 0.375,
  radiusLg: 0.5,
  radiusXl: 0.75,
  radiusFull: 9999,
  shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  shadowLg:
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  transitionFast: "150ms",
  transitionNormal: "200ms",
  transitionSlow: "300ms",
  fontFamilyUrl:
    "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;300;400;500;600;700&display=swap",
  fontFamily: "Roboto Mono, monospace",
};

export const claudeTheme: CssVariables = {
  bgBase: { r: 250, g: 249, b: 245 },
  bgGradientFrom: { r: 250, g: 249, b: 245 },
  bgGradientVia: { r: 245, g: 240, b: 232 },
  bgGradientTo: { r: 245, g: 240, b: 232 },
  surface: { r: 239, g: 233, b: 222 },
  surfaceElevated: { r: 245, g: 240, b: 232 },
  surfaceHover: { r: 232, g: 224, b: 210 },
  surfaceInput: { r: 250, g: 249, b: 245 },
  textPrimary: { r: 20, g: 20, b: 19 },
  textSecondary: { r: 61, g: 61, b: 58 },
  textMuted: { r: 108, g: 106, b: 100 },
  textSubtle: { r: 142, g: 139, b: 130 },
  textDisabled: { r: 230, g: 223, b: 216 },
  borderDefault: { r: 230, g: 223, b: 216 },
  borderLight: { r: 235, g: 230, b: 223 },
  borderInput: { r: 230, g: 223, b: 216 },
  borderInputLight: { r: 235, g: 230, b: 223 },
  primary: { r: 204, g: 120, b: 92 },
  action: { r: 204, g: 120, b: 92 },
  actionHover: { r: 169, g: 88, b: 62 },
  actionFocus: { r: 230, g: 223, b: 216 },
  actionDark: { r: 24, g: 23, b: 21 },
  success: { r: 93, g: 184, b: 114 },
  danger: { r: 198, g: 69, b: 69 },
  dangerHover: { r: 169, g: 58, b: 58 },
  warning: { r: 212, g: 160, b: 23 },
  warningHover: { r: 185, g: 140, b: 20 },
  ringBlack: { r: 20, g: 20, b: 19 },
  ringGray: { r: 142, g: 139, b: 130 },
  radiusSm: 0.25,
  radiusMd: 0.5,
  radiusLg: 0.75,
  radiusXl: 1,
  radiusFull: 9999,
  shadowMd:
    "0 2px 8px -2px rgb(20 20 19 / 0.08), 0 1px 3px -1px rgb(20 20 19 / 0.04)",
  shadowLg:
    "0 8px 20px -4px rgb(20 20 19 / 0.12), 0 4px 8px -4px rgb(20 20 19 / 0.06)",
  transitionFast: "150ms",
  transitionNormal: "200ms",
  transitionSlow: "300ms",
  fontFamilyUrl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap",
  fontFamily: '"Cormorant Garamond", Garamond, "Times New Roman", serif',
};

export function toCssBlock(v: CssVariables): string {
  return `:root {
  --color-bg-base: ${rgb(v.bgBase)};
  --color-bg-gradient-from: ${rgb(v.bgGradientFrom)};
  --color-bg-gradient-via: ${rgb(v.bgGradientVia)};
  --color-bg-gradient-to: ${rgb(v.bgGradientTo)};
  --color-surface: ${rgb(v.surface)};
  --color-surface-elevated: ${rgb(v.surfaceElevated)};
  --color-surface-hover: ${rgb(v.surfaceHover)};
  --color-surface-input: ${rgb(v.surfaceInput)};
  --color-text-primary: ${rgb(v.textPrimary)};
  --color-text-secondary: ${rgb(v.textSecondary)};
  --color-text-muted: ${rgb(v.textMuted)};
  --color-text-subtle: ${rgb(v.textSubtle)};
  --color-text-disabled: ${rgb(v.textDisabled)};
  --color-border-default: ${rgb(v.borderDefault)};
  --color-border-light: ${rgb(v.borderLight)};
  --color-border-input: ${rgb(v.borderInput)};
  --color-border-input-light: ${rgb(v.borderInputLight)};
  --color-primary: ${rgb(v.primary)};
  --color-action: ${rgb(v.action)};
  --color-action-hover: ${rgb(v.actionHover)};
  --color-action-focus: ${rgb(v.actionFocus)};
  --color-action-dark: ${rgb(v.actionDark)};
  --color-success: ${rgb(v.success)};
  --color-danger: ${rgb(v.danger)};
  --color-danger-hover: ${rgb(v.dangerHover)};
  --color-warning: ${rgb(v.warning)};
  --color-warning-hover: ${rgb(v.warningHover)};
  --color-ring-black: ${rgb(v.ringBlack)};
  --color-ring-gray: ${rgb(v.ringGray)};
  --radius-sm: ${rem(v.radiusSm)};
  --radius-md: ${rem(v.radiusMd)};
  --radius-lg: ${rem(v.radiusLg)};
  --radius-xl: ${rem(v.radiusXl)};
  --radius-full: ${rem(v.radiusFull)};
  --shadow-md: ${v.shadowMd};
  --shadow-lg: ${v.shadowLg};
  --transition-fast: ${v.transitionFast};
  --transition-normal: ${v.transitionNormal};
  --transition-slow: ${v.transitionSlow};
  --font-family: ${v.fontFamily};
}`;
}
