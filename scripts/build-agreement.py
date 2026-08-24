"""
Generic engagement-agreement (הסכם התקשרות) template, XSHEVA-branded.

This is a LEGAL TERMS document only — no pricing, no project-specific scope.
Money, work plan and timelines live in a separately-signed quote/appendix
that this agreement references; the agreement never repeats numbers that
belong there. Reusable as-is across any client/project.

Usage: edit the PROJECT dict below for the new client, then run.

xsheva design system (canonical — claude.ai design 019ded08…):
  - Accent  : Orange #FF6B35  (the ONLY chromatic color; blue is legacy)
  - Surface : Navy   #101622  (header bar)
  - Body    : light mode (white) — print collateral is light per the system
  - Type    : Space Grotesk (only typeface), via Google Fonts
  - Logo    : staircase glyph, orange · wordmark XSHEVA (always all-caps)
  - Rules   : no emoji, no exclamation marks, architecture vocabulary

Pipeline:
    python3 build-agreement.py
        → /tmp/agreement_build.html      (self-contained)
        → Chrome --headless --print-to-pdf
        → ../public/samples/agreement-<client-slug>.pdf
"""

import base64
import os
import re
import subprocess

# ─── EDIT PER PROJECT ──────────────────────────────────────────────────────
PROJECT = {
    "date": "08/07/2026",
    "client_name": "",
    "client_id": "",
    "supplier_name": "XSHEVA",
    "supplier_id": "",

    # Categorical only (e.g. "פיתוח ואוטומציה") — never a specific project name
    "service_category": "שירותי פיתוח, אוטומציה וייעוץ טכנולוגי",

    # Section 4 — קניין רוחני (legal description of what transfers, not price)
    "ip_ownership_desc": "כלל התוצרים, הקוד והתסריטים שפותחו במסגרת השירותים",

    # Section 6 — אחריות (bug-fix warranty window, a general policy — not a price)
    "warranty_days": 30,

    # Section 5 — סודיות ואי-תחרות
    "confidentiality_years": 3,
    "noncompete_months": 12,

    # Section 10 — דין חל וסמכות שיפוט
    "governing_law_city": "תל אביב-יפו",

    "contact_email": "kobi@xsheva.com",
}

# ─── xsheva tokens ───────────────────────────────────────────────────────
ORANGE   = "#FF6B35"
NAVY     = "#101622"
INK      = "#1A2230"
HEAD     = "#101622"
MUTE     = "#66707F"
MUTE_D   = "#9AA6B8"
LINE     = "#E4E7EC"
WHITE    = "#FFFFFF"

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

