"""
Build the Ruppin "multi-choice unpivot automation" price quote as a
self-contained HTML document, then render it to PDF via headless Chrome.

Small, focused scope (Apps Script trigger + one sheet tab) — deliberately
kept to 1-2 pages, not the full enterprise-proposal format.

Pipeline:
    python3 build-proposal-ruppin-unpivot.py
        → /tmp/proposal_ruppin_build.html   (self-contained)
        → Chrome --headless --print-to-pdf
        → ../public/samples/proposal-ruppin-unpivot-xsheva.pdf
"""

import base64
import os
import subprocess

# ─── xsheva tokens (same design system as build-proposal.py) ──────────────────
ORANGE   = "#FF6B35"
ORANGE_D = "#B4400F"
ORANGE_T = "#FFE7D9"
NAVY     = "#101622"
INK      = "#1A2230"
HEAD     = "#101622"
MUTE     = "#66707F"
MUTE_D   = "#9AA6B8"
LINE_D   = "#282e39"
LINE     = "#E4E7EC"
DIV      = "#EEF0F3"
ROW      = "#FAFBFC"
WHITE    = "#FFFFFF"

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

LOGO = (
    '<svg viewBox="0 0 48 48" width="30" height="30" '
    'style="filter:drop-shadow(0 0 14px rgba(255,107,53,.5));vertical-align:middle;">'
    f'<path d="M10 32L10 22L24 22L24 12L38 12" fill="none" stroke="{ORANGE}" '
    'stroke-width="8" stroke-linejoin="miter" stroke-linecap="square"/></svg>'
)

_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

def _face(family, filename, weight_range):
    path = os.path.join(_FONT_DIR, filename)
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    return (f"@font-face{{font-family:'{family}';"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');"
            f"font-weight:{weight_range};font-style:normal;font-display:block;}}")

FONTS = _face("Space Grotesk", "SpaceGrotesk.ttf", "300 700") + \
        _face("Heebo", "Heebo.ttf", "100 900")

CSS = f"""
{FONTS}

* {{ box-sizing: border-box; margin: 0; padding: 0;
     -webkit-print-color-adjust: exact; print-color-adjust: exact; }}

html {{ font-family: 'Space Grotesk', 'Heebo', system-ui, sans-serif; }}
body {{ direction: rtl; text-align: right; color: {INK};
        font-size: 10.5pt; line-height: 1.7; background: {WHITE}; }}

@page {{ size: A4; margin: 15mm 15mm 16mm; }}
@page :first {{ margin: 0; }}

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

ul {{ list-style: none; margin: 6px 0 10px; }}
li {{ position: relative; padding-right: 16px; margin-bottom: 4px; line-height: 1.6; }}
li::before {{ content: ""; position: absolute; right: 2px; top: .62em;
              width: 5px; height: 5px; background: {ORANGE}; border-radius: 1px; }}

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

.callout {{ border: 1px solid {LINE}; border-right: 3px solid {ORANGE};
            border-radius: 8px; padding: 12px 14px; margin: 8px 0 14px; }}
.callout .price {{ font-size: 18pt; font-weight: 700; color: {ORANGE}; }}

.pb {{ break-before: page; }}
"""

def eyebrow(t): return f'<div class="eyebrow">{t}</div>'

def section(num, title, body, page_break=False):
    cls = "sec pb" if page_break else "sec"
    return (f'<div class="{cls}"><div class="sec-head">{eyebrow(title[1])}'
            f'<div class="sec-title">{num} · {title[0]}</div></div>{body}</div>')

def sub(t):  return f'<div class="sub">{t}</div>'
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

# ─── COVER ──────────────────────────────────────────────────────────────────
COVER = f"""
<div style="background:{NAVY};width:100%;min-height:297mm;position:relative;
            padding:46mm 26mm 0;overflow:hidden;">
  <div style="direction:ltr;display:flex;align-items:center;gap:12px;">
    {LOGO}<span style="font-size:26pt;font-weight:700;color:{WHITE};letter-spacing:.14em;">XSHEVA</span>
  </div>
  <div class="eyebrow" style="direction:ltr;text-align:left;margin-top:6px;">PROCESS AUTOMATION</div>

  <div style="border-top:1px solid {LINE_D};margin:26mm 0 10mm;"></div>

  <div class="eyebrow">הצעת מחיר</div>
  <div style="font-size:30pt;font-weight:700;color:{WHITE};letter-spacing:-.02em;line-height:1.15;margin:4px 0 6px;">אוטומציית פיצול תשובות<br>מרובות-בחירה</div>
  <div style="font-size:12pt;color:{MUTE_D};font-weight:400;">Google Forms → Google Sheets &nbsp;·&nbsp; פיצול שורות אוטומטי</div>

  <div style="margin-top:14mm;display:inline-block;background:{ORANGE};color:{NAVY};
              font-weight:700;font-size:17pt;padding:9px 30px;border-radius:2px;letter-spacing:.02em;">רופין האקדמית</div>

  <div style="position:absolute;bottom:24mm;right:26mm;left:26mm;direction:rtl;">
    <div style="border-top:1px solid {LINE_D};padding-top:10px;font-size:9pt;color:{MUTE};">
      <span style="float:right;">מוגש על ידי <strong style="color:{WHITE};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</span>
      <span style="float:left;direction:ltr;">אוגוסט 2026 · מסמך סודי · תוקף: 16.8.2026</span>
      <span style="display:block;clear:both;"></span>
    </div>
  </div>

  <div style="position:absolute;left:-70px;bottom:-70px;width:260px;height:260px;
              background:{ORANGE};opacity:.14;border-radius:50%;filter:blur(70px);"></div>
</div>
"""

