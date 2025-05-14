
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import NFTs from '@/pages/NFTs';
import Crews from '@/pages/Crews';
import Referrals from '@/pages/Referrals';
import Leaderboard from '@/pages/Leaderboard';
import NotFound from '@/pages/NotFound';
import Admin from '@/pages/Admin';
import { useAuth } from '@/contexts/AuthContext';
import Profile from './pages/Profile';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/nfts" element={<NFTs />} />
      <Route path="/crews" element={<Crews />} />
      <Route path="/referrals" element={<Referrals />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
