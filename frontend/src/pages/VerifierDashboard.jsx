import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Filter, ShieldCheck, XCircle, CheckCircle, Clock } from 'lucide-react';

const VerifierDashboard = () => {
  const [citizens, setCitizens] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('citizens'); // 'citizens' or 'audit'
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchCitizens();
    fetchAuditLogs();
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

  return (
    <Layout role="Verifier">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Verifier Dashboard</h2>
          <p className="text-slate-400">Review KYC submissions and monitor decentralized access logs.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-border-dark">
          <button
            onClick={() => setActiveTab('citizens')}
            className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'citizens' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Citizens Overview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'audit' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            System Audit Logs
          </button>
        </div>
        
        {/* Tab Content: Citizens */}
        {activeTab === 'citizens' && (
          <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Citizens KYC Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark text-slate-400 text-sm">
                    <th className="py-3 px-4 font-medium">Citizen Name</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Wallet Address</th>
                    <th className="py-3 px-4 font-medium">KYC Document</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {citizens.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">No citizens registered</td>
                    </tr>
                  ) : (
                    citizens.map(c => (
                      <tr key={c._id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{c.name}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{c.email}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm font-mono">{c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1 ${
                            c.hasUploaded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {c.hasUploaded ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {c.hasUploaded ? 'Uploaded' : 'Pending Upload'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {c.hasUploaded && (
                            <Link 
                              to={`/verify-integrity/${c._id}`}
                              className="bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-4 h-4" /> Run Verification
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
          <div className="glass-panel p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-xl font-semibold text-white">Access Audit Trail</h3>
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name..."
                  className="w-full bg-background-dark/50 border border-border-dark rounded-full pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark text-slate-400 text-sm">
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Company</th>
                    <th className="py-3 px-4 font-medium">Citizen Accessed</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">No audit logs found</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log._id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="py-4 px-4 text-slate-400 text-sm">{new Date(log.accessedAt).toLocaleString()}</td>
                        <td className="py-4 px-4 text-white font-medium">{log.companyId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-slate-300">{log.citizenId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
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
