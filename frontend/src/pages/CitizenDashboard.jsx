import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch KYC Status & Requests
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
    }
  };

  useEffect(() => {
    fetchData();
    // Real-time polling
    const interval = setInterval(fetchData, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, [user._id]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images
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
      fetchData(); // refresh immediately
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to approve access');
    }
  };

  const getStatusConfig = () => {
    switch(status) {
      case 'Verified': 
        return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: <CheckCircle className="w-8 h-8" /> };
      case 'Pending':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', icon: <Clock className="w-8 h-8" /> };
      case 'Not Submitted':
      default:
        return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30', icon: <FileText className="w-8 h-8" /> };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Layout role="Citizen">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Citizen Dashboard</h2>
          <p className="text-slate-400">Manage your identity documents and control who has access.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* KYC Status Card */}
          <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-xl font-semibold text-white w-full text-left">Current KYC Status</h3>
            <div className={`p-6 rounded-full border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
              {statusConfig.icon}
            </div>
            <div>
              <h4 className={`text-2xl font-bold ${statusConfig.color}`}>{status}</h4>
              <p className="text-slate-400 text-sm mt-2">
                {status === 'Verified' ? 'Your identity is fully verified and anchored on the blockchain.' : 
                 status === 'Not Submitted' ? 'Please upload a valid identity document to begin.' :
                 'Checking status on the decentralized network...'}
              </p>
            </div>
          </div>
          
          {/* Upload Document Card */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Upload Document</h3>
            
            {status === 'Verified' ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-green-500/30 rounded-xl bg-green-500/5">
                <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-green-400 font-medium">Document already uploaded and verified.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <label 
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border-dark rounded-xl bg-surface-dark/50 hover:bg-surface-hover hover:border-primary-500/50 transition-all cursor-pointer overflow-hidden group relative"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-slate-400 mb-3 group-hover:text-primary-400 transition-colors" />
                      <p className="text-slate-300 font-medium text-center">Click to browse or drag and drop</p>
                      <p className="text-slate-500 text-sm mt-1">Aadhaar, PAN, or Passport (JPG, PNG, PDF)</p>
                    </>
                  )}
                  {file && !preview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-dark text-primary-400 font-medium">
                      {file.name}
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
                  <div className="w-full bg-surface-dark rounded-full h-2.5 mb-4 border border-border-dark overflow-hidden">
                    <div 
                      className="bg-primary-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${(!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
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
          <div className="glass-panel p-6 md:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
              Incoming Access Requests
              <span className="bg-primary-600/20 text-primary-400 text-sm py-1 px-3 rounded-full border border-primary-500/20">
                {requests.length} Total
              </span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark text-slate-400 text-sm">
                    <th className="py-3 px-4 font-medium">Company</th>
                    <th className="py-3 px-4 font-medium">Wallet Address</th>
                    <th className="py-3 px-4 font-medium">Date Requested</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">No incoming access requests</td>
                    </tr>
                  ) : (
                    requests.map(req => (
                      <tr key={req._id} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{req.companyId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm font-mono">{req.companyId?.walletAddress?.slice(0, 6)}...{req.companyId?.walletAddress?.slice(-4)}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            req.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            req.status === 'Denied' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleApprove(req._id)}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" /> Approve
                              </button>
                              <button 
                                className="bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" /> Deny
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm italic">Resolved</span>
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
