
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="text-lg font-bold text-core">CorePulse</span>
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Mining Simulation DApp
            </p>
          </div>
          <div className="flex space-x-6 md:order-2">
            <Link to="/about" className="text-gray-500 hover:text-core">
              About
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-core">
              Terms
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-core">
              Privacy
            </Link>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-core">
              Twitter
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-core">
              Discord
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          &copy; {currentYear} CorePulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
