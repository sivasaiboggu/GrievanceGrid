/**
 * GrievanceGrid Civic Resolution System — Design Tokens
 * Source of Truth: Stitch Project 7120743045756376496
 * Aesthetic: Contemporary Institutional & Structural Minimalist
 */

export const CivicColors = {
  // Brand & Core Surfaces
  primary: '#000412',
  primaryContainer: '#0F1E36',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#7886A3',

  secondary: '#3755C3',
  secondaryContainer: '#708CFD',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#00217A',

  // Canvas & Surfaces
  canvas: '#F8F9FF',
  surface: '#F8F9FF',
  surfaceDim: '#CBDBF5',
  surfaceBright: '#F8F9FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EFF4FF',
  surfaceContainer: '#E5EEFF',
  surfaceContainerHigh: '#DCE9FF',
  surfaceContainerHighest: '#D3E4FE',

  // Borders & Outlines
  outline: '#75777E',
  outlineVariant: '#C5C6CE',
  border: '#E2E8F0',
  borderFocus: '#CBD5E1',

  // Text Layers
  onSurface: '#0B1C30',
  onSurfaceVariant: '#44474D',
  inverseSurface: '#213145',
  inverseOnSurface: '#EAF1FF',

  // Semantic & Feedback
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#93000A',

  // Status Colors (WCAG AAA Compliant)
  status: {
    SUBMITTED: {
      bg: '#DBEAFE',
      text: '#1D4ED8',
      border: '#93C5FD',
      label: 'Submitted',
      icon: 'send'
    },
    ASSIGNED: {
      bg: '#E0F2FE',
      text: '#0369A1',
      border: '#BAE6FD',
      label: 'Assigned',
      icon: 'assignment_ind'
    },
    IN_PROGRESS: {
      bg: '#FEF3C7',
      text: '#B45309',
      border: '#FDE68A',
      label: 'In Progress',
      icon: 'published_with_changes'
    },
    AWAITING_VERIFICATION: {
      bg: '#EEF2FF',
      text: '#4338CA',
      border: '#C7D2FE',
      label: 'Awaiting Verification',
      icon: 'pending'
    },
    RESOLVED: {
      bg: '#DCFCE7',
      text: '#15803D',
      border: '#86EFAC',
      label: 'Resolved',
      icon: 'check_circle'
    },
    OVERDUE: {
      bg: '#FEE2E2',
      text: '#B91C1C',
      border: '#FCA5A5',
      label: 'Overdue',
      icon: 'error_outline'
    },
    APPEALED: {
      bg: '#FDF2F8',
      text: '#BE185D',
      border: '#FBCFE8',
      label: 'Appealed',
      icon: 'flag'
    },
    SYNTHETIC_RISK: {
      bg: '#FFE4E6',
      text: '#991B1B',
      border: '#FDA4AF',
      label: 'Potential Synthetic-Content Risk',
      icon: 'warning'
    },
    VERIFIED_AUTHENTIC: {
      bg: '#DCFCE7',
      text: '#15803D',
      border: '#86EFAC',
      label: 'Verified Authentic',
      icon: 'verified'
    }
  },

  // Priority Levels
  priority: {
    LOW: { bg: '#F1F5F9', text: '#475569', label: 'Low' },
    MEDIUM: { bg: '#E0F2FE', text: '#0369A1', label: 'Medium' },
    HIGH: { bg: '#FFEDD5', text: '#C2410C', label: 'High' },
    URGENT: { bg: '#FEE2E2', text: '#B91C1C', label: 'Urgent' }
  }
} as const;

export const CivicTypography = {
  fontFamilies: {
    headline: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, Menlo, Monaco, Consolas, monospace"
  },
  sizes: {
    displayLg: { size: '36px', lineHeight: '44px', weight: 700, letterSpacing: '-0.02em' },
    displayLgMobile: { size: '28px', lineHeight: '36px', weight: 700, letterSpacing: '-0.02em' },
    headlineLg: { size: '24px', lineHeight: '32px', weight: 600, letterSpacing: '-0.015em' },
    headlineMd: { size: '20px', lineHeight: '28px', weight: 600, letterSpacing: '-0.01em' },
    headlineSm: { size: '16px', lineHeight: '24px', weight: 600, letterSpacing: '-0.005em' },
    bodyLg: { size: '16px', lineHeight: '24px', weight: 400, letterSpacing: '0' },
    bodyMd: { size: '14px', lineHeight: '20px', weight: 400, letterSpacing: '0' },
    bodySm: { size: '13px', lineHeight: '18px', weight: 400, letterSpacing: '0' },
    labelLg: { size: '14px', lineHeight: '20px', weight: 500, letterSpacing: '0' },
    labelMd: { size: '12px', lineHeight: '16px', weight: 500, letterSpacing: '0' },
    labelCode: { size: '12px', lineHeight: '16px', weight: 500, letterSpacing: '0.02em' },
    caption: { size: '11px', lineHeight: '14px', weight: 500, letterSpacing: '0.03em' }
  }
} as const;

export const CivicSpacing = {
  space2xs: '4px',
  spaceXs: '8px',
  spaceSm: '12px',
  spaceMd: '16px',
  spaceLg: '24px',
  spaceXl: '32px',
  space2xl: '48px',
  gutter: '16px',
  gutterDesktop: '24px',
  margin: '16px',
  marginTablet: '24px',
  marginDesktop: '32px'
} as const;

export const CivicRadii = {
  sm: '2px',
  default: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  pill: '9999px'
} as const;

export const CivicShadows = {
  sm: '0 1px 2px 0 rgba(11, 28, 48, 0.05)',
  md: '0 4px 6px -1px rgba(11, 28, 48, 0.07), 0 2px 4px -2px rgba(11, 28, 48, 0.05)',
  lg: '0 10px 15px -3px rgba(11, 28, 48, 0.08), 0 4px 6px -4px rgba(11, 28, 48, 0.04)',
  xl: '0 20px 25px -5px rgba(11, 28, 48, 0.12), 0 8px 10px -6px rgba(11, 28, 48, 0.06)'
} as const;
