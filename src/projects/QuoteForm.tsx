import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { QuoteData } from './types';

interface QuoteFormProps {
    data: QuoteData;
    onChange: (data: QuoteData) => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ data, onChange }) => {
    const handleChange = <K extends keyof QuoteData>(field: K, value: QuoteData[K]) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 text-right" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle>פרטי הסכם</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>תאריך</Label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>שם המפתח</Label>
                            <Input
                                value={data.developerName}
                                onChange={(e) => handleChange('developerName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ת.ז/ח.פ מפתח</Label>
                            <Input
                                value={data.developerId}
                                onChange={(e) => handleChange('developerId', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>שם הלקוח</Label>
                            <Input
                                value={data.clientName}
                                onChange={(e) => handleChange('clientName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ח.פ/ע.מ לקוח</Label>
                            <Input
                                value={data.clientId}
                                onChange={(e) => handleChange('clientId', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>מודל תשלום</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup
                        value={data.paymentModel}
                        onValueChange={(val) => handleChange('paymentModel', val as 'fixed' | 'hourly')}
                        className="flex flex-col gap-3"
                        dir="rtl"
                    >
                        <div className="flex items-center gap-2 w-full justify-start">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className="cursor-pointer">מחיר פרויקטלי (Fixed)</Label>
                        </div>
                        <div className="flex items-center gap-2 w-full justify-start">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly" className="cursor-pointer">לפי שעה (Hourly)</Label>
                        </div>
                    </RadioGroup>

                    {data.paymentModel === 'fixed' && (
                        <div className="space-y-4 mt-4 p-4 bg-secondary/20 rounded-md">
                            <div className="space-y-2">
                                <Label>מחיר גלובלי (ללא מע"מ)</Label>
                                <Input
                                    type="number"
                                    value={data.fixedPriceAmount || ''}
                                    onChange={(e) => handleChange('fixedPriceAmount', Number(e.target.value))}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label>מקדמה (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.advancePaymentPercent}
                                        onChange={(e) => handleChange('advancePaymentPercent', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>בטא (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.betaPaymentPercent}
                                        onChange={(e) => handleChange('betaPaymentPercent', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>סיום (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.finalPaymentPercent}
                                        onChange={(e) => handleChange('finalPaymentPercent', Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {data.paymentModel === 'hourly' && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-secondary/20 rounded-md">
                            <div className="space-y-2">
                                <Label>תעריף שעתי</Label>
                                <Input
                                    type="number"
                                    value={data.hourlyRate || ''}
                                    onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>צפי שעות</Label>
                                <Input
                                    type="number"
                                    value={data.estimatedHours || ''}
                                    onChange={(e) => handleChange('estimatedHours', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>תחזוקה ושירות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>ריטיינר חודשי</Label>
                            <Input
                                type="number"
                                value={data.monthlyRetainerAmount || ''}
                                onChange={(e) => handleChange('monthlyRetainerAmount', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>תעריף תמיכה</Label>
                            <Input
                                type="number"
                                value={data.supportHourlyRate || ''}
                                onChange={(e) => handleChange('supportHourlyRate', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ימי אחריות</Label>
                            <Input
                                type="number"
                                value={data.warrantyDays}
                                onChange={(e) => handleChange('warrantyDays', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>תנאים נוספים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>לוחות זמנים (ימי עבודה)</Label>
                        <Input
                            type="number"
                            value={data.timelineDays}
                            onChange={(e) => handleChange('timelineDays', Number(e.target.value))}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
