import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './projects/LoginPage';
import { MyProposalsPage } from './projects/MyProposalsPage';

function AuthenticatedContent() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="print:hidden border-b border-border bg-secondary/30">
        <header
          className="flex justify-between items-center px-6 py-3"
          dir="rtl"
        >
          <h1 className="text-xl font-semibold text-primary">מערכת הצעות והסכמים</h1>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors duration-200"
          >
            התנתק
          </button>
        </header>
      </div>
      <MyProposalsPage />
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        טוען...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedContent />;
}

export default App;
