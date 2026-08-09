import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-700/50 relative z-10">
          <FileQuestion className="w-10 h-10 text-primary-400" />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-white mt-2">Page Not Found</h2>
        </div>
        
        <p className="text-slate-400 relative z-10">
          The decentralized block you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="pt-6 relative z-10">
          <Link 
            to="/"
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
          >
            <Home className="w-5 h-5" /> Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
