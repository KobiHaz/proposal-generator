export interface AgreementPreset {
  subtitle: string;
  section1Title: string;
  section1Content: string;
  section2Title: string;
  section5Content: string;
}

export const agreementPresets: Record<'crm' | 'automation', AgreementPreset> = {
  crm: {
    subtitle: 'לאספקת שירותי פיתוח ותחזוקת תוכנה',
    section1Title: 'מהות השירות',
    section1Content:
      'הספק יפתח עבור הלקוח מערכת CRM/אפליקציה (להלן: "המערכת") המבוססת על טכנולוגיית ענן ושירותי צד ג\', בהתאם למסמך האפיון המפורט המצורף כנספח ב\'.',
    section2Title: 'שלב ההקמה (Development Phase)',
    section5Content:
      'קוד המקור של המערכת. הספק מוותר על כל זכות קניינית במערכת לאחר מסירתה הסופית וקבלת התשלום, למעט שימוש בספריות קוד פתוח או רכיבי מדף קיימים.',
  },
  automation: {
    subtitle: 'לאספקת שירותי אוטומציה ואינטגרציה',
    section1Title: 'מהות השירות',
    section1Content:
      'הספק יקים עבור הלקוח מערכת אוטומציה ואינטגרציה (להלן: "המערכת") המבוססת על פלטפורמות ענן (כגון Make.com, Zapier וכיוצא בזה) ושירותי צד ג\', בהתאם למסמך האפיון המפורט המצורף כנספח ב\'.',
    section2Title: 'שלב ההקמה (Integration Phase)',
    section5Content:
      'הלוגיקה, התסריטים והסצנריונים של המערכת. הספק מוותר על כל זכות קניינית במערכת לאחר מסירתה הסופית וקבלת התשלום, למעט שימוש בשירותי מדף או רכיבים קיימים.',
  },
};
