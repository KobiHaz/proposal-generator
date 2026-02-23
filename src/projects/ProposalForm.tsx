import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ProposalData } from './types';
import { Plus, Trash2 } from 'lucide-react';

interface ProposalFormProps {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ data, onChange }) => {
  const handleChange = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateSpecSection = (idx: number, updates: Partial<ProposalData['specSections'][0]>) => {
    const next = [...data.specSections];
    next[idx] = { ...next[idx], ...updates };
    handleChange('specSections', next);
  };

  const addSpecSection = () => handleChange('specSections', [...data.specSections, { title: '', items: [''] }]);
  const removeSpecSection = (idx: number) =>
    handleChange('specSections', data.specSections.filter((_, i) => i !== idx));

  const updateSpecItems = (secIdx: number, items: string[]) =>
    updateSpecSection(secIdx, { items });
  const addSpecItem = (secIdx: number) =>
    updateSpecItems(secIdx, [...data.specSections[secIdx].items, '']);
  const removeSpecItem = (secIdx: number, itemIdx: number) =>
    updateSpecItems(secIdx, data.specSections[secIdx].items.filter((_, i) => i !== itemIdx));

  const updateBasePackage = (updates: Partial<ProposalData['basePackage']>) =>
    handleChange('basePackage', { ...data.basePackage, ...updates });
  const addBaseItem = () => updateBasePackage({ items: [...data.basePackage.items, ''] });
  const removeBaseItem = (idx: number) =>
    updateBasePackage({ items: data.basePackage.items.filter((_, i) => i !== idx) });

  const updateAddOn = (idx: number, updates: Partial<ProposalData['addOns'][0]>) => {
    const next = [...data.addOns];
    next[idx] = { ...next[idx], ...updates };
    handleChange('addOns', next);
  };
  const addAddOn = () => handleChange('addOns', [...data.addOns, { title: '', items: [''] }]);
  const removeAddOn = (idx: number) => handleChange('addOns', data.addOns.filter((_, i) => i !== idx));
  const addAddOnItem = (addonIdx: number) =>
    updateAddOn(addonIdx, { items: [...data.addOns[addonIdx].items, ''] });
  const removeAddOnItem = (addonIdx: number, itemIdx: number) =>
    updateAddOn(addonIdx, { items: data.addOns[addonIdx].items.filter((_, i) => i !== itemIdx) });

  const updatePricingRow = (idx: number, updates: Partial<ProposalData['pricingRows'][0]>) => {
    const next = [...data.pricingRows];
    next[idx] = { ...next[idx], ...updates };
    handleChange('pricingRows', next);
  };
  const addPricingRow = () =>
    handleChange('pricingRows', [...data.pricingRows, { plan: '', setupCost: 0, monthlyCost: null, notes: '' }]);
  const removePricingRow = (idx: number) =>
    handleChange('pricingRows', data.pricingRows.filter((_, i) => i !== idx));

  const updateBlocker = (idx: number, value: string) => {
    const next = [...data.blockers];
    next[idx] = value;
    handleChange('blockers', next);
  };
  const addBlocker = () => handleChange('blockers', [...data.blockers, '']);
  const removeBlocker = (idx: number) =>
    handleChange('blockers', data.blockers.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>כותרת</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>תאריך</Label>
            <Input
              type="date"
              value={data.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>לכבוד</Label>
            <Input value={data.recipient} onChange={(e) => handleChange('recipient', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>מאת</Label>
            <Input value={data.sender} onChange={(e) => handleChange('sender', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>הנדון</Label>
            <Input value={data.subject} onChange={(e) => handleChange('subject', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. מבוא ורציונל</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={data.intro}
            onChange={(e) => handleChange('intro', e.target.value)}
            placeholder="טקסט המבוא..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>2. מפרט טכני</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addSpecSection} className="gap-1">
            <Plus size={14} /> הוסף סעיף
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.specSections.map((sec, secIdx) => (
            <div key={secIdx} className="p-4 rounded-md border border-slate-200 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="כותרת סעיף"
                  value={sec.title}
                  onChange={(e) => updateSpecSection(secIdx, { title: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpecSection(secIdx)}
                  className="shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {sec.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2">
                  <Input
                    placeholder="פריט"
                    value={item}
                    onChange={(e) => {
                      const n = [...sec.items];
                      n[itemIdx] = e.target.value;
                      updateSpecItems(secIdx, n);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpecItem(secIdx, itemIdx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addSpecItem(secIdx)}>
                <Plus size={14} className="ml-1" /> הוסף פריט
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. חבילת בסיס</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>כותרת חבילה</Label>
            <Input
              value={data.basePackage.title}
              onChange={(e) => updateBasePackage({ title: e.target.value })}
            />
          </div>
          {data.basePackage.items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="פריט"
                value={item}
                onChange={(e) => {
                  const n = [...data.basePackage.items];
                  n[idx] = e.target.value;
                  updateBasePackage({ items: n });
                }}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeBaseItem(idx)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addBaseItem}>
            <Plus size={14} className="ml-1" /> הוסף פריט
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>3. תוספות (Add-ons)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addAddOn} className="gap-1">
            <Plus size={14} /> הוסף תוספת
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.addOns.map((addon, addonIdx) => (
            <div key={addonIdx} className="p-4 rounded-md border border-slate-200 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="כותרת תוספת"
                  value={addon.title}
                  onChange={(e) => updateAddOn(addonIdx, { title: e.target.value })}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAddOn(addonIdx)}>
                  <Trash2 size={16} />
                </Button>
              </div>
              {addon.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2">
                  <Input
                    placeholder="פריט"
                    value={item}
                    onChange={(e) => {
                      const n = [...addon.items];
                      n[itemIdx] = e.target.value;
                      updateAddOn(addonIdx, { items: n });
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAddOnItem(addonIdx, itemIdx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addAddOnItem(addonIdx)}>
                <Plus size={14} className="ml-1" /> הוסף פריט
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>4. טבלת מחירים</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPricingRow} className="gap-1">
            <Plus size={14} /> הוסף שורה
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.pricingRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 p-3 rounded border border-slate-100">
              <div className="col-span-2 flex justify-between items-center">
                <Label className="text-xs">מסלול {idx + 1}</Label>
                <Button type="button" variant="ghost" size="icon" onClick={() => removePricingRow(idx)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <Input
                placeholder="מסלול"
                value={row.plan}
                onChange={(e) => updatePricingRow(idx, { plan: e.target.value })}
              />
              <Input
                type="number"
                placeholder="עלות הקמה (₪)"
                value={row.setupCost || ''}
                onChange={(e) =>
                  updatePricingRow(idx, { setupCost: e.target.value ? Number(e.target.value) : 0 })
                }
              />
              <Input
                type="number"
                placeholder="עלות חודשית (₪) - השאר ריק ל־-"
                value={row.monthlyCost ?? ''}
                onChange={(e) =>
                  updatePricingRow(idx, {
                    monthlyCost: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <Input
                placeholder="הערות"
                value={row.notes}
                onChange={(e) => updatePricingRow(idx, { notes: e.target.value })}
                className="col-span-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>5. דרישות תחילת עבודה (Blockers)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addBlocker} className="gap-1">
            <Plus size={14} /> הוסף
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.blockers.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="דרישה"
                value={item}
                onChange={(e) => updateBlocker(idx, e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeBlocker(idx)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הערת מע״מ</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="המחירים אינם כוללים מע״מ"
            value={data.taxNote ?? ''}
            onChange={(e) => handleChange('taxNote', e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
