"""
Build the Rav-Bariach process-automation proposal as a self-contained HTML
document, then render it to PDF via headless Google Chrome.

xsheva design system (canonical — claude.ai design 019ded08…):
  - Accent  : Orange #FF6B35  (the ONLY chromatic color; blue is legacy)
  - Surface : Navy   #101622  (dark cover / hero)
  - Body    : light mode (white) — print collateral is light per the system
  - Type    : Space Grotesk (only typeface), via Google Fonts
  - Logo    : staircase glyph, orange · wordmark XSHEVA (always all-caps)
  - Rules   : no emoji, no exclamation marks, architecture vocabulary

Pipeline:
    python3 build-proposal.py
        → /tmp/proposal_build.html      (self-contained)
        → Chrome --headless --print-to-pdf
        → ../public/samples/proposal-rav-bariach-xsheva.pdf

Chrome is used (not LibreOffice) for vector text, real Space Grotesk, and
proper CSS @page pagination.
"""

import base64
import os
import subprocess

# ─── xsheva tokens ────────────────────────────────────────────────────────────
ORANGE   = "#FF6B35"   # single accent
ORANGE_D = "#B4400F"   # orange text-on-tint (severity medium)
ORANGE_T = "#FFE7D9"   # orange tint fill
NAVY     = "#101622"   # dark surface / cover
INK      = "#1A2230"   # light-mode body text
HEAD     = "#101622"   # light-mode headings
MUTE     = "#66707F"   # muted label
MUTE_D   = "#9AA6B8"   # muted on dark
LINE_D   = "#282e39"   # hairline on dark
LINE     = "#E4E7EC"   # hairline on light
DIV      = "#EEF0F3"   # row divider
ROW      = "#FAFBFC"   # subtle even-row fill
LOWLINE  = "#D4D9E0"   # severity-low outline
WHITE    = "#FFFFFF"

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# staircase logo glyph (48×48)
LOGO = (
    '<svg viewBox="0 0 48 48" width="30" height="30" '
    'style="filter:drop-shadow(0 0 14px rgba(255,107,53,.5));vertical-align:middle;">'
    f'<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="{ORANGE}"/></svg>'
)

# ─── fonts (embedded base64 — reproducible on any machine) ────────────────────
# Space Grotesk covers Latin (XSHEVA, English terms, digits); Heebo covers
# Hebrew. Chrome falls through per-glyph: Latin → Space Grotesk, Hebrew → Heebo.
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

def _face(family, filename, weight_range):
    path = os.path.join(_FONT_DIR, filename)
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    return (f"@font-face{{font-family:'{family}';"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');"
            f"font-weight:{weight_range};font-style:normal;font-display:block;}}")

FONTS = _face("Space Grotesk", "SpaceGrotesk.ttf", "300 700") + \
        _face("Heebo", "Heebo.ttf", "100 900")

