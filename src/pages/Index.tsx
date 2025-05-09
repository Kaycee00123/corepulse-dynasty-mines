
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-white py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                  <span className="block">Mine Virtual Tokens</span>
                  <span className="block text-core">With CorePulse</span>
                </h1>
                <p className="mt-4 text-lg text-gray-500">
                  CorePulse is a mining simulation DApp where you can earn virtual tokens,
                  collect NFTs to boost your mining power, and compete on the leaderboards.
                </p>
                <div className="mt-8 sm:flex">
                  {isAuthenticated ? (
                    <div className="rounded-md shadow">
                      <Link to="/dashboard">
                        <Button className="w-full btn-primary px-8 py-4 text-lg">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md shadow">
                        <Link to="/signup">
                          <Button className="w-full btn-primary px-8 py-4 text-lg">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link to="/signin">
                          <Button variant="outline" className="w-full btn-outline px-8 py-4 text-lg">
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="aspect-w-5 aspect-h-3">
                  <img
                    className="rounded-lg shadow-xl h-64 w-full object-cover sm:h-80 lg:h-96"
                    src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5"
                    alt="Mining visualization"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                CorePulse Features
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
                Experience the future of mining simulation with our innovative platform.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-md bg-core flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Real-Time Mining</h3>
                <p className="mt-2 text-gray-500">
                  Mine virtual tokens in real-time and watch your balance grow while you're logged in.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-md bg-core flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">NFT Collection</h3>
                <p className="mt-2 text-gray-500">
                  Mint unique NFTs that boost your mining rate and showcase your achievements.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-md bg-core flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Crew System</h3>
                <p className="mt-2 text-gray-500">
                  Create or join mining crews to collaborate with other miners and earn crew bonuses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-core">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to start mining?</span>
              <span className="block text-white opacity-80">Join CorePulse today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  <Button className="bg-white text-core hover:bg-gray-100 px-6 py-3">
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
