import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Send, Clock, CheckCircle, XCircle, FileSearch, Inbox, Sparkles, Zap } from 'lucide-react';
import { CompanyDashboardSkeleton } from '../components/common/SkeletonLoader';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [citizenId, setCitizenId] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/kyc/requests/company');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [user._id]);

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return toast.error('Citizen ID is required');

    setIsRequesting(true);
    try {
      await api.post('/kyc/request-access', { citizenId });
      toast.success('Access requested successfully! Transaction sent to blockchain.');
      setCitizenId('');
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to request access');
    } finally {
      setIsRequesting(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const deniedCount = requests.filter(r => r.status === 'Denied').length;

  if (isLoading) {
    return (
      <Layout role="Company">
        <CompanyDashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout role="Company">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>Company Dashboard</h2>
            <Sparkles className="w-5 h-5 text-accent-400 animate-pulse-glow" />
          </div>
          <p style={{ color: 'var(--theme-text-muted)' }}>Request access to citizen KYC documents and verify integrity.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Pending</p>
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Approved</p>
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{approvedCount}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Denied</p>
                <div className="w-8 h-8 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-400">{deniedCount}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {/* Request Access Form */}
          <div className="glass-panel-glow p-6 rounded-2xl md:col-span-1 h-fit relative overflow-hidden group/form">
            {/* Pulsing border glow on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/form:opacity-100 transition-opacity duration-700" style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.1) inset' }} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>Request Access</h3>
                <Zap className="w-4 h-4 text-accent-400" />
              </div>
              <p className="text-xs mb-5" style={{ color: 'var(--theme-text-muted)' }}>Submit a blockchain-verified access request</p>

              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>Citizen ID</label>
                  <input 
                    id="company-citizen-id"
                    type="text" 
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    className="input-premium" 
                    placeholder="Enter MongoDB Citizen ID" 
                    required
                  />
                </div>
                <button 
                  id="company-submit-request"
                  type="submit"
                  disabled={isRequesting}
                  className={`btn-primary text-white ${isRequesting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRequesting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>

              {/* Hint */}
              <div className="mt-5 p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-faint)' }}>
                  💡 The citizen will receive your request and can approve or deny access to their KYC document via the blockchain.
                </p>
              </div>
            </div>
          </div>
          
          {/* Requests Table */}
          <div className="glass-panel p-6 rounded-2xl md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between" style={{ color: 'var(--theme-text)' }}>
              My Access Requests
              <span className="bg-primary-500/[0.08] text-primary-400 text-xs font-semibold py-1 px-3 rounded-full border border-primary-500/20">
                {requests.length} Total
              </span>
            </h3>
            
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    <th className="py-3 px-4 font-semibold">Citizen Name</th>
                    <th className="py-3 px-4 font-semibold">Date Requested</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center" style={{ color: 'var(--theme-text-faint)' }}>
                        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No requests made yet
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req._id} className="transition-all duration-200 group" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-input-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td className="py-4 px-4 font-medium text-sm" style={{ color: 'var(--theme-text)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-accent-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {req.citizenId?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex w-fit items-center gap-1.5 ${
                            req.status === 'Approved' ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20' : 
                            req.status === 'Denied' ? 'bg-red-500/[0.08] text-red-400 border-red-500/20' : 
                            'bg-yellow-500/[0.08] text-yellow-400 border-yellow-500/20'
                          }`}>
                            {req.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                            {req.status === 'Denied' && <XCircle className="w-3 h-3" />}
                            {req.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {req.status === 'Approved' ? (
                            <Link 
                              to={`/verify-integrity/${req.citizenId._id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5"
                            >
                              <FileSearch className="w-3.5 h-3.5" /> Verify Document
                            </Link>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>Waiting...</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
