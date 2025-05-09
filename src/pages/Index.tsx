
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-white py-5 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
              <div className="lg:col-span-7">
                <h1 className="font-bold tracking-tight text-gray-900 text-3xl sm:text-4xl mb-2">
                  <span className="block">Mine Web3 Rewards</span>
                  <span className="block text-core">with CorePulse</span>
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl">
                  Connect your wallet and start mining $CORE tokens. Boost your earnings with NFTs, referrals, and daily streak bonuses.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:gap-3 gap-2">
                  <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                    <Button className="w-full bg-core hover:bg-core-dark py-2">
                      Create a Free Mining Account
                    </Button>
                  </Link>
                  <Link to="/about" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full btn-outline py-2">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mt-8 lg:mt-0 lg:col-span-5">
                <div className="aspect-w-1 aspect-h-1 flex items-center justify-center">
                  <div className="bg-orange-100 rounded-full w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                    <div className="bg-orange-200 rounded-full w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                      <div className="bg-core rounded-full w-12 h-12 md:w-16 md:h-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-center text-sm text-gray-600 mb-8">
              Start mining $CORE tokens in three simple steps, without needing any technical knowledge required!
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Step 1 */}
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-core font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Create an Account</h3>
                <p className="text-sm text-gray-600">
                  Create a free mining account with CorePulse to start earning rewards
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-core font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Start Mining</h3>
                <p className="text-sm text-gray-600">
                  Click the start button and begin mining $CORE tokens while you're logged in
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-core font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Mint NFT Boosts</h3>
                <p className="text-sm text-gray-600">
                  Upgrade your mining speed by purchasing NFT boosts with your earned $CORE
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Link to="/dashboard">
                <Button className="bg-core hover:bg-core-dark">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-8 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-2xl font-bold mb-8">Features</h2>
            <p className="text-center text-sm text-gray-600 mb-8">
              CorePulse brings next-generation Web3 mining to your browser!
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* Feature 1 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v14m-5 0V5m10 4v10M5 9v10" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Effortless Mining</h3>
                  <p className="text-sm text-gray-600">
                    Mine $CORE tokens without any technical setup or expensive hardware
                  </p>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Secure Platform</h3>
                  <p className="text-sm text-gray-600">
                    Built with secure authentication and data protection protocols
                  </p>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Gamified Experience</h3>
                  <p className="text-sm text-gray-600">
                    Earn rewards and compete with others in a fun mining environment
                  </p>
                </div>
              </div>
              
              {/* Feature 4 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Performance Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Monitor your mining performance with real-time analytics
                  </p>
                </div>
              </div>
              
              {/* Feature 5 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Competitive Leaderboard</h3>
                  <p className="text-sm text-gray-600">
                    Compete with other miners and earn additional rewards
                  </p>
                </div>
              </div>
              
              {/* Feature 6 */}
              <div className="p-4 flex">
                <div className="mr-4">
                  <div className="bg-orange-100 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-core" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Mine in Crews</h3>
                  <p className="text-sm text-gray-600">
                    Team up with other miners to multiply your mining rewards
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 bg-core">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Start Mining?</h2>
            <p className="text-sm text-white opacity-90 mb-6 max-w-xl mx-auto">
              Join thousands of other miners earning $CORE tokens. Sign up in seconds, completely free.
            </p>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button className="bg-white text-core hover:bg-gray-100">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
