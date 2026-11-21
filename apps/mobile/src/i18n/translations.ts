export const translations = {
  en: {
    appName: 'HerWay',
    demo: 'Demo',
    tagline: 'Calm, clear, and designed around her choice.'
  },
  hi: {
    appName: 'HerWay',
    demo: 'डेमो',
    tagline: 'शांत, स्पष्ट और उसके चयन को ध्यान में रखकर बनाया गया।'
  },
  te: {
    appName: 'HerWay',
    demo: 'డెమో',
    tagline: 'ప్రశాంతంగా, స్పష్టంగా—ఆమె ఎంపికను దృష్టిలో ఉంచి రూపొందించబడింది.'
  }
} as const;

export type SupportedLocale = keyof typeof translations;