LOGO = (
    '<svg viewBox="0 0 48 48" width="24" height="24" '
    'style="vertical-align:middle;">'
    f'<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="{ORANGE}"/></svg>'
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

.header-bar {{ background: {NAVY}; padding: 10px 20px; display: flex;
               justify-content: space-between; align-items: center; }}
.header-bar .date {{ color: {MUTE_D}; font-size: 9pt; direction: ltr; }}
.header-bar .brand {{ display: flex; align-items: center; gap: 8px; direction: ltr; }}
.header-bar .brand span {{ color: {WHITE}; font-weight: 700; font-size: 12pt; letter-spacing: .1em; }}
.accent-line {{ height: 3px; background: {ORANGE}; }}

.doc-title {{ text-align: center; margin: 22px 0 20px; }}
.doc-title h1 {{ font-size: 24pt; font-weight: 700; letter-spacing: -.01em; color: {HEAD}; }}
.doc-title .sub {{ color: {MUTE}; font-size: 11pt; margin-top: 4px; }}
.doc-badge {{ display: inline-block; margin-top: 8px; border: 1px solid {LINE};
              border-radius: 2px; padding: 2px 10px; font-size: 8pt; color: {MUTE}; }}

.parties {{ display: table; width: 100%; border: 1px solid {LINE}; border-radius: 8px;
            margin: 0 0 22px; border-spacing: 0; overflow: hidden; }}
.party {{ display: table-cell; width: 50%; padding: 14px 18px; vertical-align: top; }}
.party + .party {{ border-right: 1px solid {LINE}; }}
.party .k {{ font-size: 8pt; font-weight: 700; color: {MUTE}; text-transform: uppercase;
             letter-spacing: .1em; margin-bottom: 6px; }}
.party .name {{ font-size: 13pt; font-weight: 700; color: {HEAD}; }}
.party .id {{ font-size: 9pt; color: {MUTE}; margin-top: 2px; }}

.appendix-note {{ border: 1px solid {LINE}; border-right: 3px solid {ORANGE}; border-radius: 8px;
                   padding: 10px 14px; margin: 0 0 22px; font-size: 9.5pt; color: {INK}; }}

.sec {{ margin: 0 0 16px; break-inside: avoid; }}
.sec-head {{ display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }}
.sec-num {{ width: 22px; height: 22px; background: {NAVY}; color: {WHITE};
            border-radius: 2px; font-size: 10pt; font-weight: 700;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.sec-title {{ font-size: 12pt; font-weight: 700; color: {HEAD}; }}
.sec-body {{ padding-right: 32px; border-right: 2px solid {LINE}; margin-right: 11px; }}
.sec-body p {{ margin-bottom: 6px; color: {INK}; text-align: justify; }}

.callout {{ border: 1px solid {LINE}; border-right: 3px solid {ORANGE}; border-radius: 8px;
            padding: 12px 14px; margin: 6px 0; }}
.callout .lead {{ font-weight: 700; color: {ORANGE}; font-size: 10.5pt; margin-bottom: 4px; }}

.sig-block {{ margin-top: 28px; padding-top: 16px; border-top: 1px solid {LINE}; break-inside: avoid; }}
.sig-block h3 {{ text-align: center; font-size: 12pt; color: {HEAD}; margin-bottom: 26px; }}
.sig-row {{ display: table; width: 100%; }}
.sig-col {{ display: table-cell; width: 50%; text-align: center; padding: 0 20px; }}
.sig-line {{ border-bottom: 1.5px solid {HEAD}; height: 40px; margin-bottom: 6px; }}
.sig-col .label {{ font-weight: 700; color: {HEAD}; font-size: 9.5pt; }}
.sig-col .meta {{ color: {MUTE}; font-size: 8pt; margin-top: 2px; }}
"""

# ─── helpers ─────────────────────────────────────────────────────────────
def section(num, title, body):
    return (f'<div class="sec"><div class="sec-head"><div class="sec-num">{num}</div>'
            f'<div class="sec-title">{title}</div></div>'
            f'<div class="sec-body">{body}</div></div>')

def para(t): return f'<p>{t}</p>'

def slugify(name):
    slug = re.sub(r"[^\w\-]+", "-", name.strip()).strip("-")
    return slug or "מסמך"


def build_html(p):
    header = (
        f'<div class="header-bar"><div class="date">{p["date"]}</div>'
        f'<div class="brand">{LOGO}<span>XSHEVA</span></div></div>'
        f'<div class="accent-line"></div>'
    )

    title = (
        '<div class="doc-title"><h1>הסכם התקשרות</h1>'
        f'<div class="sub">{p["service_category"]}</div>'
        '<div class="doc-badge">מסמך עבודה</div></div>'
    )

    parties = (
        '<div class="parties">'
        '<div class="party"><div class="k">צד א׳ (הלקוח)</div>'
        f'<div class="name">{p["client_name"] or "________________"}</div>'
        f'<div class="id">ח.פ./ע.מ: {p["client_id"] or "________"}</div></div>'
        '<div class="party"><div class="k">שם הספק</div>'
        f'<div class="name">{p["supplier_name"]}</div>'
        f'<div class="id">ח.פ.: {p["supplier_id"] or "________"}</div></div>'
        '</div>'
    )

    appendix_note = (
        '<div class="appendix-note">היקף העבודה, לוחות הזמנים, התמורה ותנאי התשלום '
        'לפרויקט הספציפי נשוא הסכם זה מפורטים במלואם בהצעת המחיר ו/או נספח העבודה '
        'החתום על ידי הצדדים (להלן: "הנספח"), המצורף ומהווה חלק בלתי נפרד מהסכם זה.</div>'
    )

    sec1 = section("1", "מהות ההתקשרות",
        para(f'הספק יעניק ללקוח {p["service_category"]} (להלן: "השירותים"), '
             'בהיקף, במפרט ובלוחות הזמנים המפורטים בנספח.')
        + para('בכל מקרה של סתירה בין הוראה כללית בהסכם זה לבין פרט ספציפי בנספח, '
               'יגבר האמור בנספח, אלא אם נקבע אחרת במפורש.')
    )

    sec2 = section("2", "תמורה ותנאי תשלום",
        para('התמורה בעד השירותים, מבנה התשלומים ואבני הדרך ייקבעו במלואם בנספח. '
             'כלל הסכומים הנקובים בנספח אינם כוללים מע"מ, אלא אם צוין אחרת במפורש.')
        + para('איחור בתשלום מעבר ל-14 ימים ממועד החיוב המוסכם יזכה את הספק בהשעיית '
               'מתן השירותים עד להסדרת החוב, וזאת מבלי לגרוע מכל סעד אחר העומד לספק על פי דין.')
    )

    sec3 = section("3", "לוחות זמנים ושיתוף פעולה",
        para('לוחות הזמנים לביצוע השירותים ייקבעו בנספח, ומותנים בעמידת הלקוח בהתחייבויותיו להלן.')
        + para('הלקוח מתחייב להעמיד לרשות הספק את כל המידע, הגישות והחומרים הנדרשים לביצוע '
               'השירותים בתוך פרק הזמן שיוסכם בין הצדדים. עיכוב מצד הלקוח בהעמדת האמור ידחה '
               'בהתאמה את לוחות הזמנים, ולא ייחשב כהפרת הסכם זה על ידי הספק.')
    )

    sec4 = section("4", "קניין רוחני ובעלות",
        '<div class="callout"><div class="lead">בעלות מלאה ללקוח</div>'
        f'<p>עם פירעון מלא של כל התשלומים בעד השירותים, יקבל הלקוח בעלות מלאה ובלעדית על '
        f'{p["ip_ownership_desc"]}. הספק מוותר על כל זכות קניינית בתוצרים אלה לאחר מסירתם '
        'הסופית וקבלת מלוא התשלום, למעט שימוש בספריות קוד פתוח או ברכיבי מדף קיימים, '
        'אשר יוסיפו לחול עליהם תנאי הרישיון החל עליהם.</p>'
        '<div class="note" style="color:#66707F;font-size:8.5pt;margin-top:6px;">* במידה '
        'והלקוח יבצע שינוי כלשהו בתוצרים באופן עצמאי, תפוג אחריות הספק לגביהם באופן מיידי.</div>'
        '</div>'
    )

    sec5 = section("5", "סודיות ואי-תחרות",
        para('כל צד מתחייב לשמור בסודיות מוחלטת כל מידע עסקי, טכני, מסחרי או אחר שהגיע '
             'לידיעתו מהצד השני אגב ביצוע הסכם זה, ולא לעשות בו כל שימוש שלא לצורך מילוי '
             'התחייבויותיו על פי הסכם זה.')
        + para(f'התחייבות הסודיות תעמוד בתוקפה גם לאחר סיום ההתקשרות, למשך '
               f'{p["confidentiality_years"]} שנים לפחות ממועד סיומה.')
        + para('הספק מתחייב שלא לעשות שימוש במידע שנחשף אליו אגב מתן השירותים לצורך פיתוח '
               f'מוצר או שירות מתחרה עבור צד שלישי, כל עוד הסכם זה בתוקף ולמשך '
               f'{p["noncompete_months"]} חודשים נוספים לאחר סיומו.')
    )

    sec6 = section("6", "אחריות, תחזוקה ותמיכה",
        para(f'למשך {p["warranty_days"]} יום ממועד מסירת השירותים, יתקן הספק ללא עלות נוספת '
             'כל תקלה הנובעת מפגם בעבודתו, ובלבד שהלקוח לא ביצע שינוי עצמאי בתוצרים.')
        + para('תחזוקה שוטפת ותמיכה מעבר לתקופת האחריות — ככל שיוסכמו בין הצדדים — יוסדרו '
               'בנספח נפרד או בעדכון לנספח העבודה, לרבות תנאיהם המסחריים.')
    )

    sec7 = section("7", "תנאי ביטול",
        para('כל צד רשאי לבטל הסכם זה בהודעה בכתב מראש, בהתאם לתנאים שייקבעו בנספח.')
        + para('במקרה של ביטול ביוזמת הלקוח, ישלם הלקוח לספק בעד כל השירותים שבוצעו בפועל '
               'עד למועד הביטול. תשלומים ששולמו מראש בעד שירותים שטרם סופקו לא יוחזרו, '
               'אלא אם הוסכם אחרת במפורש בנספח.')
    )

    sec8 = section("8", "הגבלת אחריות",
        para('אחריות הספק לכל נזק, מכל מין וסוג שהוא, הנובע מהסכם זה או קשור אליו, לא תעלה '
             'על סך התמורה ששולמה לו בפועל על פי הסכם זה.')
        + para('הספק לא יהיה אחראי בשום מקרה לנזק עקיף, תוצאתי, אובדן רווחים, אובדן מידע '
               'או פגיעה במוניטין, אף אם נמסרה לו הודעה מראש על אפשרות להתרחשותם.')
    )

    sec9 = section("9", "כוח עליון",
        para('אף אחד מהצדדים לא יהיה אחראי לאי-קיום או לעיכוב בקיום התחייבות על פי הסכם זה, '
             'ככל שהדבר נגרם כתוצאה מנסיבות שאינן בשליטתו הסבירה, לרבות ומבלי לגרוע: אסון '
             'טבע, מלחמה, מגפה, פעולות איבה, שביתה, וכן תקלה מהותית בתשתית או בשירותי צד '
             'שלישי (לרבות שירותי ענן, אירוח או תקשורת) — "כוח עליון".')
        + para('הצד הנפגע מכוח עליון יפעל באופן סביר להקטנת הנזק, ויחדש את קיום התחייבויותיו '
               'מיד עם חלוף הנסיבות המונעות זאת.')
    )

    sec10 = section("10", "דין חל וסמכות שיפוט",
        para('על הסכם זה יחולו דיני מדינת ישראל בלבד, וסמכות השיפוט הבלעדית בכל עניין '
             f'הנוגע להסכם זה ולביצועו תהא נתונה לבתי המשפט המוסמכים במחוז '
             f'{p["governing_law_city"]} בלבד.')
    )

    sec11 = section("11", "הוראות כלליות",
        para('הסכם זה, על נספחיו, מהווה את ההסכמה המלאה בין הצדדים בעניינים הנדונים בו, '
             'ומבטל כל הסכם, הבנה או מצג קודמים בעניינים אלה, בין בכתב ובין בעל פה.')
        + para('שינוי או תוספת להוראות הסכם זה יהיו תקפים אך ורק אם נעשו בכתב ונחתמו על ידי '
               'שני הצדדים.')
        + para('נמצא סעיף מסעיפי הסכם זה בלתי חוקי, בטל או בלתי ניתן לאכיפה, לא יפגע הדבר '
               'בתוקפם או באכיפתם של יתר סעיפי ההסכם.')
        + para('אין בהסכם זה כדי להתיר לצד להמחות את זכויותיו או את חובותיו לפיו לצד שלישי, '
               'ללא הסכמה מראש ובכתב של הצד השני, למעט המחאה לתאגיד קשור לאותו צד.')
        + para('כל הודעה בין הצדדים תינתן בכתב לכתובת הדוא"ל המפורטת בהסכם זה, ותיחשב '
               'כמתקבלת בתום יום עסקים אחד ממועד משלוחה.')
    )

    signatures = (
        '<div class="sig-block"><h3>ולראיה באו הצדדים על החתום</h3>'
        '<div class="sig-row">'
        f'<div class="sig-col"><div class="sig-line"></div>'
        f'<div class="label">חתימת הספק</div><div class="meta">{p["supplier_name"]} · {p["contact_email"]}</div></div>'
        f'<div class="sig-col"><div class="sig-line"></div>'
        f'<div class="label">חתימת הלקוח</div><div class="meta">{p["client_name"] or "________________"}</div></div>'
        '</div></div>'
    )

    body = (header + '<div style="padding:22px 20px 0;">' + title + parties + appendix_note
            + sec1 + sec2 + sec3 + sec4 + sec5 + sec6 + sec7 + sec8 + sec9 + sec10 + sec11
            + signatures + '</div>')

    return f'<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><style>{CSS}</style></head><body>{body}</body></html>'


def build():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "samples")
    os.makedirs(out_dir, exist_ok=True)
    html_path = "/tmp/agreement_build.html"
    slug = slugify(PROJECT["client_name"] or "agreement")
    pdf_path = os.path.abspath(os.path.join(out_dir, f"agreement-{slug}.pdf"))

    html = build_html(PROJECT)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML: {len(html) // 1024} KB → {html_path}")

    if not os.path.exists(CHROME):
        print(f"Chrome not found at {CHROME} — open the HTML and print to PDF manually.")
        return

    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=15000", "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}", f"file://{html_path}",
    ], capture_output=True, text=True)

    if os.path.exists(pdf_path):
        print(f"{pdf_path} ({os.path.getsize(pdf_path) // 1024} KB)")
    else:
        print("Chrome print failed.")


if __name__ == "__main__":
    build()
