export const translations = {
  en: {
    appName: 'HerWay',
    demo: 'Preview',
    tagline: 'Calm, clear, and designed around her choice.'
  },
  hi: {
    appName: 'HerWay',
    demo: 'पूर्वावलोकन',
    tagline: 'शांत, स्पष्ट और उसके चयन को ध्यान में रखकर बनाया गया।'
  },
  te: {
    appName: 'HerWay',
    demo: 'ప్రివ్యూ',
    tagline: 'ప్రశాంతంగా, స్పష్టంగా—ఆమె ఎంపికను దృష్టిలో ఉంచి రూపొందించబడింది.'
  }
} as const;

export type SupportedLocale = keyof typeof translations;