# ─── CSS ──────────────────────────────────────────────────────────────────────
CSS = f"""
{FONTS}

* {{ box-sizing: border-box; margin: 0; padding: 0;
     -webkit-print-color-adjust: exact; print-color-adjust: exact; }}

html {{ font-family: 'Space Grotesk', 'Heebo', system-ui, sans-serif; }}
body {{ direction: rtl; text-align: right; color: {INK};
        font-size: 10.5pt; line-height: 1.7; background: {WHITE}; }}

@page {{ size: A4; margin: 15mm 15mm 16mm; }}
@page :first {{ margin: 0; }}

/* ── eyebrow / headings ── */
.eyebrow {{ font-size: 8pt; font-weight: 700; letter-spacing: .16em;
            text-transform: uppercase; color: {ORANGE}; }}
.sec {{ margin: 0 0 22px; }}
.sec-head {{ margin: 0 0 10px; break-after: avoid; break-inside: avoid; }}
.sec-title {{ font-size: 19pt; font-weight: 700; letter-spacing: -.02em;
              color: {HEAD}; line-height: 1.1; margin-top: 2px; }}
.sub {{ font-size: 12pt; font-weight: 600; color: {HEAD};
        margin: 16px 0 7px; letter-spacing: -.01em; break-after: avoid; }}
.lead {{ font-weight: 700; color: {MUTE}; font-size: 9pt; margin: 12px 0 4px;
         text-transform: uppercase; letter-spacing: .06em; }}
p {{ margin-bottom: 7px; }}
.note {{ color: {MUTE}; font-size: 8.5pt; margin-top: 6px; }}

/* ── bullets ── */
ul {{ list-style: none; margin: 6px 0 10px; }}
li {{ position: relative; padding-right: 16px; margin-bottom: 4px; line-height: 1.6; }}
li::before {{ content: ""; position: absolute; right: 2px; top: .62em;
              width: 5px; height: 5px; background: {ORANGE}; border-radius: 1px; }}

/* ── tables ── */
table.tbl {{ width: 100%; border-collapse: collapse; margin: 8px 0 14px;
             font-size: 9.5pt; border: 1px solid {LINE};
             border-radius: 8px; overflow: hidden; }}
table.tbl th {{ background: {NAVY}; color: {WHITE}; font-weight: 600;
                text-align: right; padding: 9px 11px;
                border-bottom: 2px solid {ORANGE}; vertical-align: top; }}
table.tbl td {{ padding: 8px 11px; border-bottom: 1px solid {DIV};
                text-align: right; vertical-align: top; line-height: 1.55; }}
table.tbl tbody tr:nth-child(even) {{ background: {ROW}; }}
table.tbl tr.total td {{ background: {WHITE}; font-weight: 700; color: {HEAD};
                         border-top: 2px solid {ORANGE}; border-bottom: none; }}
table.tbl tr.total td.accent {{ color: {ORANGE}; }}
tr, table {{ break-inside: avoid; }}

/* ── severity chips (no emoji) ── */
.chip {{ display: inline-block; font-size: 8pt; font-weight: 700;
         padding: 2px 9px; border-radius: 2px; white-space: nowrap; }}
.chip-high {{ background: {ORANGE}; color: {WHITE}; }}
.chip-mid  {{ background: {ORANGE_T}; color: {ORANGE_D}; }}
.chip-low  {{ border: 1px solid {LOWLINE}; color: {MUTE}; font-weight: 600; }}

/* ── stat tiles ── */
.stats {{ display: table; width: 100%; border-spacing: 10px 0; margin: 4px 0 16px; }}
.stat {{ display: table-cell; width: 33%; border: 1px solid {LINE};
         border-radius: 8px; padding: 14px 16px; vertical-align: top; }}
.stat .v {{ font-size: 26pt; font-weight: 700; color: {HEAD};
            letter-spacing: -.02em; line-height: 1; }}
.stat .v small {{ font-size: 14pt; color: {ORANGE}; }}
.stat .k {{ font-size: 7.5pt; font-weight: 700; color: {MUTE};
            text-transform: uppercase; letter-spacing: .12em; margin-top: 6px; }}

/* ── maintenance callout ── */
.callout {{ border: 1px solid {LINE}; border-right: 3px solid {ORANGE};
            border-radius: 8px; padding: 12px 14px; margin: 8px 0 14px; }}
.callout .price {{ font-size: 15pt; font-weight: 700; color: {ORANGE}; }}

.pb {{ break-before: page; }}
"""

# ─── helpers ──────────────────────────────────────────────────────────────────
def eyebrow(t): return f'<div class="eyebrow">{t}</div>'

def section(num, title, body, page_break=False):
    cls = "sec pb" if page_break else "sec"
    return (f'<div class="{cls}"><div class="sec-head">{eyebrow(title[1])}'
            f'<div class="sec-title">{num} · {title[0]}</div></div>{body}</div>')

def sub(t):  return f'<div class="sub">{t}</div>'
def lead(t): return f'<div class="lead">{t}</div>'
def para(t): return f'<p>{t}</p>'
def bullets(items): return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
def note(t): return f'<div class="note">{t}</div>'

def table(headers, rows, total=None, accent_cols=None):
    accent_cols = accent_cols or []
    h = "".join(f"<th>{x}</th>" for x in headers)
    body = ""
    for r in rows:
        body += "<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
    if total:
        cells = ""
        for j, c in enumerate(total):
            cls = ' class="accent"' if j in accent_cols else ""
            cells += f"<td{cls}>{c}</td>"
        body += f'<tr class="total">{cells}</tr>'
    return f'<table class="tbl"><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>'

def chip(level):
    label = {"high": "גבוהה", "mid": "בינונית", "low": "נמוכה"}[level]
    return f'<span class="chip chip-{level}">{label}</span>'

def stats(items):
    cells = "".join(f'<div class="stat"><div class="v">{v}</div><div class="k">{k}</div></div>'
                    for v, k in items)
    return f'<div class="stats">{cells}</div>'

