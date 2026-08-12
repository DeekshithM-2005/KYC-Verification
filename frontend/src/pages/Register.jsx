import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import api from '../api/axios';
import { Eye, EyeOff, ArrowRight, User, ShieldCheck, Building, Wallet } from 'lucide-react';

const roles = [
  { value: 'Citizen', icon: <User className="w-5 h-5" />, desc: 'Submit and manage your identity documents' },
  { value: 'Verifier', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Verify citizen identities on the blockchain' },
  { value: 'Company', icon: <Building className="w-5 h-5" />, desc: 'Request access to verified KYC data' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Citizen',
    walletAddress: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, getDashboardRoute } = useAuth();
  const { address, connectWallet } = useWallet();
  const navigate = useNavigate();

  // Auto-fill wallet address from MetaMask
  useEffect(() => {
    if (address) {
      setFormData(prev => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  const validatePasswordStrength = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const validateWalletAddress = (addr) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      return 'Please enter a valid Ethereum wallet address.';
    }
    return null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePasswordStrength(formData.password);
    if (pwdError) return setError(pwdError);

    const walletError = validateWalletAddress(formData.walletAddress);
    if (walletError) return setError(walletError);

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      const userData = response.data;
      
      login(userData);
      navigate(getDashboardRoute(userData.role));
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="Guest">
      <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-8">
        <div className="glass-panel-glow p-10 w-full max-w-lg animate-slide-up">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-500 text-sm">Join the decentralized KYC network</p>
          </div>
          
          {error && (
            <div className="bg-red-500/[0.08] border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2 animate-fade-in">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role Selection — Animated Cards */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.value })}
                    className={`relative p-3 rounded-xl border text-center transition-all duration-300 group ${
                      formData.role === r.value
                        ? 'bg-primary-500/[0.08] border-primary-500/30 shadow-lg shadow-primary-500/5'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                      formData.role === r.value
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-white/[0.04] text-slate-500 group-hover:text-slate-300'
                    }`}>
                      {r.icon}
                    </div>
                    <p className={`text-xs font-semibold transition-colors ${
                      formData.role === r.value ? 'text-primary-300' : 'text-slate-400'
                    }`}>{r.value}</p>
                    {/* Active indicator dot */}
                    {formData.role === r.value && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500 border-2 border-background-dark shadow-lg shadow-primary-500/50" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2 text-center">
                {roles.find(r => r.value === formData.role)?.desc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                <input 
                  id="register-name"
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-premium" 
                  placeholder="John Doe" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                <input 
                  id="register-email"
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-premium" 
                  placeholder="you@example.com" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Ethereum Wallet Address</label>
              <div className="relative">
                <input 
                  id="register-wallet"
                  type="text" 
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleChange}
                  className="input-premium pr-28" 
                  placeholder="0x..." 
                  required 
                />
                {!address && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
                  >
                    <Wallet className="w-3 h-3" />
                    Auto-fill
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input 
                  id="register-password"
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-premium pr-11" 
                  placeholder="Min. 6 characters" 
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
              id="register-submit"
              type="submit" 
              disabled={loading}
              className="btn-primary text-white mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
