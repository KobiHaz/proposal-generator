import React from 'react';
import { QuoteData } from './types';
import { cn } from '@/lib/utils';
import {
    Calendar, User, Building2, Check, CreditCard,
    Shield, Lock, FileSignature, AlertCircle,
    Clock, Ban, Globe, Info, Handshake, Crown
} from 'lucide-react';

interface QuoteDocumentProps {
    data: QuoteData;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ data }) => {
    return (
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-800 shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none" dir="rtl">

            {/* Decorative Header Bar */}
            <div className="h-4 bg-gradient-to-l from-slate-900 to-slate-700 w-full top-0 absolute print:block" />

            <div className="p-[20mm] pt-[25mm] relative z-10">

                {/* Title Section */}
                <header className="text-center mb-12 relative">
                    <div className="inline-block border-b-2 border-slate-900 pb-2 mb-2">
                        <h1 className="text-3xl font-serif font-black text-slate-900 tracking-wide">
                            הסכם התקשרות
                        </h1>
                    </div>
                    <p className="text-lg text-slate-600 font-medium">לאספקת שירותי פיתוח ותחזוקת תוכנה</p>

                    <div className="absolute top-0 left-0 text-xs text-slate-400 border border-slate-200 p-2 rounded bg-slate-50 print:hidden">
                        מסמך עבודה
                    </div>

                    <div className="mt-6 flex justify-center items-center gap-2 text-sm text-slate-500 bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                        <Calendar size={14} />
                        <span>נערך ונחתם ביום:</span>
                        <span className="font-bold text-slate-900 px-2 min-w-[80px] inline-block text-center border-b border-slate-300 border-dashed">
                            {data.date || '_________'}
                        </span>
                    </div>
                </header>

                {/* Parties Section */}
                <div className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-slate-800" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2 font-bold uppercase tracking-wider">
                                <Building2 size={16} />
                                צד א' (הלקוח)
                            </div>
                            <div className="text-xl font-bold text-slate-800">
                                {data.clientName || '________________'}
                            </div>
                            <div className="text-sm text-slate-600">
                                ח.פ./ע.מ: <span className="font-mono">{data.clientId || '________'}</span>
                            </div>
                        </div>

                        <div className="space-y-1 md:border-r md:pr-8 md:border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2 font-bold uppercase tracking-wider">
                                <User size={16} />
                                צד ב' (המפתח)
                            </div>
                            <div className="text-xl font-bold text-slate-800">
                                {data.developerName || '________________'}
                            </div>
                            <div className="text-sm text-slate-600">
                                ת.ז/ח.פ: <span className="font-mono">{data.developerId || '________'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">

                    <Section number="1" title="מהות השירות" icon={<CreditCard size={18} />}>
                        <p className="leading-relaxed">
                            המפתח יפתח עבור הלקוח מערכת CRM/אפליקציה (להלן: "המערכת") המבוססת על טכנולוגיית ענן ושירותי צד ג', בהתאם למסמך האפיון המפורט המצורף כנספח ב'.
                        </p>
                    </Section>

                    <Section number="2" title="שלב ההקמה (Development Phase)" icon={<Lock size={18} />}>
                        <div className="grid gap-4">
                            <PaymentOption
                                selected={data.paymentModel === 'fixed'}
                                title="אפשרות א': מחיר פרויקטלי גלובלי (Fixed Price)"
                            >
                                <ul className="space-y-2 text-sm">
                                    <li className="flex gap-2">
                                        <span className="font-bold min-w-24">עלות כוללת:</span>
                                        <span>הלקוח ישלם סכום סופי של <span className="font-mono font-bold text-lg bg-yellow-100 px-1 mx-1 rounded">{data.fixedPriceAmount?.toLocaleString() || '_________'}</span> ₪ + מע"מ עבור פיתוח המערכת לפי האפיון.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold min-w-24">אבני דרך:</span>
                                        <span className="text-slate-600">תשלום מקדמה ({data.advancePaymentPercent}%) עם החתימה; תשלום בטא ({data.betaPaymentPercent}%) עם הצגת גרסת בדיקה; יתרה ({data.finalPaymentPercent}%) עם מסירת הקוד והעלאה לאוויר.</span>
                                    </li>
                                </ul>
                            </PaymentOption>

                            <PaymentOption
                                selected={data.paymentModel === 'hourly'}
                                title="אפשרות ב': ריטיינר שעות עבודה (Hourly Rate)"
                            >
                                <ul className="space-y-2 text-sm">
                                    <li className="flex gap-2">
                                        <span className="font-bold min-w-24">תעריף שעה:</span>
                                        <span><span className="font-mono font-bold text-lg bg-yellow-100 px-1 mx-1 rounded">{data.hourlyRate?.toLocaleString() || '_________'}</span> ₪ + מע"מ.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold min-w-24">הערכת שעות:</span>
                                        <span>המערכת מוערכת בכ-<span className="font-bold">{data.estimatedHours?.toLocaleString() || '_________'}</span> שעות עבודה.</span>
                                    </li>
                                </ul>
                            </PaymentOption>
                        </div>
                    </Section>

                    <Section number="3" title="לוחות זמנים ושיתוף פעולה" icon={<Clock size={18} />}>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                            <div className="flex gap-2 text-sm">
                                <span className="font-bold underline min-w-28">לוחות זמנים:</span>
                                <span>פיתוח המערכת מוערך בכ-<span className="font-bold">{data.timelineDays || '___'}</span> ימי עבודה מרגע העמדת כל החומרים ע"י הלקוח.</span>
                            </div>
                            <div className="flex gap-2 text-sm">
                                <span className="font-bold underline min-w-28">שיתוף פעולה:</span>
                                <span>{data.clientObligations}</span>
                            </div>
                        </div>
                    </Section>

                    <div className="break-inside-avoid">
                        <Section number="4" title="תחזוקה, תמיכה וניהול ענן" icon={<Shield size={18} />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">א. דמי ניהול תשתיות</h3>
                                    <ul className="space-y-1 text-sm text-slate-600">
                                        <li>ריטיינר: <span className="font-bold text-slate-900">{data.monthlyRetainerAmount?.toLocaleString() || '0'} ₪</span> + מע"מ.</li>
                                        <li>כולל: ניהול תשתיות ענן, ניטור וגיבויים.</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">ב. אחריות ובאגים</h3>
                                    <ul className="space-y-1 text-sm text-slate-600">
                                        <li>תיקון באגים חינם למשך {data.warrantyDays} יום.</li>
                                        <li>תמיכה בחריגה: <span className="font-bold text-slate-900">{data.supportHourlyRate?.toLocaleString() || '0'} ₪</span> לשעה.</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* IP OWNERSHIP - SPECIALLY EMPHASIZED */}
                    <Section number="5" title="קניין רוחני ובעלות" icon={<Crown size={18} />}>
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900">
                            <p className="font-bold text-lg mb-2 flex items-center gap-2">
                                <Check className="text-emerald-600" size={20} strokeWidth={3} />
                                בעלות מלאה ללקוח
                            </p>
                            <p className="text-sm leading-relaxed">
                                עם פירעון מלא של כל התשלומים, <span className="font-bold underline text-emerald-950">הלקוח יקבל בעלות מלאה ובלעדית</span> על קוד המקור של המערכת. המפתח מוותר על כל זכות קניינית במערכת לאחר מסירתה הסופית וקבלת התשלום, למעט שימוש בספריות קוד פתוח או רכיבי מדף קיימים.
                            </p>
                            <p className="text-xs mt-2 text-emerald-700 italic">
                                * החרגת אחריות: במידה והלקוח יבצע שינוי כלשהו בקוד עצמאית, אחריות המפתח תפוג מיידית.
                            </p>
                        </div>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
                        <Section number="6" title="תנאי ביטול" icon={<Ban size={18} />}>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded italic border-r-2 border-slate-400">
                                {data.cancellationTerms}
                            </p>
                        </Section>
                        <Section number="7" title="דפדפנים והחרגות" icon={<Globe size={18} />}>
                            <ul className="text-sm space-y-1 text-slate-700">
                                <li><span className="font-bold text-slate-500">תמיכה:</span> {data.browserSupport}</li>
                                <li><span className="font-bold text-slate-500">לא כלול:</span> {data.exclusions}</li>
                            </ul>
                        </Section>
                    </div>

                    <Section number="8" title="הגבלת אחריות" icon={<Info size={18} />}>
                        <p className="text-sm text-slate-600">
                            אחריות המפתח לכל נזק מוגבלת לתקרה של הסכום ששולם לו בפועל. המפתח לא יהיה אחראי לנזקים עקיפים, אובדן נתונים או הפסד הכנסה.
                        </p>
                    </Section>

                    <div className="mt-16 pt-8 border-t border-slate-200 break-inside-avoid">
                        <h3 className="text-center font-serif text-xl font-bold mb-12 text-slate-800">ולראיה באו הצדדים על החתום</h3>

                        <div className="flex justify-between items-end px-12 pb-8">
                            <div className="text-center">
                                <FileSignature className="mx-auto mb-2 text-slate-200" size={40} strokeWidth={1} />
                                <div className="w-64 border-b-2 border-slate-800 mb-3 h-12"></div>
                                <div className="font-bold text-slate-800">חתימת המפתח</div>
                            </div>
                            <div className="text-center">
                                <FileSignature className="mx-auto mb-2 text-slate-200" size={40} strokeWidth={1} />
                                <div className="w-64 border-b-2 border-slate-800 mb-3 h-12"></div>
                                <div className="font-bold text-slate-800">חתימת הלקוח</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="h-2 bg-slate-900 w-full bottom-0 absolute print:block" />
        </div>
    );
};

const Section: React.FC<{ number: string; title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ number, title, children, icon }) => (
    <section className="relative">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold font-serif shrink-0 text-xs">
                {number}
            </div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {title}
                {icon && <span className="text-slate-400 opacity-60">{icon}</span>}
            </h2>
        </div>
        <div className="pr-10 text-slate-700 h-full border-r border-slate-100 mr-3">
            {children}
        </div>
    </section>
);

const PaymentOption: React.FC<{ selected: boolean; title: string; children: React.ReactNode }> = ({ selected, title, children }) => (
    <div className={cn(
        "relative p-4 rounded-lg border flex flex-col gap-2 transition-all",
        selected ? "border-slate-400 bg-white shadow-sm" : "border-slate-100 bg-slate-50 opacity-50 overflow-hidden"
    )}>
        {selected && (
            <div className="absolute top-2 left-2 text-slate-800">
                <Check size={18} strokeWidth={3} />
            </div>
        )}
        <h3 className={cn("font-bold text-sm", selected ? "text-slate-900" : "text-slate-500")}>
            {title}
        </h3>
        <div className={selected ? "block" : "hidden"}>
            {children}
        </div>
        {!selected && <div className="text-xs text-slate-400">(לא נבחר)</div>}
    </div>
);
