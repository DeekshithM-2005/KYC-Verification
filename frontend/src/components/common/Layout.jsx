import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, ShieldCheck, Building, Wallet, AlertTriangle, X, Fingerprint, Sun, Moon } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const Layout = ({ children, role = 'Guest' }) => {
  const location = useLocation();
  const { address, isConnecting, networkError, connectWallet, disconnectWallet } = useWallet();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNetworkError, setShowNetworkError] = useState(true);

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
    <div className="flex h-screen text-slate-100" style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: 'var(--theme-bg)' }}>
      
      {/* Sidebar */}
      {role !== 'Guest' && (
        <aside className="w-72 border-r flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', backdropFilter: 'blur(20px)' }}>
          {/* Sidebar subtle glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gradient-brand">Decentral KYC</h1>
                </div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] ml-12 block" style={{ color: 'var(--theme-text-muted)' }}>
                {role} Portal
              </span>
            </div>

            <div className="px-4 mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--theme-text-faint)' }}>Navigation</p>
              <nav className="space-y-1">
                {links.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/10 border border-primary-500/20 shadow-sm' 
                          : 'hover:bg-white/[0.04]'
                      }`}
                      style={isActive ? { color: 'var(--theme-text)' } : { color: 'var(--theme-text-secondary)' }}
                    >
                      <span className={`transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {link.icon}
                      </span>
                      <span className="font-medium text-sm">{link.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-4 relative z-10">
            {/* Wallet info in sidebar */}
            {address && (
              <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-faint)' }}>Connected Wallet</p>
                <p className="text-xs font-mono text-primary-400">{address.slice(0, 6)}...{address.slice(-4)}</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/[0.06] rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Network Error Banner */}
        {networkError && showNetworkError && (
          <div className="bg-gradient-to-r from-red-500/90 to-orange-500/90 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium z-50 backdrop-blur-sm rounded-b-xl mx-4">
            <AlertTriangle className="w-4 h-4" />
            {networkError}
            <button onClick={() => setShowNetworkError(false)} className="ml-4 hover:bg-white/20 rounded-full p-0.5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navbar */}
        <header className="h-16 border-b flex items-center justify-between px-8 z-10 shrink-0" style={{ backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.8)', borderColor: 'var(--theme-border)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            {role === 'Guest' && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Fingerprint className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gradient-brand">Decentralized KYC Platform</h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? 'Switch to Cream theme' : 'Switch to Dark theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {address ? (
               <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/20 text-sm font-medium bg-primary-500/[0.06] backdrop-blur-sm">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                 <Wallet className="w-3.5 h-3.5 text-primary-400" />
                 <span className="text-primary-300 font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
               </div>
            ) : (
               <button 
                 onClick={connectWallet}
                 disabled={isConnecting}
                 className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border hover:border-primary-500/30 hover:bg-primary-500/[0.06]"
                 style={{ backgroundColor: 'var(--theme-input-bg)', borderColor: 'var(--theme-input-border)', color: 'var(--theme-text-secondary)' }}
               >
                 <Wallet className="w-4 h-4" />
                 {isConnecting ? 'Connecting...' : 'Connect Wallet'}
               </button>
            )}

            {role !== 'Guest' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-input-bg)' }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${role === 'Citizen' ? 'bg-emerald-500/20 text-emerald-400' : 
                    role === 'Company' ? 'bg-accent-500/20 text-accent-400' : 
                    'bg-primary-500/20 text-primary-400'}`}>
                  {role[0]}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{role}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium transition-colors px-4 py-2" style={{ color: 'var(--theme-text-secondary)' }}>Sign In</Link>
                <Link to="/register" className="text-sm font-semibold text-white px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-0.5">Create Account</Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          {/* Animated background orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/[0.04] rounded-full blur-[120px] -z-10 pointer-events-none animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-500/[0.03] rounded-full blur-[100px] -z-10 pointer-events-none animate-float-slow" style={{ animationDelay: '-5s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-500/[0.02] rounded-full blur-[80px] -z-10 pointer-events-none animate-float-slow" style={{ animationDelay: '-10s' }} />
          
          {children}
        </main>
      </div>

    </div>
  );
};

export default Layout;