# ─── COVER ────────────────────────────────────────────────────────────────────
COVER = f"""
<div style="background:{NAVY};width:100%;min-height:297mm;position:relative;
            padding:46mm 26mm 0;overflow:hidden;">
  <div style="direction:ltr;display:flex;align-items:center;gap:12px;">
    {LOGO}<span style="font-size:26pt;font-weight:700;color:{WHITE};letter-spacing:.14em;">XSHEVA</span>
  </div>
  <div class="eyebrow" style="direction:ltr;text-align:left;margin-top:6px;">STRATEGIC AI ARCHITECTURE</div>

  <div style="border-top:1px solid {LINE_D};margin:26mm 0 10mm;"></div>

  <div class="eyebrow">הצעת מחיר</div>
  <div style="font-size:34pt;font-weight:700;color:{WHITE};letter-spacing:-.02em;line-height:1.05;margin:4px 0 6px;">אוטומציית תהליכים</div>
  <div style="font-size:12pt;color:{MUTE_D};font-weight:400;">אינטגרציה עם Priority ERP &nbsp;·&nbsp; AI &amp; Workflow Automation</div>

  <div style="margin-top:14mm;display:inline-block;background:{ORANGE};color:{NAVY};
              font-weight:700;font-size:17pt;padding:9px 30px;border-radius:2px;letter-spacing:.02em;">רב-בריח</div>

  <div style="position:absolute;bottom:24mm;right:26mm;left:26mm;direction:rtl;">
    <div style="border-top:1px solid {LINE_D};padding-top:10px;font-size:9pt;color:{MUTE};">
      <span style="float:right;">מוגש על ידי <strong style="color:{WHITE};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</span>
      <span style="float:left;direction:ltr;">יולי 2026 · מסמך סודי · תוקף: 6.7.2026</span>
      <span style="display:block;clear:both;"></span>
    </div>
  </div>

  <div style="position:absolute;left:-70px;bottom:-70px;width:260px;height:260px;
              background:{ORANGE};opacity:.14;border-radius:50%;filter:blur(70px);"></div>
</div>
"""

# ─── SECTION 1 · מבוא ──────────────────────────────────────────────────────────
SEC1 = section("1", ("מבוא ורציונל", "רקע"),
    para("רב-בריח, חברה מובילה בתחום מוצרי אבטחה ומנעולנות, מזהה הזדמנות אסטרטגית לייעול שני תהליכים עיקריים הפועלים כיום באופן ידני מלא:")
    + bullets([
        "<strong>תהליך 1 — רשימות קבלנים וקריאות שירות:</strong> זיהוי וסיווג פניות קבלנים במייל, בדיקת אחריות מול Priority ERP, פתיחת קריאות שירות ושיבוץ טכנאי.",
        "<strong>תהליך 2 — הזמנות עבודה:</strong> שליפה, ולידציה והקלדה אוטומטית של הזמנות ל-Priority, עם workflow אישורים מדורג.",
    ])
    + para("שני התהליכים עתירי כוח אדם, מועדים לשגיאות, ומהווים צוואר בקבוק בשרשרת האספקה. הפתרון משלב AI, אוטומציה וממשקי Priority API — תוך שמירה על human-in-the-loop בנקודות קריטיות.")
    + lead("גישת מימוש — פיילוט תחילה (MVP)")
    + para("ההצעה מתמקדת בבניית ה-\"happy path\" של שני התהליכים כ-MVP, עם בקרה אנושית בנקודות הקריטיות. מקרי קצה, פורמטים לא-אחידים ואוטומציה מלאה מטופלים איטרטיבית לאחר הפיילוט. <strong>שני התהליכים מתומחרים בנפרד — ניתן להתחיל מתהליך אחד בלבד.</strong>"))

