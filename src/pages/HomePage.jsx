import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../contexts/WalletContext.jsx'; 
import mainLogo from '../assets/americaparty-logo.png';
import './HomePage.css';

// --- Configuration & ABIs ---
const badgeMinterAddress = import.meta.env.VITE_BADGE_MINTER_ADDRESS;
const governorAddress = import.meta.env.VITE_GOVERNOR_CONTRACT_ADDRESS;
const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
const publicRpcUrl = import.meta.env.VITE_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com/";
import BadgeMinterABI from '../abis/BadgeMinter.json';
import ERC20ABI from '../config/abis/ERC20.json'; 

function HomePage() {
    const { signer, account, chainId, connectWallet } = useContext(WalletContext);

    // --- State & Logic (Complete and Correct) ---
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("Connect your wallet to begin.");
    const [mintedCount, setMintedCount] = useState(0);
    const [totalSupply] = useState(10000);
    const [currentPrice, setCurrentPrice] = useState("...");

    useEffect(() => {
        const fetchData = async () => {
            if (!badgeMinterAddress) return;
            try {
                const readOnlyProvider = new ethers.JsonRpcProvider(publicRpcUrl);
                const minterContract = new ethers.Contract(badgeMinterAddress, BadgeMinterABI.abi, readOnlyProvider);
                const count = await minterContract.totalMinted();
                setMintedCount(Number(count));
                if (Number(count) < totalSupply) {
                    const priceData = await minterContract.getPriceForQuantity(count, 1);
                    setCurrentPrice(ethers.formatUnits(priceData.totalPrice, 6));
                } else { setCurrentPrice("N/A"); }
            } catch (e) { console.error("Data fetch error:", e); }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePurchase = async () => {
        if (!signer) { setFeedback("Please connect your wallet first."); return; }
        if (chainId !== 137) { setFeedback("Error: Please switch to the Polygon Mainnet."); return; }
        setIsLoading(true);
        setFeedback("Preparing transaction...");
        try {
            const minterContract = new ethers.Contract(badgeMinterAddress, BadgeMinterABI.abi, signer);
            const usdcContract = new ethers.Contract(usdcAddress, ERC20ABI, signer);
            const priceData = await minterContract.getPriceForQuantity(mintedCount, 1);
            const totalPrice = priceData.totalPrice;
            setFeedback(`Requesting approval to spend ${currentPrice} USDC...`);
            const approveTx = await usdcContract.approve(badgeMinterAddress, totalPrice);
            setFeedback("Waiting for approval confirmation...");
            await approveTx.wait();
            setFeedback("Securing your Founder's Badge...");
            const purchaseTx = await minterContract.purchaseBadges(1);
            setFeedback("Finalizing on the blockchain...");
            await purchaseTx.wait();
            setFeedback("🎉 Success! Welcome, Founder.");
            const newCount = await minterContract.totalMinted();
            setMintedCount(Number(newCount));
        } catch (error) {
            console.error("Purchase failed:", error);
            setFeedback(error.reason || "Transaction failed.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const isSoldOut = mintedCount >= totalSupply;
    const TALLY_PROPOSE_URL = `https://www.tally.xyz/gov/${governorAddress}/propose`;
    const TALLY_VOTE_URL = `https://www.tally.xyz/gov/${governorAddress}`;
    
    return (
        <div className="home-container">
            {/* === HERO SECTION === */}
            <div className="hero-section">
                <div className="page-grid">
                    <div className="left-column">
                        <img src={mainLogo} alt="America Party" className="main-logo" />
                        <div className="mint-card">
                            <h1>The First 10,000.</h1>
                            <p className="subtitle">Become a Founding Member of the America Party. Secure one of only 10,000 governance badges ever to be created.</p>
                            <div className="supply-counter">
                                <div className="supply-text">
                                    <span>FOUNDERS' BADGES CLAIMED</span>
                                    <span>{mintedCount.toLocaleString()} / {totalSupply.toLocaleString()}</span>
                                </div>
                                <div className="progress-bar-background"><div className="progress-bar-foreground" style={{ width: `${(mintedCount / totalSupply) * 100}%` }}></div></div>
                            </div>
                            <div className="mint-action-area">
                                {account ? ( <button className="mint-button" onClick={handlePurchase} disabled={isLoading || isSoldOut}>{isLoading ? "Processing..." : isSoldOut ? "SOLD OUT" : `Secure My Badge (${currentPrice} USDC)`}</button> ) : ( <button className="mint-button" onClick={connectWallet}>Connect Wallet</button> )}
                            </div>
                            {feedback && <p className="feedback-text">{feedback}</p>}
                        </div>
                    </div>
                    <div className="right-column">
                        <div className="dashboard-module">
                            <h2>DAO STATS</h2>
                            <div className="stats-grid simplified">
                                <div className="stat-item"><span className="stat-icon">👥</span><div className="stat-text-content"><span className="stat-value">{mintedCount.toLocaleString()}</span><span className="stat-label">Total Founders</span></div></div>
                            </div>
                        </div>
                        <div className="dashboard-module">
                            <h2>RECENT PROPOSALS</h2>
                            <div className="proposal-list-container"><p className="proposal-item-empty">The floor is open. The first proposal can now be made.</p></div>
                            <a href={TALLY_VOTE_URL} target="_blank" rel="noopener noreferrer" className="view-all-link">Vote on Proposals →</a>
                        </div>
                        <div className="dashboard-module">
                            <h2>SHAPE THE FUTURE</h2>
                            <p className="module-text">As a Founder, you have the power to create proposals and define the direction of the party. Make your voice heard.</p>
                            <a href={TALLY_PROPOSE_URL} target="_blank" rel="noopener noreferrer" className="module-button">Create Your First Proposal</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* === MANIFESTO SECTION (RESTORED) === */}
            <div className="manifesto-section">
                <h2 className="section-title">Governance is Not for Rent. It's for Owning.</h2>
                <p className="manifesto-text">For too long, political power has been a closed system where your voice is borrowed, not owned. You are asked for your vote every few years, only to have it vanish into a machine of bureaucracy and backroom deals. The America Party is different. It is a Decentralized Autonomous Organization (DAO) where **every major decision is made by you.**</p>
            </div>

            {/* === HOW IT WORKS SECTION (RESTORED) === */}
            <div className="how-it-works-section">
                <h2 className="section-title">Your Badge is Your Power</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <h3>Vote on Real Decisions</h3>
                        <p>This is not a simulation. As a Founder, you will vote on tangible, high-stakes decisions. **Where should we hold the first America Party Congress? Which policies should we prioritize?** Your vote directly shapes our future.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Own Your Influence</h3>
                        <p>Because your governance right is an NFT, you truly own it. You are free to sell or transfer your Founder's Badge on any secondary marketplace, creating a liquid market for real political influence.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Secure Your Legacy</h3>
                        <p>With a fixed supply of only 10,000 Founder's Badges, the influence of the first members can never be diluted. You are securing a permanent, foundational stake in a new political paradigm.</p>
                    </div>
                </div>
            </div>
            
            {/* === JOIN THE CONVERSATION SECTION (RESTORED) === */}
            <div className="final-cta-section">
                <h2>Join The Conversation</h2>
                <a href="https://twitter.com/SimoUzel" target="_blank" rel="noopener noreferrer" className="final-cta-button twitter-button">Follow @SimoUzel on X</a>
            </div>
        </div>
    );
}

export default HomePage;