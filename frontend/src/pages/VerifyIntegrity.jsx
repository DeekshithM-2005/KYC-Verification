import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../api/axios';
import { ShieldCheck, ShieldAlert, ArrowLeft, FileText, Database, Server } from 'lucide-react';
import { VerifyIntegritySkeleton } from '../components/common/SkeletonLoader';

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
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>Integrity Verification</h2>
          <p style={{ color: 'var(--theme-text-secondary)' }}>Comparing cryptographic footprint on-chain with IPFS data.</p>
        </div>

        {loading ? (
          <VerifyIntegritySkeleton />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-400">Verification Error</h3>
            <p className="text-red-300/80">{error}</p>
          </div>
        ) : result && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Status Banner */}
            <div className={`p-6 rounded-2xl border flex items-center gap-4 shadow-lg relative overflow-hidden ${
              result.isIntact 
                ? 'bg-green-500/10 border-green-500/30 shadow-green-500/5' 
                : 'bg-red-500/10 border-red-500/30 shadow-red-500/5'
            }`}>
              {/* Background glow */}
              <div className={`absolute -left-10 -top-10 w-32 h-32 rounded-full blur-3xl ${result.isIntact ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
              
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center ${result.isIntact ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {result.isIntact ? (
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
                )}
              </div>
              <div className="relative">
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
              
              <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-blue-500 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Database className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>Blockchain Record</h4>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--theme-text-secondary)' }}>Immutable Expected Hash</p>
                  <div className="p-4 rounded-xl overflow-hidden relative group/hash" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                    <p className="text-blue-300 font-mono text-sm break-all">{result.expectedHash}</p>
                  </div>
                </div>
              </div>

              <div className={`glass-panel p-6 rounded-2xl border-t-4 ${result.isIntact ? 'border-t-green-500' : 'border-t-red-500'} relative overflow-hidden group`}>
                <div className={`absolute -top-10 -right-10 w-24 h-24 ${result.isIntact ? 'bg-green-500/5' : 'bg-red-500/5'} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${result.isIntact ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                      <Server className={`w-4 h-4 ${result.isIntact ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <h4 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>IPFS Recomputed</h4>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--theme-text-secondary)' }}>Decrypted Computed Hash</p>
                  <div className="p-4 rounded-xl overflow-hidden relative group/hash" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                    <p className={`font-mono text-sm break-all ${result.isIntact ? 'text-green-300' : 'text-red-300 font-bold'}`}>
                      {result.computedHash}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Decrypted Content Preview (MVP Only) */}
            {result.decryptedData && result.isIntact && (
              <div className="glass-panel p-6 rounded-2xl animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary-400" />
                  </div>
                  <h4 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>Decrypted Document Preview</h4>
                </div>
                <div className="p-4 rounded-xl overflow-auto max-h-96" style={{ backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)' }}>
                  {result.decryptedData.startsWith('data:image/') ? (
                    <img src={result.decryptedData} alt="Decrypted KYC Document" className="max-w-full h-auto rounded-lg" />
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--theme-text-secondary)' }}>{result.decryptedData}</pre>
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
