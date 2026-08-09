import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [citizenId, setCitizenId] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/kyc/requests/company');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your requests');
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

  return (
    <Layout role="Company">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Company Dashboard</h2>
          <p className="text-slate-400">Request access to citizen KYC documents and verify integrity.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 md:col-span-1 h-fit border border-primary-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Request Access</h3>
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Citizen ID</label>
                <input 
                  type="text" 
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  className="w-full bg-background-dark/50 border border-border-dark rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="Enter MongoDB Citizen ID" 
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isRequesting}
                className={`w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${isRequesting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRequesting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
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
          </div>
          
          <div className="glass-panel p-6 md:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
              My Access Requests
              <span className="bg-primary-600/20 text-primary-400 text-sm py-1 px-3 rounded-full border border-primary-500/20">
                {requests.length} Total
              </span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark text-slate-400 text-sm">
                    <th className="py-3 px-4 font-medium">Citizen Name</th>
                    <th className="py-3 px-4 font-medium">Date Requested</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">No requests made yet</td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req._id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{req.citizenId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1 ${
                            req.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            req.status === 'Denied' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {req.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                            {req.status === 'Denied' && <XCircle className="w-3 h-3" />}
                            {req.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {req.status === 'Approved' ? (
                            <Link 
                              to={`/verify-integrity/${req.citizenId._id}`}
                              className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                            >
                              Verify Document
                            </Link>
                          ) : (
                            <span className="text-slate-600 text-sm italic">Waiting...</span>
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
