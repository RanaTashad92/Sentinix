export const theme = {
  colors: {
    bg: '#090D16',
    bgCard: '#131B2E',
    bgCardBorder: '#1E293B',
    bgCardHover: '#1B273E',
    accent: '#6366F1',
    accentLight: '#818CF8',
    accentGlow: 'rgba(99, 102, 241, 0.22)',
    safe: '#10B981',
    safeLight: '#34D399',
    safeGlow: 'rgba(16, 185, 129, 0.22)',
    suspicious: '#F59E0B',
    suspiciousLight: '#FBBF24',
    suspiciousGlow: 'rgba(245, 158, 11, 0.22)',
    dangerous: '#EF4444',
    dangerousLight: '#F87171',
    dangerousGlow: 'rgba(239, 68, 68, 0.22)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#1E293B',
    borderLight: '#334155',
    inputBg: '#0F172A',
  },
  fonts: {
    regular: 'System',
    mono: 'Courier New',
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
};

export type Verdict = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | null;

export const verdictColor = (v: Verdict) => {
  if (v === 'SAFE') return theme.colors.safe;
  if (v === 'SUSPICIOUS') return theme.colors.suspicious;
  if (v === 'DANGEROUS') return theme.colors.dangerous;
  return theme.colors.accent;
};

export const verdictGlow = (v: Verdict) => {
  if (v === 'SAFE') return theme.colors.safeGlow;
  if (v === 'SUSPICIOUS') return theme.colors.suspiciousGlow;
  if (v === 'DANGEROUS') return theme.colors.dangerousGlow;
  return theme.colors.accentGlow;
};