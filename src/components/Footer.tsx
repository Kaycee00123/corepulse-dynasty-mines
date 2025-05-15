
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTwitter, 
  faDiscord 
} from '@fortawesome/free-brands-svg-icons';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();

  return (
    <footer className="bg-white border-t border-gray-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="mb-3 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="text-base font-bold text-core">CorePulse</span>
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">
              Mining Simulation DApp
            </p>
          </div>
          
          {isMobile ? (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Link to="/about" className="text-gray-500 hover:text-core">About</Link>
              <Link to="/terms" className="text-gray-500 hover:text-core">Terms</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-core">Privacy</Link>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-core">
                <FontAwesomeIcon icon={faTwitter} className="mr-1" />Twitter
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-core">
                <FontAwesomeIcon icon={faDiscord} className="mr-1" />Discord
              </a>
            </div>
          ) : (
            <div className="flex space-x-4 md:order-2">
              <Link to="/about" className="text-xs text-gray-500 hover:text-core">About</Link>
              <Link to="/terms" className="text-xs text-gray-500 hover:text-core">Terms</Link>
              <Link to="/privacy" className="text-xs text-gray-500 hover:text-core">Privacy</Link>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-core">
                <FontAwesomeIcon icon={faTwitter} className="mr-1" />Twitter
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-core">
                <FontAwesomeIcon icon={faDiscord} className="mr-1" />Discord
              </a>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          &copy; {currentYear} CorePulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