# ─── SECTION 2 · תשתית ואבטחה ──────────────────────────────────────────────────
SEC2 = section("2", ("תשתית, ארכיטקטורה ואבטחה", "פלטפורמה"),
    para("הפתרון רץ על תשתית עצמאית בשליטת הארגון, לשמירה על אבטחת מידע ואקו-סיסטם יציב:")
    + sub("2.1 · Stack טכנולוגי")
    + table(["שכבה", "טכנולוגיה", "תפקיד"], [
        ["תשתית", "VPS פרטי בשליטת הארגון", "הרצת כל רכיבי המערכת — עיבוד self-hosted"],
        ["אוטומציה", "n8n (על ה-VPS)", "ניהול flows, סוכני AI, לוגיקה עסקית, התראות"],
        ["AI / NLP", "Anthropic Claude API (חיצוני)", "ניתוח טקסט, חילוץ מידע מובנה, Confidence Score"],
        ["ERP", "Priority OData REST API", "קריאה / כתיבה: פרויקטים, אחריות, קריאות שירות, הזמנות"],
        ["Dashboard", "Web App על ה-VPS", "ניטור, תיבת חריגות, בקרה ידנית (HITL), דוחות"],
    ])
    + note("התשתית (VPS) — אספקה, עלות ותחזוקה שוטפת — באחריות רב-בריח. XSHEVA מתקינה, מריצה ומתחזקת עליה את רכיבי המערכת בלבד.")
    + sub("2.2 · Human-in-the-Loop")
    + para("האוטומציה מאיצה, לא מחליפה שיקול דעת. בקרה אנושית בשלבים הקריטיים:")
    + bullets([
        "<strong>מדד ביטחון (Confidence Score)</strong> על כל חילוץ מידע — מתחת לסף המוגדר, הפריט עובר לתיבת חריגות לטיפול ידני.",
        "<strong>תהליך 1</strong> — שליחת הצעת מחיר מחייבת אישור נציג ידני (אוטומציה מלאה תישקל רק אחרי הפיילוט).",
        "<strong>תהליך 2</strong> — אישור בכירה לפני הורדת הזמנה לשטח, עם נעילת הזמנה (status lock).",
        "כל פעולה מתועדת ב-audit log: timestamp, input, output, תוצאה.",
    ])
    + sub("2.3 · אבטחת מידע — מודל היברידי")
    + para("כל התשתית והעיבוד רצים self-hosted על VPS בשליטת הארגון; רק ניתוח הטקסט עצמו נשלח ל-Anthropic API (בכפוף ל-DPA). זה מצמצם משמעותית את משטח הסיכון מול פתרון ענן מלא. מסלול self-hosted מלא ל-AI (Ollama / Llama) על אותו VPS יישקל אם תידרש אי-יציאת מידע מוחלטת.")
    + sub("2.4 · אבטחת AI — Prompt Injection וקלט זדוני")
    + para("כל תוכן חיצוני (מיילים, טפסים) נחשב לא-מהימן ומטופל כ-data בלבד — לעולם לא כהוראות לסוכן:")
    + bullets([
        "<strong>הפרדת הוראות מתוכן</strong> (instruction / data separation) — טקסט מהמייל אינו יכול לשנות את לוגיקת הסוכן.",
        "<strong>Guardrails וסינון קלט</strong> מפני הזרקות (prompt injection), קישורים וקבצים זדוניים.",
        "<strong>ולידציית פלט</strong> לפני כל כתיבה ל-Priority, עם הרשאות least-privilege.",
        "שער ה-HITL משמש גם כבקרת אבטחה — פעולה חריגה נעצרת לאישור אנושי.",
    ])
    + sub("2.5 · למידה מתמשכת (Human-in-the-Loop Learning)")
    + para("בשני התהליכים: בתחילה כל בקשה עוברת בקרה אנושית — הנציג/ה מאשר, עורך או מתקן. כל אישור ותיקון נשמר כ-dataset מתויג שממנו הסוכן לומד ומשתפר לאורך זמן:")
    + bullets([
        "<strong>התחלה — 100% HITL:</strong> כל פריט מאושר או נערך ידנית.",
        "<strong>תיעוד:</strong> כל אישור ותיקון נרשם כ-labeled data (קלט → פלט נכון).",
        "<strong>הערכה תקופתית:</strong> מדידת דיוק מול הבקרות, והעלאת סף האוטונומיה בהדרגה כשהדיוק מוכח — בנפרד לכל תהליך.",
    ])
    + note("fine-tuning / אימון אוטומטי מתקדם מתבצע איטרטיבית לאחר הפיילוט.")
    + sub("2.6 · Caching ואופטימיזציה")
    + para("תוצאות ולידציה שכבר חושבו נשמרות ב-cache למניעת בדיקות כפולות וחיסכון בקריאות API. לדוגמה בתהליך 1: פרויקט ותוקף אחריות שכבר נבדקו נשלפים מה-cache, ללא שאילתה חוזרת ל-Priority. מנגנון invalidation / TTL מרענן נתונים שהשתנו."))

