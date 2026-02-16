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
