import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Citizen',
    walletAddress: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const validatePasswordStrength = (password) => {
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const validateWalletAddress = (address) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
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

    // Validations
    const pwdError = validatePasswordStrength(formData.password);
    if (pwdError) return setError(pwdError);

    const walletError = validateWalletAddress(formData.walletAddress);
    if (walletError) return setError(walletError);

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      const userData = response.data;
      
      login(userData);
      
      // Redirect based on role
      navigate(getDashboardRoute(userData.role));
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        // Handle express-validator errors array
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="Guest">
      <div className="flex items-center justify-center h-full py-8">
        <div className="glass-panel p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-white text-center">Create Account</h2>
          <p className="text-slate-400 text-center mb-8">Join the decentralized KYC network</p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                placeholder="John Doe" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                placeholder="you@example.com" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Citizen">Citizen</option>
                <option value="Verifier">Verifier</option>
                <option value="Company">Company</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ethereum Wallet Address</label>
              <input 
                type="text" 
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                placeholder="0x..." 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                placeholder="••••••••" 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-lg transition-colors mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