# ─── SECTION 3 · תהליך 1 ───────────────────────────────────────────────────────
SEC3 = section("3", ("תהליך 1 — רשימות קבלנים", "אפיון · תהליך 1"),
    lead("מצב נוכחי")
    + para("קבלנים שולחים מיילים (מכתובות משתנות, ללא תבנית אחידה) עם פרטי דיירים שנתקלו בתקלה. נציגה מקבלת, בודקת ידנית אחריות ומסווגת טיפול.")
    + lead("זרימת תהליך אוטומטית מוצעת")
    + bullets([
        "<strong>קלט וסיווג:</strong> תיעול כלל הפניות למייל מרכזי אחד; סיווג לפי שולח / דומיין / מילות מפתח + סינון False Positives.",
        "<strong>ניתוח AI:</strong> חילוץ מידע מובנה (גוף מייל / PDF / Excel) — פרויקט, דייר, סוג תקלה — עם Confidence Score.",
        "<strong>בדיקת אחריות:</strong> הצלבה מול Priority OData / דאטה-בייס הפרויקטים ותוקף האחריות.",
        "<strong>באחריות</strong> ← פתיחת קריאת שירות ב-Priority + שיבוץ טכנאי / קריאה לנציגה לתיאום.",
        "<strong>לא באחריות</strong> ← ריכוז הנתונים לנציגה. הפקת ושליחת הצעת מחיר אוטומטית <strong>אינה כלולה בשלב זה</strong> — נדרש אישור נציג ידני.",
        "<strong>חריגות:</strong> Confidence נמוך ← תיבת ביקורת לנציגה. לוג מלא + dashboard לניטור.",
    ])
    + note("במידה ואין דאטה-בייס מרכזי לאחריות — ייתכן ותידרש משימת ביניים (milestone) לבניית טבלת פרויקטים / אחריות ייעודית באפיון הסופי (מכוסה בחריגת ה-20%)."))

# ─── SECTION 4 · תהליך 2 ───────────────────────────────────────────────────────
SEC4 = section("4", ("תהליך 2 — הזמנות עבודה", "אפיון · תהליך 2"),
    lead("מצב נוכחי")
    + para("עובדות מקבלות הזמנות בטאבלט או בטפסים ידניים, מבצעות בקרה ידנית, ומקלידות ל-Priority. עיכוב בהקלדה שקול לעצירת שרשרת האספקה — צוואר בקבוק קריטי.")
    + lead("זרימת תהליך אוטומטית מוצעת")
    + bullets([
        "<strong>ריכוז לערוץ דיגיטלי:</strong> שאיפה למרכז את כל קבלת ההזמנות לערוץ דיגיטלי אחד ליצירת flow אחיד (במקום טפסים פיזיים / צילומים).",
        "<strong>ולידציה מול SSOT:</strong> הצלבת נתונים מול בסיס הנתונים המוסמך של הארגון (Single Source of Truth) — שדות חובה, ערכים תקינים, התאמה לפרויקט.",
        "<strong>תקינה</strong> ← הקלדה אוטומטית ל-Priority + שינוי סטטוס.",
        "<strong>לא תקינה / Confidence נמוך</strong> ← ניתוב לבקרה ידנית + תיאור הסטייה.",
        "<strong>דורש אישור בכירה</strong> ← נעילת הזמנה (status lock) + התראה מיידית, לפני הורדה לשטח.",
        "Audit log מלא לכל פעולה אוטומטית.",
    ])
    + note("הגדרת \"הזמנה תקינה\" מול הקריטריונים הנבדקים ידנית כיום תיקבע ב-Workshop בשלב 0. טפסים ידניים / מצולמים (איכות נמוכה, כתב יד) מטופלים דרך ה-MVP וחריגת ה-20%."))

# ─── SECTION 5 · ROADMAP ───────────────────────────────────────────────────────
SEC5 = section("5", ("ROADMAP ולוח זמנים", "לוח זמנים"),
    table(["שלב", "כותרת", "משך", "Milestone"], [
        ["0", "תשתית, אפיון ו-POC (Priority API)", "שבועות 1–2", "Sign-off אפיון"],
        ["1", "פיתוח תהליך 1 — רשימות קבלנים (MVP)", "שבועות 3–4", "Demo תהליך 1"],
        ["2", "פיתוח תהליך 2 — הזמנות (MVP)", "שבועות 5–7", "Demo תהליך 2"],
        ["3", "QA, UAT, הדרכה ו-Go-Live", "שבועות 8–9", "Go-Live"],
    ])
    + note("סה\"כ timeline: כ-9 שבועות (כחודשיים) מחתימת הסכם. מותנה בזמינות Priority API ובמענה מהיר בשלב האפיון."))

