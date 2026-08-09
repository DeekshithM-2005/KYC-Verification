import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, Key, ShieldCheck, User, Building, Wallet, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

const Layout = ({ children, role = 'Guest' }) => {
  const location = useLocation();
  const { address, isConnecting, networkError, connectWallet, disconnectWallet } = useWallet();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectWallet();
    window.location.href = '/login';
  };

  const navLinks = {
    Citizen: [
      { name: 'Dashboard', path: '/citizen-dashboard', icon: <Home className="w-5 h-5" /> },
    ],
    Verifier: [
      { name: 'Dashboard', path: '/verifier-dashboard', icon: <ShieldCheck className="w-5 h-5" /> },
    ],
    Company: [
      { name: 'Dashboard', path: '/company-dashboard', icon: <Building className="w-5 h-5" /> },
    ]
  };

  const links = navLinks[role] || [];

  return (
    <div className="flex h-screen bg-background-dark text-slate-100 font-sans">
      
      {/* Sidebar */}
      {role !== 'Guest' && (
        <aside className="w-64 glass-panel border-y-0 border-l-0 rounded-none flex flex-col justify-between">
          <div>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Decentral KYC
              </h1>
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider mt-1 block">
                {role} Portal
              </span>
            </div>

            <nav className="px-4 mt-6 space-y-2">
              {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                        : 'text-slate-400 hover:bg-surface-hover hover:text-slate-200'
                    }`}
                  >
                    {link.icon}
                    <span className="font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {networkError && (
          <div className="bg-red-500/90 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50">
            <AlertTriangle className="w-4 h-4" />
            {networkError}
          </div>
        )}

        {/* Navbar */}
        <header className="h-16 glass-panel border-x-0 border-t-0 rounded-none flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {role === 'Guest' && (
              <h1 className="text-xl font-bold text-white">Decentralized KYC Platform</h1>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
               <div className="flex items-center gap-2 bg-primary-600/10 text-primary-400 px-4 py-2 rounded-full border border-primary-500/20 text-sm font-medium">
                 <Wallet className="w-4 h-4" />
                 {address.slice(0, 6)}...{address.slice(-4)}
               </div>
            ) : (
               <button 
                 onClick={connectWallet}
                 disabled={isConnecting}
                 className="flex items-center gap-2 bg-surface-hover hover:bg-slate-600 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
               >
                 <Wallet className="w-4 h-4" />
                 {isConnecting ? 'Connecting...' : 'Connect Wallet'}
               </button>
            )}

            {role !== 'Guest' ? (
              <div className="flex items-center gap-3 bg-surface-dark px-4 py-2 rounded-full border border-border-dark shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400">
                  {role === 'Citizen' ? <User className="w-4 h-4" /> : role === 'Company' ? <Building className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium text-slate-200">
                  <span className="text-primary-400">{role}</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition-colors">Create Account</Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          {children}
        </main>
      </div>

    </div>
  );
};

export default Layout;
