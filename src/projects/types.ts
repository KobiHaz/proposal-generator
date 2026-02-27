export interface ProposalData {
  date: string;
  recipient: string;
  sender: string;
  subject: string;
  intro: string;
  specSections: Array<{ title: string; items: string[] }>;
  basePackage: { title: string; items: string[] };
  addOns: Array<{
    title: string;
    items: string[];
  }>;
  pricingRows: Array<{
    plan: string;
    setupCost: number;
    monthlyCost: number | null;
    notes: string;
  }>;
  blockers: string[];
  taxNote: string;
}

export const defaultProposalData: ProposalData = {
  date: new Date().toISOString().split('T')[0],
  recipient: '',
  sender: '',
  subject: '',
  intro: '',
  specSections: [{ title: '', items: [''] }],
  basePackage: { title: 'חבילת בסיס', items: [''] },
  addOns: [{ title: '', items: [''] }],
  pricingRows: [{ plan: '', setupCost: 0, monthlyCost: null, notes: '' }],
  blockers: [''],
  taxNote: 'המחירים אינם כוללים מע״מ',
};

export interface QuoteData {
  date: string; // YYYY-MM-DD
  clientName: string;
  clientId: string; // H.P / T.Z
  developerName: string;
  developerId: string; // H.P / T.Z

  // Payment Model
  paymentModel: 'fixed' | 'hourly';

  // Fixed Price Details
  fixedPriceAmount: number;
  advancePaymentPercent: number;
  betaPaymentPercent: number;
  finalPaymentPercent: number;

  // Hourly Rate Details
  hourlyRate: number;
  estimatedHours: number;

  // Maintenance
  monthlyRetainerAmount: number;

  // Support
  supportHourlyRate: number;
  warrantyDays: number;

  // Advanced Terms
  timelineDays: number;
  cancellationTerms: string;
  clientObligations: string;
  browserSupport: string;
  exclusions: string;
}
