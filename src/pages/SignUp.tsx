
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(email, username, password, referralCode);
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Unable to create account. Please try again.');
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
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-core hover:text-core-dark">
                Sign in
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
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
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 input-core"
                  placeholder="Username"
                />
              </div>
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 input-core"
                  placeholder="Password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 input-core"
                  placeholder="Confirm Password"
                />
              </div>
              <div>
                <Label htmlFor="referral-code" className="block text-sm font-medium text-gray-700">
                  Referral Code (optional)
                </Label>
                <Input
                  id="referral-code"
                  name="referral-code"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="mt-1 input-core"
                  placeholder="Enter referral code"
                />
              </div>
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
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-core hover:text-core-dark">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-core hover:text-core-dark">
                Privacy Policy
              </Link>.
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignUp;
