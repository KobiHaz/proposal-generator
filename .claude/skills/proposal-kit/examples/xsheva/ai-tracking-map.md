> Source: real XSHEVA deal, redacted (client → «CLIENT», ₪ → «AMOUNT»).
> Structure/phrasing reference only. This is the "light" XSHEVA proposal shape — a lean
> no-code deliverable, single fixed setup fee, no monthly. Contrast with the heavy
> [`rav-bariach.md`](rav-bariach.md) (8-page strategic architecture).

# XSHEVA · Strategic AI Architecture — הצעת מחיר

**הנדון:** מפת מעקב — ללמד AI. דשבורד ניהולי no-code המציג לכל מרצה אילו יחידות כבר נלמדו באילו קורסים — מוזן אוטומטית מטופס קיים, מוטמע ישירות בתוך Moodle.
**מוגש עבור:** «CLIENT» · XSHEVA · תוקף: «DATE»

## רקע — הבעיה שהפתרון פותר
מרצים בקורס "ללמד AI" מייבאים יחידות לימוד מוכנות ללא דרך לדעת אילו יחידות כבר נלמדו במקומות אחרים — מה שיוצר כפילויות. המעקב כיום באקסל ידני ולא ידידותי.
**הפתרון:** דשבורד ויזואלי אוטומטי שמציג בכל רגע אילו יחידות נלמדו, כמה פעמים, ובאילו קורסים — ומתעדכן מעצמו מהטופס הקיים.

## ארכיטקטורה — זרימת נתונים no-code מלאה
Google Form ← Google Sheets ← Looker Studio (דשבורד) ← מוטמע ב-Moodle.
ללא שרת, ללא קוד לתחזוקה, מבוסס כולו על כלי Google Workspace הקיימים במכללה.
- ✓ גישה מוגבלת לדוא״ל המכללתי בלבד
- ✓ הטמעת iFrame מלאה בתוך Moodle
- ✓ סנכרון אוטומטי לפי הגדרה (למשל כל שעה)

## פרוטוטייפ
Wireframe — סקיצת מבנה להמחשה בלבד (פריסה ולוגיקה, לא העיצוב הסופי).

## השקעה — תמחור
| פריט | ערך |
|---|---|
| עלות הקמה (בניית הדשבורד, חיבור לטופס/גיליון, הטמעה ב-Moodle, הרשאות) | «AMOUNT» + מע״מ |
| עלות חודשית | אין — הקמה חד־פעמית בלבד (מבוסס על Google Workspace הקיים של הלקוח) |
