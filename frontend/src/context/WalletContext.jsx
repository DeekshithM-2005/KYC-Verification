import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

// Hardhat local node chainId is usually 31337. Ganache is 1337. 
// Our node is running via Hardhat, so we expect 31337.
const EXPECTED_CHAIN_ID = 31337; 

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [networkError, setNetworkError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize connection if already authorized
  useEffect(() => {
    const initWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (err) {
          console.error("Wallet auto-connect failed:", err);
        }
      }
    };
    initWallet();
  }, []);

  // Listen to network & account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          setAddress(null);
          setProvider(null);
        }
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this DApp.");
      return;
    }

    try {
      setIsConnecting(true);
      setNetworkError('');
      
      const web3Provider = new BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      
      const signer = await web3Provider.getSigner();
      const accountAddress = await signer.getAddress();
      
      const network = await web3Provider.getNetwork();
      // getNetwork().chainId returns a bigint in ethers v6
      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        setNetworkError(`Wrong network. Please connect to Localhost (Chain ID: ${EXPECTED_CHAIN_ID})`);
      }

      setProvider(web3Provider);
      setAddress(accountAddress);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setProvider(null);
    setNetworkError('');
  };

  return (
    <WalletContext.Provider value={{
      address,
      provider,
      networkError,
      isConnecting,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};
