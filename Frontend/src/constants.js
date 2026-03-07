export const API_BASE = 'http://localhost:8000';

export const TABS = [
  { id: 'analytics',   label: 'Analytics',                icon: '◈' },
  { id: 'transactions', label: 'Transactions',            icon: '≡' },
  { id: 'management',  label: 'Merchants & Categories',   icon: '⊞' },
];

export const DATE_PRESETS = [
  { label: '1M',  months: 1  },
  { label: '3M',  months: 3  },
  { label: '6M',  months: 6  },
  { label: '1Y',  months: 12 },
  { label: '2Y',  months: 24 },
  { label: 'ALL', months: null },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const CHART_COLORS = [
  '#f0a500', '#3ecf8e', '#5b8af0', '#a78bfa',
  '#f06060', '#38bdf8', '#fb923c', '#e879f9',
  '#34d399', '#fbbf24', '#f472b6', '#60a5fa',
];
