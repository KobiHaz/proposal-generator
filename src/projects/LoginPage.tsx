import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'אימייל או סיסמה שגויים',
  'auth/invalid-email': 'כתובת אימייל לא תקינה',
  'auth/weak-password': 'הסיסמה חלשה מדי – צריך לפחות 6 תווים',
  'auth/email-already-in-use': 'כתובת האימייל כבר רשומה במערכת',
  'auth/user-disabled': 'המשתמש הושבת',
  'auth/too-many-requests': 'יותר מדי ניסיונות – נסה שוב מאוחר יותר',
  'auth/operation-not-allowed': 'הפעולה אינה מותרת',
};

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string') {
    const code = (error as { code: string }).code;
    return FIREBASE_ERROR_MESSAGES[code] ?? 'אירעה שגיאה. נסה שוב.';
  }
  return 'אירעה שגיאה. נסה שוב.';
}

type FormMode = 'sign-in' | 'sign-up';

export function LoginPage() {
  const [mode, setMode] = useState<FormMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'sign-up') {
      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: FormMode) => {
    setMode(m);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row gap-2 p-4 border-b">
          <button
            type="button"
            onClick={() => switchMode('sign-in')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'sign-in'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => switchMode('sign-up')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              mode === 'sign-up'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            הרשמה
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'sign-up' ? 6 : undefined}
              />
            </div>
            {mode === 'sign-up' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive font-medium" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {mode === 'sign-in' ? 'התחבר' : 'הרשם'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
