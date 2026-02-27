import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  'auth/operation-not-allowed': 'אימייל/סיסמה לא מופעל ב-Firebase Console. הפעל ב-Authentication → Sign-in method',
};

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string') {
    const code = (error as { code: string }).code;
    return FIREBASE_ERROR_MESSAGES[code] ?? `שגיאה: ${code}. נסה שוב.`;
  }
  const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '';
  return msg ? `שגיאה: ${msg}` : 'אירעה שגיאה. נסה שוב.';
}

export function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (showSignUp) {
      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (showSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-md border-border overflow-hidden">
        <div className="h-1 bg-primary" aria-hidden />
        <CardContent className="p-8 pt-8">
          <h2 className="text-xl font-semibold text-primary mb-6 text-center">
            {showSignUp ? 'צור משתמש חדש (פעם אחת)' : 'התחברות'}
          </h2>
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
                autoComplete={showSignUp ? 'new-password' : 'current-password'}
                required
                minLength={showSignUp ? 6 : undefined}
              />
            </div>
            {showSignUp && (
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
            <Button type="submit" disabled={submitting} className="w-full mt-1">
              {showSignUp ? 'צור משתמש' : 'התחבר'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