# ─── SECTION 6 · תמחור ─────────────────────────────────────────────────────────
SEC6 = section("6", ("תמחור", "השקעה"),
    sub("6.1 · עלויות הקמה — תעריף 550 ₪ / שעה")
    + table(["בלוק", "תיאור", "שעות", "עלות (₪)"], [
        ["שלב 0 — תשתית", "VPS, חיבור Priority OData + POC, מייל מרכזי, מסגרת דשבורד, אפיון", "20", "11,000"],
        ["תהליך 1 — קבלנים", "parser, בדיקת אחריות, דיספאץ׳ ושיבוץ, תיבת חריגות HITL", "38", "20,900"],
        ["תהליך 2 — הזמנות", "ingestion, ולידציה SSOT, נעילת אישור בכירה, Confidence Score", "48", "26,400"],
    ], total=["סה\"כ", "", "106", "58,300 + מע\"מ"], accent_cols=[3])
    + note("scope של MVP-פיילוט: ה-\"happy path\" של שני התהליכים עם בקרה אנושית. כל תהליך מתומחר בנפרד — ניתן להתחיל מתהליך אחד. <strong>סעיף חריגה מוסכם: עד 20% מהשעות לכל בלוק</strong>, למקרי קצה שיצופו תוך כדי (מאושר מראש במסגרת האפיון).")
    + note("<strong>לא כלול:</strong> עלויות תשתית וספקי צד ג׳ — VPS / אירוח, קרדיטים ל-Anthropic API, רישוי Priority — אינן כלולות בהצעה ובאחריות הלקוח.")
    + sub("6.2 · אחזקה חודשית שוטפת")
    + '<div class="callout"><span class="price">3,500 ₪ + מע\"מ / חודש</span>'
      '<div class="note" style="margin-top:4px;">כלול בריטיינר: ניטור שוטף · תחזוקה מונעת · עדכונים ותיקונים קלים · דוח ביצועים חודשי.</div></div>'
    + sub("6.3 · תמיכה שוטפת — מעבר לאחריות")
    + table(["מסלול", "תיאור", "תעריף"], [
        ["אחריות באגים (כלול)", "שבועיים מ-Go-Live — תקלות במסגרת האפיון הסופי בלבד", "ללא עלות"],
        ["מסלול שעתי (Ad-hoc)", "תיקונים ושינויים מעבר לאפיון / לאחריות", "600 ₪ / שעה"],
        ["בנק שעות מוזל", "רכישה מראש של 20 שעות (9,600 ₪)", "480 ₪ / שעה"],
    ], accent_cols=[])
    + sub("6.4 · אבני תשלום")
    + table(["אבן", "תנאי", "אחוז", "סכום (₪)"], [
        ["1", "חתימת הסכם", "25%", "14,575"],
        ["2", "Sign-off אפיון (שלב 0)", "25%", "14,575"],
        ["3", "Demo מוצלח שני תהליכים", "25%", "14,575"],
        ["4", "Go-Live + אישור לקוח", "25%", "14,575"],
    ], total=["סה\"כ", "", "100%", "58,300"], accent_cols=[3])
    + note("בנק השעות חוסך 20% מול התעריף השעתי (600 ₪). כל המחירים אינם כוללים מע\"מ."))

