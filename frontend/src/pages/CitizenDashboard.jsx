import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle, Clock, XCircle, FileText, Shield, Users, Copy, Sparkles } from 'lucide-react';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

const CitizenDashboard = () => {
  const { user } = useAuth();
  
  // Fixed: These state declarations were missing and causing runtime crashes
  const [status, setStatus] = useState('Checking...');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusRes, reqsRes] = await Promise.all([
        api.get(`/kyc/status/${user._id}`),
        api.get(`/kyc/requests/citizen`)
      ]);
      
      if (statusRes.data.isRegistered) {
        setStatus('Verified');
      } else {
        setStatus('Not Submitted');
      }
      
      setRequests(reqsRes.data);
    } catch (err) {
      console.error(err);
      setStatus('Error checking status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user._id]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    setFile(selectedFile);
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleUpload = async () => {
    if (!file) {
      return toast.error('Please select a file first.');
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const base64Data = await toBase64(file);
      setUploadProgress(40);
      
      const payload = {
        documentData: base64Data,
        userId: user._id
      };

      setUploadProgress(70);

      const res = await api.post('/kyc/upload-document', payload);
      
      setUploadProgress(100);
      toast.success(res.data.message || 'Document uploaded successfully!');
      
      setFile(null);
      setPreview(null);
      fetchData();
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.post('/kyc/approve-access', { requestId });
      toast.success('Access approved successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to approve access');
    }
  };

  const getStatusConfig = () => {
    switch(status) {
      case 'Verified': 
        return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: <CheckCircle className="w-8 h-8" />, gradient: 'from-emerald-500', accentColor: '#34d399' };
      case 'Pending':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: <Clock className="w-8 h-8" />, gradient: 'from-yellow-500', accentColor: '#facc15' };
      case 'Checking...':
        return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: <Clock className="w-8 h-8 animate-spin" />, gradient: 'from-slate-500', accentColor: '#94a3b8' };
      case 'Not Submitted':
      default:
        return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: <FileText className="w-8 h-8" />, gradient: 'from-slate-500', accentColor: '#94a3b8' };
    }
  };

  const statusConfig = getStatusConfig();
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;

  if (isLoading) {
    return (
      <Layout role="Citizen">
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout role="Citizen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>Citizen Dashboard</h2>
              <Sparkles className="w-5 h-5 text-primary-400 animate-pulse-glow" />
            </div>
            <p style={{ color: 'var(--theme-text-muted)' }}>Manage your identity documents and control who has access.</p>
          </div>
          <div className="rounded-xl p-3 flex flex-col" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-muted)' }}>Your Citizen ID</span>
            <div className="flex items-center gap-2">
              <code className="text-primary-400 font-mono text-sm">{user._id}</code>
              <button 
                onClick={() => { navigator.clipboard.writeText(user._id); toast.success('Citizen ID copied!'); }}
                className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110" 
                style={{ backgroundColor: 'var(--theme-input-bg)', color: 'var(--theme-text-secondary)' }}
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>KYC Status</p>
                <div className={`w-8 h-8 rounded-lg ${statusConfig.bg} ${statusConfig.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-xl font-bold ${statusConfig.color}`}>{status}</p>
            </div>
          </div>

          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Pending Requests</p>
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-yellow-400">{pendingRequests}</p>
            </div>
          </div>

          <div className="stat-card group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Approved Access</p>
                <div className="w-8 h-8 rounded-lg bg-primary-400/10 text-primary-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-primary-400">{approvedRequests}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          
          {/* KYC Status Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-lg font-semibold w-full text-left" style={{ color: 'var(--theme-text)' }}>Current KYC Status</h3>
            <div className={`p-6 rounded-2xl border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} transition-all duration-300 relative overflow-hidden`}>
              {/* Animated ring behind icon */}
              <div className="absolute inset-0 rounded-2xl animate-pulse-glow" style={{ boxShadow: `0 0 30px ${statusConfig.accentColor}20` }} />
              <div className="relative">{statusConfig.icon}</div>
            </div>
            <div>
              <h4 className={`text-2xl font-bold ${statusConfig.color}`}>{status}</h4>
              <p className="text-sm mt-2 max-w-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {status === 'Verified' ? 'Your identity is fully verified and anchored on the blockchain.' : 
                 status === 'Not Submitted' ? 'Please upload a valid identity document to begin.' :
                 status === 'Checking...' ? 'Checking your status on the decentralized network...' :
                 'There was an error checking your status.'}
              </p>
            </div>
          </div>
          
          {/* Upload Document Card */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>Upload Document</h3>
            
            {status === 'Verified' ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-emerald-500/20 rounded-2xl bg-emerald-500/[0.03]">
                <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
                <p className="text-emerald-400 font-medium">Document already uploaded and verified.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <label 
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group relative"
                  style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-input-bg)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--theme-border)'; }}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity rounded-xl" />
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-3 group-hover:bg-primary-500/20 group-hover:scale-110 transition-all duration-300">
                        <UploadCloud className="w-7 h-7 text-primary-400" />
                      </div>
                      <p className="font-medium text-sm text-center" style={{ color: 'var(--theme-text-secondary)' }}>Click to browse or drag and drop</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--theme-text-faint)' }}>Aadhaar, PAN, or Passport (JPG, PNG, PDF)</p>
                    </>
                  )}
                  {file && !preview && (
                    <div className="absolute inset-0 flex items-center justify-center text-primary-400 font-medium text-sm rounded-xl" style={{ backgroundColor: 'var(--theme-surface)' }}>
                      📄 {file.name}
                    </div>
                  )}
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg, image/png, application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>

                {uploadProgress > 0 && (
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-accent-500" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`btn-primary text-white ${(!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Encrypting & Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      Submit to IPFS & Blockchain
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Access Requests Table */}
          <div className="glass-panel p-6 rounded-2xl md:col-span-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between" style={{ color: 'var(--theme-text)' }}>
              Incoming Access Requests
              <span className="bg-primary-500/[0.08] text-primary-400 text-xs font-semibold py-1 px-3 rounded-full border border-primary-500/20">
                {requests.length} Total
              </span>
            </h3>
            
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                    <th className="py-3 px-4 font-semibold">Company</th>
                    <th className="py-3 px-4 font-semibold">Wallet Address</th>
                    <th className="py-3 px-4 font-semibold">Date Requested</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center" style={{ color: 'var(--theme-text-faint)' }}>
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        No incoming access requests
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
                            <div className="w-1 h-8 rounded-full bg-primary-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {req.companyId?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>{req.companyId?.walletAddress?.slice(0, 6)}...{req.companyId?.walletAddress?.slice(-4)}</td>
                        <td className="py-4 px-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                            req.status === 'Approved' ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20' : 
                            req.status === 'Denied' ? 'bg-red-500/[0.08] text-red-400 border-red-500/20' : 
                            'bg-yellow-500/[0.08] text-yellow-400 border-yellow-500/20'
                          }`}>
                            {req.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleApprove(req._id)}
                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button 
                                className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Deny
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>Resolved</span>
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

export default CitizenDashboard;
