import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../api/axios';
import { ShieldCheck, ShieldAlert, ArrowLeft, Loader, FileText, Database, Server } from 'lucide-react';

const VerifyIntegrity = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const runVerification = async () => {
      try {
        const res = await api.get(`/kyc/verify/${userId}`);
        setResult(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    runVerification();
  }, [userId]);

  return (
    <Layout role="Verifier">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <Link to="/verifier-dashboard" className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-2 mb-4 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Integrity Verification</h2>
          <p className="text-slate-400">Comparing cryptographic footprint on-chain with IPFS data.</p>
        </div>

        {loading ? (
          <div className="glass-panel p-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-300 font-medium">Fetching from Blockchain and IPFS...</p>
            <p className="text-slate-500 text-sm">Decrypting and computing SHA-256 hash</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-red-400" />
            <h3 className="text-xl font-bold text-red-400">Verification Error</h3>
            <p className="text-red-300/80">{error}</p>
          </div>
        ) : result && (
          <div className="space-y-6">
            
            {/* Status Banner */}
            <div className={`p-6 rounded-xl border flex items-center gap-4 shadow-lg ${
              result.isIntact 
                ? 'bg-green-500/10 border-green-500/30 shadow-green-500/5' 
                : 'bg-red-500/10 border-red-500/30 shadow-red-500/5'
            }`}>
              {result.isIntact ? (
                <ShieldCheck className="w-12 h-12 text-green-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-400 shrink-0 animate-pulse" />
              )}
              <div>
                <h3 className={`text-2xl font-bold ${result.isIntact ? 'text-green-400' : 'text-red-400'}`}>
                  {result.isIntact ? 'Integrity Verified: Match' : 'TAMPER DETECTED: Mismatch'}
                </h3>
                <p className={result.isIntact ? 'text-green-400/80' : 'text-red-400/80'}>
                  {result.isIntact 
                    ? 'The document data exactly matches the immutable footprint on the blockchain.' 
                    : 'The IPFS document data does NOT match the original blockchain hash.'}
                </p>
              </div>
            </div>

            {/* Hash Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="glass-panel p-6 border-t-4 border-t-blue-500">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Blockchain Record</h4>
                </div>
                <p className="text-slate-400 text-sm mb-2">Immutable Expected Hash</p>
                <div className="bg-background-dark p-4 rounded-lg overflow-hidden relative group">
                  <p className="text-blue-300 font-mono text-sm break-all">{result.expectedHash}</p>
                </div>
              </div>

              <div className={`glass-panel p-6 border-t-4 ${result.isIntact ? 'border-t-green-500' : 'border-t-red-500'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-slate-300" />
                  <h4 className="text-lg font-semibold text-white">IPFS Recomputed</h4>
                </div>
                <p className="text-slate-400 text-sm mb-2">Decrypted Computed Hash</p>
                <div className="bg-background-dark p-4 rounded-lg overflow-hidden relative group">
                  <p className={`font-mono text-sm break-all ${result.isIntact ? 'text-green-300' : 'text-red-300 font-bold'}`}>
                    {result.computedHash}
                  </p>
                </div>
              </div>

            </div>

            {/* Decrypted Content Preview (MVP Only) */}
            {result.decryptedData && result.isIntact && (
              <div className="glass-panel p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-300" />
                  <h4 className="text-lg font-semibold text-white">Decrypted Document Preview</h4>
                </div>
                <div className="bg-surface-dark border border-border-dark p-4 rounded-lg overflow-auto max-h-96">
                  {result.decryptedData.startsWith('data:image/') ? (
                    <img src={result.decryptedData} alt="Decrypted KYC Document" className="max-w-full h-auto rounded" />
                  ) : (
                    <pre className="text-slate-300 text-sm whitespace-pre-wrap">{result.decryptedData}</pre>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerifyIntegrity;
