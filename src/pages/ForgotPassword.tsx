
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Unable to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Reset your password</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address, and we'll send you a link to reset your password.
            </p>
          </div>
          
          {isSubmitted ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Check your email
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      We've sent a password reset link to {email}. Click the link in the email to reset your password.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link to="/signin" className="px-2 py-1.5 rounded-md text-sm font-medium text-core hover:text-core-dark">
                        Back to sign in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 input-core"
                  placeholder="Email address"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full btn-primary py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </div>

              <div className="text-sm text-center">
                <Link to="/signin" className="font-medium text-core hover:text-core-dark">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword;
