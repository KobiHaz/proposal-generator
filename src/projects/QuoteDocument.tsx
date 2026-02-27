import React from 'react';
import { QuoteData } from './types';
import { agreementPresets } from './presets';
import { cn } from '@/lib/utils';
import {
  Calendar, User, Building2, Check, CreditCard,
  Shield, Lock, FileSignature,
  Clock, Ban, Globe, Info, Crown
} from 'lucide-react';

interface QuoteDocumentProps {
  data: QuoteData;
  variant?: 'crm' | 'automation';
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ data, variant = 'crm' }) => {
  const preset = agreementPresets[variant];
  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-foreground shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none font-sans" dir="rtl">

      {/* Header — sharp, editorial */}
      <header className="h-16 bg-primary w-full top-0 absolute print:block flex items-center justify-between px-6 pl-[20mm] pr-[20mm]" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="bg-white/95 rounded-sm px-3 py-1.5">
            <img
              src="https://somediadigital.com/wp-content/uploads/2023/01/logo.svg"
              alt="SoMedia"
              className="h-7 object-contain print:h-7"
            />
          </div>
          <div className="w-px h-6 bg-white/20" aria-hidden />
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Calendar size={14} className="text-white/70" strokeWidth={2.5} />
            <span>נערך ונחתם: {data.date || '_________'}</span>
          </div>
        </div>
      </header>

      <div className="h-0.5 w-full bg-accent top-16 absolute" aria-hidden />

      <div className="p-[20mm] pt-[26mm] relative z-10">

        {/* Title Section */}
        <header className="text-center mb-12 relative">
          <div className="inline-block border-b-2 border-primary pb-2 mb-2">
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
              הסכם התקשרות
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium">{preset.subtitle}</p>

          <div className="absolute top-0 left-0 text-xs text-muted-foreground border border-border p-2 rounded-sm bg-secondary print:hidden">
            מסמך עבודה
          </div>
        </header>

        {/* Parties Section */}
        <div className="mb-10 bg-secondary/70 p-6 rounded-sm border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-primary" aria-hidden />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 font-bold uppercase tracking-wider">
                <Building2 size={16} className="text-primary" strokeWidth={2} />
                צד א' (הלקוח)
              </div>
              <div className="text-xl font-bold text-foreground">
                {data.clientName || '________________'}
              </div>
              <div className="text-sm text-muted-foreground">
                ח.פ./ע.מ: <span className="font-mono font-medium">{data.clientId || '________'}</span>
              </div>
            </div>

            <div className="space-y-1 md:border-r md:pr-8 md:border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 font-bold uppercase tracking-wider">
                <User size={16} className="text-primary" strokeWidth={2} />
                שם הספק
              </div>
              <div className="text-xl font-bold text-foreground">
                {data.developerName || '________________'}
              </div>
              <div className="text-sm text-muted-foreground">
                ת.ז/ח.פ: <span className="font-mono font-medium">{data.developerId || '________'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">

          <Section number="1" title={preset.section1Title} icon={<CreditCard size={16} className="text-primary/70" strokeWidth={2} />}>
            <p className="leading-relaxed text-muted-foreground">
              {preset.section1Content}
            </p>
          </Section>

          <Section number="2" title={preset.section2Title} icon={<Lock size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="grid gap-4">
              <PaymentOption
                selected={data.paymentModel === 'fixed'}
                title="אפשרות א': מחיר פרויקטלי גלובלי (Fixed Price)"
              >
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">עלות כוללת:</span>
                    <span>הלקוח ישלם סכום סופי של <span className="font-mono font-bold text-lg bg-accent/10 text-accent border border-accent/30 px-1 rounded-sm">{data.fixedPriceAmount?.toLocaleString() || '_________'}</span> ₪ + מע"מ עבור פיתוח המערכת לפי האפיון.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">אבני דרך:</span>
                    <span>תשלום מקדמה ({data.advancePaymentPercent}%) עם החתימה; תשלום בטא ({data.betaPaymentPercent}%) עם הצגת גרסת בדיקה; יתרה ({data.finalPaymentPercent}%) עם מסירת הקוד והעלאה לאוויר.</span>
                  </li>
                </ul>
              </PaymentOption>

              <PaymentOption
                selected={data.paymentModel === 'hourly'}
                title="אפשרות ב': ריטיינר שעות עבודה (Hourly Rate)"
              >
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">תעריף שעה:</span>
                    <span><span className="font-mono font-bold text-lg bg-accent/10 text-accent border border-accent/30 px-1 rounded-sm">{data.hourlyRate?.toLocaleString() || '_________'}</span> ₪ + מע"מ.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">הערכת שעות:</span>
                    <span>המערכת מוערכת בכ-<span className="font-bold">{data.estimatedHours?.toLocaleString() || '_________'}</span> שעות עבודה.</span>
                  </li>
                </ul>
              </PaymentOption>
            </div>
          </Section>

          <Section number="3" title="לוחות זמנים ושיתוף פעולה" icon={<Clock size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="bg-secondary/50 p-4 rounded-sm border border-border space-y-3">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="font-bold text-foreground min-w-28">לוחות זמנים:</span>
                <span>פיתוח המערכת מוערך בכ-<span className="font-bold">{data.timelineDays || '___'}</span> ימי עבודה מרגע העמדת כל החומרים ע"י הלקוח.</span>
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="font-bold text-foreground min-w-28">שיתוף פעולה:</span>
                <span>{data.clientObligations}</span>
              </div>
            </div>
          </Section>

          <div className="break-inside-avoid">
            <Section number="4" title="תחזוקה, תמיכה וניהול ענן" icon={<Shield size={16} className="text-primary/70" strokeWidth={2} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-4 rounded-sm border border-border">
                  <h3 className="font-bold text-foreground mb-2 border-b border-border pb-1">א. דמי ניהול תשתיות</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>ריטיינר: <span className="font-bold text-foreground">{data.monthlyRetainerAmount?.toLocaleString() || '0'} ₪</span> + מע"מ.</li>
                    <li>כולל: ניהול תשתיות ענן, ניטור וגיבויים.</li>
                  </ul>
                </div>
                <div className="bg-secondary/50 p-4 rounded-sm border border-border">
                  <h3 className="font-bold text-foreground mb-2 border-b border-border pb-1">ב. אחריות ובאגים</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>תיקון באגים חינם למשך {data.warrantyDays} יום.</li>
                    <li>תמיכה בחריגה: <span className="font-bold text-foreground">{data.supportHourlyRate?.toLocaleString() || '0'} ₪</span> לשעה.</li>
                  </ul>
                </div>
              </div>
            </Section>
          </div>

          {/* IP OWNERSHIP - SPECIALLY EMPHASIZED */}
          <Section number="5" title="קניין רוחני ובעלות" icon={<Crown size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="p-4 bg-primary/5 border-2 border-primary/30 rounded-sm">
              <p className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                <Check className="text-primary" size={20} strokeWidth={3} />
                בעלות מלאה ללקוח
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                עם פירעון מלא של כל התשלומים, <span className="font-bold underline text-foreground">הלקוח יקבל בעלות מלאה ובלעדית</span> על {preset.section5Content}
              </p>
              <p className="text-xs mt-2 text-muted-foreground italic">
                * החרגת אחריות: במידה והלקוח יבצע שינוי כלשהו בקוד עצמאית, אחריות הספק תפוג מיידית.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
            <Section number="6" title="תנאי ביטול" icon={<Ban size={16} className="text-primary/70" strokeWidth={2} />}>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-sm italic border-r-2 border-border">
                {data.cancellationTerms}
              </p>
            </Section>
            <Section number="7" title="דפדפנים והחרגות" icon={<Globe size={16} className="text-primary/70" strokeWidth={2} />}>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><span className="font-bold text-foreground">תמיכה:</span> {data.browserSupport}</li>
                <li><span className="font-bold text-foreground">לא כלול:</span> {data.exclusions}</li>
              </ul>
            </Section>
          </div>

          <Section number="8" title="הגבלת אחריות" icon={<Info size={16} className="text-primary/70" strokeWidth={2} />}>
            <p className="text-sm text-muted-foreground">
              אחריות הספק לכל נזק מוגבלת לתקרה של הסכום ששולם לו בפועל. הספק לא יהיה אחראי לנזקים עקיפים, אובדן נתונים או הפסד הכנסה.
            </p>
          </Section>

          <div className="mt-16 pt-8 border-t-2 border-border break-inside-avoid">
            <h3 className="text-center font-serif text-xl font-bold mb-12 text-accent">ולראיה באו הצדדים על החתום</h3>

            <div className="flex justify-between items-end px-12 pb-8">
              <div className="text-center">
                <FileSignature className="mx-auto mb-2 text-border" size={40} strokeWidth={1} />
                <div className="w-64 border-b-2 border-foreground mb-3 h-12" />
                <div className="font-bold text-foreground">חתימת הספק</div>
              </div>
              <div className="text-center">
                <FileSignature className="mx-auto mb-2 text-border" size={40} strokeWidth={1} />
                <div className="w-64 border-b-2 border-foreground mb-3 h-12" />
                <div className="font-bold text-foreground">חתימת הלקוח</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="h-1.5 bg-primary w-full bottom-0 absolute print:block" aria-hidden />
    </div>
  );
};

const Section: React.FC<{ number: string; title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ number, title, children, icon }) => (
  <section className="relative">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif shrink-0 text-xs">
        {number}
      </div>
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        {title}
        {icon}
      </h2>
    </div>
    <div className="pr-8 text-muted-foreground h-full border-r-2 border-border mr-3">
      {children}
    </div>
  </section>
);

const PaymentOption: React.FC<{ selected: boolean; title: string; children: React.ReactNode }> = ({ selected, title, children }) => (
  <div className={cn(
    "relative p-4 rounded-sm border-2 flex flex-col gap-2 transition-colors",
    selected ? "border-primary bg-white" : "border-border bg-secondary/30 opacity-60 overflow-hidden"
  )}>
    {selected && (
      <div className="absolute top-2 left-2 text-primary">
        <Check size={18} strokeWidth={3} />
      </div>
    )}
    <h3 className={cn("font-bold text-sm", selected ? "text-foreground" : "text-muted-foreground")}>
      {title}
    </h3>
    <div className={selected ? "block" : "hidden"}>
      {children}
    </div>
    {!selected && <div className="text-xs text-muted-foreground">(לא נבחר)</div>}
  </div>
);