# ─── SECTION 1 · רקע ──────────────────────────────────────────────────────────
SEC1 = section("1", ("רקע ובעיה", "המצב הקיים"),
    para("בטופס Google Forms הפעיל (\"בחירת יחידות AI להוראה בקורס שלי\") קיימת שאלת מרובת-בחירה — כל מרצה יכול לסמן מספר יחידות AI שילמדו בקורסו. כברירת מחדל, Google Forms כותב את כל הערכים שנבחרו כמחרוזת אחת מופרדת בפסיקים, בתא בודד.")
    + para("מבנה זה מונע ניתוח תקין בכלי BI (הדשבורד ב-Looker Studio שהוקם): כל שילוב ייחודי של ערכים נספר כקטגוריה נפרדת משלו, במקום שכל יחידת AI תיספר בנפרד לפי מספר הקורסים שבהם היא נלמדת בפועל.")
    + para("<strong>נדרש:</strong> שכל הגשה עתידית עם מספר ערכים תתפצל אוטומטית לשורה נפרדת לכל ערך, תוך שכפול מלא של שאר שדות ההגשה (חותמת זמן, שם קורס, מרצה, מחלקה וכו׳) — ללא צורך בהתערבות ידנית."))

# ─── SECTION 2 · הפתרון ────────────────────────────────────────────────────────
SEC2 = section("2", ("הפתרון המוצע", "ארכיטקטורה"),
    bullets([
        "<strong>סקריפט Google Apps Script</strong> המחובר ישירות לגיליון המקושר לטופס.",
        "<strong>טריגר אוטומטי (onFormSubmit)</strong> — פועל בכל הגשה חדשה בזמן אמת, ללא הפעלה ידנית וללא תלות בפתיחת הגיליון.",
        "<strong>טאב נפרד (\"Expanded\")</strong> לשורות המפוצלות — טאב תגובות הטופס הגולמי נשאר נקי ולא נגוע, ומשמש כמקור אמת/גיבוי.",
        "לכל ערך שנבחר בשאלת מרובת-הבחירה נוצרת שורה עצמאית בטאב החדש, עם שכפול מלא של שאר השדות.",
        "<strong>Backfill חד-פעמי</strong> לנתונים הקיימים כיום בטופס, כך שהטאב החדש מתחיל עם היסטוריה מלאה ומפוצלת מהיום הראשון.",
    ]))

# ─── SECTION 3 · Scope ─────────────────────────────────────────────────────────
SEC3 = section("3", ("מה כלול", "היקף העבודה"),
    table(["#", "משימה"], [
        ["1", "הקמת טאב \"Expanded\" עם מבנה עמודות תואם לטופס"],
        ["2", "כתיבת סקריפט Apps Script לפיצול ערכי מרובת-הבחירה"],
        ["3", "הגדרה והפעלה של Trigger אוטומטי (onFormSubmit)"],
        ["4", "Backfill לכלל הנתונים ההיסטוריים הקיימים כיום בטופס"],
        ["5", "בדיקת קצה-לקצה — הגשת טופס בדיקה ואימות פיצול תקין בפועל"],
    ])
    + note("<strong>לא כלול בהצעה זו:</strong> חיבור/עדכון דשבורד BI (Looker Studio וכדומה — בוצע בנפרד), טיפול בשינויים עתידיים במבנה השאלון, ואחזקה שוטפת מעבר למסירה."))

# ─── SECTION 4 · תמחור ─────────────────────────────────────────────────────────
SEC4 = section("4", ("תמחור", "השקעה"),
    page_break=True,
    body=
    '<div class="callout"><span class="price">600 ₪ + מע"מ</span>'
    '<div class="note" style="margin-top:4px;">עלות חד-פעמית, כוללת את כל 5 הסעיפים בסעיף 3 לעיל.</div></div>'
    + note("התשלום מתבצע עם מסירה ואישור תקינות (הגשת טופס בדיקה ואימות פיצול נכון בטאב Expanded). זו עסקה חד-פעמית ללא ריטיינר או תחזוקה שוטפת — כל שינוי עתידי, לרבות שינוי מבנה השאלון או הוספת שדות, יתומחר בנפרד.")
    + f'<div style="margin-top:22px;border-top:1px solid {LINE};padding-top:14px;'
      f'text-align:center;color:{MUTE};font-size:9.5pt;">בכבוד רב · '
      f'<strong style="color:{HEAD};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</div>')


def build():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "samples")
    os.makedirs(out_dir, exist_ok=True)
    html_path = "/tmp/proposal_ruppin_build.html"
    pdf_path = os.path.abspath(os.path.join(out_dir, "proposal-ruppin-unpivot-xsheva.pdf"))

    body = COVER + SEC1 + SEC2 + SEC3 + SEC4
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
