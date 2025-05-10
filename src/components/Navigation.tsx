
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faXmark, 
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navigation() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation items with paths and visibility conditions
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', auth: true },
    { name: 'NFTs', path: '/nfts', auth: true },
    { name: 'Referrals', path: '/referrals', auth: true },
    { name: 'Leaderboard', path: '/leaderboard', auth: true },
    { name: 'Crews', path: '/crews', auth: true },
  ];

  // Filter items based on auth state
  const filteredNavItems = navItems.filter(
    item => (item.auth && isAuthenticated) || (!item.auth)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-core">CorePulse</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-core text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center">
                <p className="mr-4 text-sm text-gray-700">
                  <span className="font-medium">
                    {user?.username || 'User'}
                  </span>
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback className="bg-core text-white">
                          {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    {user?.username === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Link to="/signin">
                  <Button variant="outline" className="btn-outline">Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button className="btn-primary">Sign up</Button>
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-core hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <FontAwesomeIcon icon={faXmark} className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faBars} className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-core text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-core text-white">
                      {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.username || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email || ''}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                {user?.username === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 space-y-2">
                <Link
                  to="/signin"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-center text-gray-700 border border-gray-300 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-center text-white bg-core hover:bg-core-dark"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