# ─── SECTION 7 · ROI ───────────────────────────────────────────────────────────
SEC7 = section("7", ("ניתוח ROI", "החזר השקעה"),
    stats([("196%", "ROI · שנה 1"), ("~3", "חודשים · נקודת איזון"),
           ('297K<small>₪</small>', "חיסכון שנתי")])
    + sub("7.1 · הנחות חישוב")
    + table(["פרמטר", "ערך הנחה"], [
        ["עובדות המחלקה", "10"],
        ["שעות יומיות — תהליך 1 (קבלנים)", "9 (3 ש׳/יום × 3 עובדות)"],
        ["שעות יומיות — תהליך 2 (הזמנות)", "35 (7 ש׳/יום × 5 עובדות)"],
        ["ימי עבודה בשנה", "250"],
        ["עלות שעת עבודה (כולל נטל מעסיק)", "45 ₪ / שעה"],
        ["אפקטיביות אוטומציה (שמרנית)", "60%"],
        ["ערך שגיאות ועיכובים (הערכה שמרנית)", "30,000–60,000 ₪ / שנה"],
    ])
    + sub("7.2 · חישוב חיסכון שנתי")
    + table(["סעיף", "ערך"], [
        ["סה\"כ שעות אנוש שנתיות", "11,000 שעות / שנה"],
        ["עלות כוח אדם נוכחית", "495,000 ₪ / שנה"],
        ["חיסכון שעות (60% אוטומציה)", "297,000 ₪ / שנה"],
        ["ערך צמצום שגיאות ועיכובים", "30,000–60,000 ₪ / שנה"],
    ], total=["סה\"כ ערך שנתי מוערך", "327,000–357,000 ₪ / שנה"], accent_cols=[1])
    + sub("7.3 · Timeline להחזר השקעה")
    + table(["תקופה", "עלות מצטברת", "חיסכון מצטבר", "מצב"], [
        ["Go-Live (חודש 2)", "58,300 ₪", "—", ""],
        ["חודש 5 (~3 מ-Go-Live)", "~68,800 ₪", "~74,250 ₪", "<strong>נקודת איזון</strong>"],
        ["שנה 1 (12 חודשי ריטיינר)", "100,300 ₪", "297,000 ₪", ""],
        ["רווח נקי שנה 1", "—", "196,700 ₪", "<strong>ROI 196%</strong>"],
    ])
    + note("עלות שנה 1: 58,300 ₪ הקמה + 42,000 ₪ ריטיינר = 100,300 ₪. רווח נקי מול חיסכון שמרני של 297,000 ₪. ההנחות מבוססות על ראיון ראשוני; מדידות בסיס מדויקות ייכללו בשלב 0."))

# ─── SECTION 7 · סיכונים ───────────────────────────────────────────────────────
RISKS = [
    ["ס-1", "שליחת מידע אישי דיירים לספקי AI חיצוניים", "high", "עיבוד self-hosted על VPS + DPA; Ollama מלא בעת הצורך", "אבטחת מידע"],
    ["ס-2", "דרישת self-hosted מלא ל-AI (מעבר לתשתית)", "mid", "מסלול Ollama / Llama על ה-VPS הקיים", "IT + אבטחת מידע"],
    ["ס-3", "Priority API לא נגיש מרשת חיצונית", "high", "VPN / agent מקומי / IP whitelist", "IT Priority"],
    ["ס-4", "הזמנה עוברת ללא אישור בכירה", "high", "Status lock + audit log + התראה", "אפיון מול צוות"],
    ["ס-5", "חבילת טרנסאקציות Priority חסרה", "mid", "רכש נוסף מ-Priority Software", "IT Priority"],
    ["ס-6", "גרסת Priority ישנה — תאימות API חלקית", "mid", "POC מלא בשלב 0", "IT Priority"],
    ["ס-7", "GDPR / חוק הגנת פרטיות — מידע דיירים", "mid", "DPA עם ספקים, מדיניות שמירה / מחיקה", "משפטי"],
    ["ס-8", "זיהוי שגוי של מיילים רלוונטיים", "mid", "Confidence score + ביקורת שבועית", "אפיון"],
    ["ס-9", "פורמט מגוון של תוכן מיילי קבלנים", "low", "parser מולטי-פורמט / תבנית אחידה", "אפיון"],
    ["ס-10", "תהליך 'לא באחריות' לא מוגדר סופית", "low", "הגדרה מלאה בשלב 0", "סיגל"],
    ["ס-11", "OCR טפסים פיזיים — אמינות נמוכה", "mid", "validation אנושי / מעבר דיגיטלי", "הנהלה"],
    ["ס-12", "קריטריוני 'הזמנה תקינה' לא מתועדים", "mid", "Workshop בשלב 0", "סיגל + צוות"],
    ["ס-13", "טפסי Priority לא מוגדרים כ-Available for API", "low", "הגדרה ידנית על ידי IT", "IT Priority"],
    ["ס-14", "נתוני מנהל פרויקט חסרים ב-Priority", "low", "הקמת mapping table", "IT Priority"],
    ["ס-15", "Prompt injection / קלט זדוני משפיע על החלטות ה-AI", "high", "הפרדת הוראות מ-data, guardrails, ולידציית פלט, least-privilege, שער HITL", "אבטחת מידע"],
]
SEC8 = section("8", ("רישום סיכונים", "ניהול סיכונים"),
    para("סיכונים בחומרה גבוהה דורשים מענה לפני חתימת הסכם.")
    + table(["#", "סיכון", "חומרה", "מיטיגציה", "מצריך אימות"],
            [[r[0], r[1], chip(r[2]), r[3], r[4]] for r in RISKS]))

