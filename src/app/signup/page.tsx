'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password.length < 6) {
      toast({
          variant: 'destructive',
          title: 'Password too short',
          description: 'Password must be at least 6 characters long.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Set the user's display name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      // Send the verification email
      await sendEmailVerification(user);

      toast({
        title: "Verification Link Sent",
        description: "Please check your email to verify your account.",
      });

      // Redirect to the verify-email page. The AuthManager will handle logic from there.
      router.push('/verify-email');
    } catch (err: any) {
       let errorMessage = 'An unexpected error occurred.';
        if (err.code) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email address is already in use.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'The password is too weak.';
                    break;
                default:
                    errorMessage = err.message;
            }
        }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h1 className="text-white text-xl font-bold">Create Account</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-[3rem] p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium pl-1">
                  First Name
                </label>
                <input
                  name="firstName"
                  className="glass-input w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder="John"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium pl-1">
                  Last Name
                </label>
                <input
                  name="lastName"
                  className="glass-input w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder="Doe"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium pl-1">
                Email
              </label>
              <input
                name="email"
                className="glass-input w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="hello@example.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium pl-1">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  className="glass-input w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder="••••••••"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              className="mt-2 w-full bg-white text-primary font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
      <div className="pb-10 px-6 flex flex-col items-center gap-6 shrink-0">
        <Link
          className="text-lavender-muted text-sm font-medium hover:text-white transition-colors"
          href="/login"
        >
          Already have an account?{' '}
          <span className="font-bold underline underline-offset-4">
            Log In
          </span>
        </Link>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}
