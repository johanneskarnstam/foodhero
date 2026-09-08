import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LandingPage() {
    const { signInWithGoogle } = useAuth();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t('landing.welcome', 'Welcome to FoodHero')}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {t('landing.subtitle', 'Smart meal planning & grocery lists')}
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={signInWithGoogle}
                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-lg font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <LogIn className="w-6 h-6" />
                        <span>{t('landing.signIn', 'Sign in with Google')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