# ─── SECTION 9 · SLA ───────────────────────────────────────────────────────────
SEC9 = section("9", ("SLA ותנאי שירות", "רמת שירות"),
    table(["מדד", "התחייבות"], [
        ["זמן תגובה — תקלה קריטית", "4 שעות (בשעות עבודה)"],
        ["זמן פתרון — תקלה קריטית", "48 שעות"],
        ["זמן תגובה — תקלה רגילה", "24 שעות (בשעות עבודה)"],
        ["Uptime יעד", "99% (רכיבי אוטומציה בשליטתנו)"],
        ["חלון תחזוקה", "ימי ראשון, 22:00–01:00"],
        ["דוח ביצועים", "חודשי — עיבודים, שגיאות, זמני תגובה"],
        ["ערוצי תקשורת", "Slack / WhatsApp / מייל · א׳–ה׳ 09:00–18:00"],
        ["גיבויים", "יומי — לוגים, קונפיגורציה, נתוני מעקב"],
        ["אחריות באגים", "שבועיים מ-Go-Live — תקלות במסגרת האפיון הסופי; מעבר לכך במסלול שעתי"],
    ]))

# ─── SECTION 10 · דרישות תחילת עבודה ───────────────────────────────────────────
SEC10 = section("10", ("דרישות תחילת עבודה", "תנאים מוקדמים"),
    para("נדרשים לפני תחילת הפיתוח. אי-עמידה עלולה לדחות את לוח הזמנים:")
    + bullets([
        "<strong>דאטה לאימון (חובה):</strong> נתונים היסטוריים מתויגים — מיילים / הזמנות עבר עם הסיווגים והתגובות הנכונים — לאימון המודל לכלל המקרים. תנאי מוקדם לתחילת הפיתוח; משפיע על לוח הזמנים ואיכות המודל.",
        "<strong>אישור אבטחת מידע:</strong> האם מידע דיירים יכול לעבור לספקי AI חיצוניים? (ס-1, ס-2)",
        "<strong>גישת IT ל-Priority:</strong> API, גרסה, חבילת טרנסאקציות, נגישות חיצונית (ס-3, ס-5, ס-6)",
        "<strong>VPS / תשתית:</strong> אספקת שרת וירטואלי בשליטת הארגון (חומרה / ענן, עלות ותחזוקה שוטפת) — באחריות רב-בריח.",
        "<strong>מדיניות סיווג מיילים:</strong> כתובות / דומיינים / מילות מפתח לזיהוי פניות קבלנים (ס-8)",
        "<strong>קריטריוני 'הזמנה תקינה'</strong> ותנאי 'אישור בכירה' מתועדים (ס-12, ס-4)",
        "<strong>מדיניות טיפול בטפסים פיזיים</strong> / מעבר לדיגיטל (ס-11)",
        "<strong>נציג IT / Priority</strong> מטעם רב-בריח לשיתוף פעולה טכני שוטף",
    ])
    + note("פריטים אלו מהווים תנאי מוקדם לדיוק לוח הזמנים והמחיר הסופי.")
    + f'<div style="margin-top:22px;border-top:1px solid {LINE};padding-top:14px;'
      f'text-align:center;color:{MUTE};font-size:9.5pt;">בכבוד רב · '
      f'<strong style="color:{HEAD};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</div>')

def build():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "samples")
    os.makedirs(out_dir, exist_ok=True)
    html_path = "/tmp/proposal_build.html"
    pdf_path = os.path.abspath(os.path.join(out_dir, "proposal-rav-bariach-xsheva.pdf"))

    body = (COVER + SEC1 + SEC2 + SEC3 + SEC4 + SEC5
            + SEC6 + SEC7 + SEC8 + SEC9 + SEC10)
    html = (f'<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8">'
            f'<style>{CSS}</style></head><body>{body}</body></html>')

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML: {len(html) // 1024} KB → {html_path}")

    if not os.path.exists(CHROME):
        print(f"⚠ Chrome not found at {CHROME} — open the HTML and print to PDF manually.")
        return

    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=15000", "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}", f"file://{html_path}",
    ], capture_output=True, text=True)

    if os.path.exists(pdf_path):
        print(f"✅ {pdf_path} ({os.path.getsize(pdf_path) // 1024} KB)")
    else:
        print("❌ Chrome print failed.")


if __name__ == "__main__":
    build()
