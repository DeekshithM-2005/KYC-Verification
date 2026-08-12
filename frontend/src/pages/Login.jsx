import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Eye, EyeOff, ArrowRight, Shield, Database, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;
      
      login(userData);
      navigate(getDashboardRoute(userData.role));
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.request) {
        // Network error — backend is not reachable
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <Shield className="w-5 h-5" />, title: 'Zero-Knowledge Security', desc: 'Your data stays encrypted and under your control.' },
    { icon: <Database className="w-5 h-5" />, title: 'IPFS Decentralized Storage', desc: 'Documents stored on a distributed network.' },
    { icon: <Lock className="w-5 h-5" />, title: 'AES-256 Encryption', desc: 'Military-grade encryption before upload.' },
  ];

  return (
    <Layout role="Guest">
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
        <div className="flex w-full max-w-4xl animate-slide-up">
          
          {/* Left Panel — Feature Highlights */}
          <div className="hidden lg:flex flex-col justify-center w-[380px] p-10 glass-panel rounded-r-none border-r-0 relative overflow-hidden">
            {/* Decorative gradient orb */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-cyan-500/15 to-primary-500/15 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-gradient mb-2">Secure Identity</h2>
              <p className="text-slate-500 text-sm mb-10">Blockchain-powered verification for the modern world.</p>
              
              <div className="space-y-6">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-4 group" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/10 flex items-center justify-center text-primary-400 shrink-0 group-hover:border-primary-500/30 transition-colors">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-0.5">{f.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative chain links */}
              <div className="mt-10 flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel — Login Form */}
          <div className="glass-panel-glow p-10 w-full max-w-md lg:rounded-l-none flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Sign in to your decentralized identity portal</p>
            </div>
            
            {error && (
              <div className="bg-red-500/[0.08] border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2 animate-fade-in">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                <input 
                  id="login-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                <div className="relative">
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pr-11"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary text-white mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
