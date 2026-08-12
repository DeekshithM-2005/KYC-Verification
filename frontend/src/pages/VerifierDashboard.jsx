import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, ShieldCheck, CheckCircle, Clock, Users, Activity, FileSearch, Sparkles } from 'lucide-react';
import { VerifierDashboardSkeleton } from '../components/common/SkeletonLoader';

const VerifierDashboard = () => {
  const [citizens, setCitizens] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('citizens');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCitizens = async () => {
    try {
      const res = await api.get('/kyc/citizens');
      setCitizens(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load citizens');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/kyc/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCitizens(), fetchAuditLogs()]);
      setIsLoading(false);
    };
    loadData();
    const interval = setInterval(() => {
      fetchCitizens();
      fetchAuditLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const citizenName = log.citizenId?.name?.toLowerCase() || '';
    const companyName = log.companyId?.name?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return citizenName.includes(q) || companyName.includes(q);
  });

  const uploadedCount = citizens.filter(c => c.hasUploaded).length;
  const pendingCount = citizens.filter(c => !c.hasUploaded).length;

  const tabs = [
    { key: 'citizens', label: 'Citizens Overview', icon: <Users className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit Trail', icon: <Activity className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <Layout role="Verifier">
        <VerifierDashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout role="Verifier">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>Verifier Dashboard</h2>
            <Sparkles className="w-5 h-5 text-primary-400 animate-pulse-glow" />
          </div>
          <p style={{ color: 'var(--theme-text-muted)' }}>Review KYC submissions and monitor decentralized access logs.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Total Citizens</p>
                <div className="w-8 h-8 rounded-lg bg-primary-400/10 text-primary-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>{citizens.length}</p>
            </div>
            {/* Bottom accent strip */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Documents Uploaded</p>
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{uploadedCount}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Pending Upload</p>
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-500/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl p-1 w-fit animate-slide-up" style={{ animationDelay: '150ms', backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-2.5 px-5 font-medium text-sm rounded-lg transition-all duration-200 relative ${
                activeTab === tab.key
                  ? 'shadow-sm'
                  : ''
              }`}
              style={activeTab === tab.key 
                ? { backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } 
                : { color: 'var(--theme-text-muted)' }
              }
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        
        {/* Tab Content: Citizens */}
        {activeTab === 'citizens' && (
          <div className="glass-panel p-6 rounded-2xl animate-fade-in">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>Citizens KYC Status</h3>
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    <th className="py-3 px-4 font-semibold">Citizen Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Wallet Address</th>
                    <th className="py-3 px-4 font-semibold">KYC Document</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {citizens.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center" style={{ color: 'var(--theme-text-faint)' }}>
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No citizens registered
                      </td>
                    </tr>
                  ) : (
                    citizens.map(c => (
                      <tr key={c._id} className="transition-all duration-200 group" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-input-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td className="py-4 px-4 font-medium text-sm" style={{ color: 'var(--theme-text)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-primary-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {c.name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{c.email}</td>
                        <td className="py-4 px-4 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex w-fit items-center gap-1.5 ${
                            c.hasUploaded ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20' : 
                            'bg-yellow-500/[0.08] text-yellow-400 border-yellow-500/20'
                          }`}>
                            {c.hasUploaded ? <CheckCircle className="w-3 h-3" /> : <><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /><Clock className="w-3 h-3" /></>}
                            {c.hasUploaded ? 'Uploaded' : 'Pending Upload'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {c.hasUploaded && (
                            <Link 
                              to={`/verify-integrity/${c._id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500 hover:text-white hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 group/btn"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 group-hover/btn:animate-pulse" /> Run Verification
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="glass-panel p-6 rounded-2xl animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>Access Audit Trail</h3>
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name..."
                  className="input-premium pl-10 py-2.5 text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Company</th>
                    <th className="py-3 px-4 font-semibold">Citizen Accessed</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center" style={{ color: 'var(--theme-text-faint)' }}>
                        <FileSearch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log._id} className="transition-all duration-200 group" style={{ borderBottom: '1px solid var(--theme-border-subtle)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-input-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td className="py-4 px-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{new Date(log.accessedAt).toLocaleString()}</td>
                        <td className="py-4 px-4 font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{log.companyId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{log.citizenId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                            log.success ? 'bg-emerald-500/[0.08] text-emerald-400' : 'bg-red-500/[0.08] text-red-400'
                          }`}>
                            {log.success ? <CheckCircle className="w-3 h-3" /> : '✕'}
                            {log.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifierDashboard;
