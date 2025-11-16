"use client";

import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import { useState } from "react";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Ambience
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md">
                How It Works
              </a>
              <Link href="/profile" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md">
                Profile
              </Link>
              <WalletConnect />
            </div>
            <div className="md:hidden flex items-center gap-2">
              <WalletConnect />
              <button
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  {mobileOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-2 py-2">
                <a href="#features" className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Features
                </a>
                <a href="#how-it-works" className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  How It Works
                </a>
                <Link href="/profile" className="px-4 py-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-8">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                ✨ Decentralized • Onchain • Censorship-Resistant
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Chat on the Blockchain
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Experience the future of messaging with <span className="font-semibold text-blue-600 dark:text-blue-400">Ambience</span> — 
              a fully decentralized chat application where every message is stored onchain, 
              ensuring immutability, transparency, and true ownership.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowComingSoon(true)}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Start Chatting
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full font-semibold text-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Ambience Chat</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Powered by Base Blockchain</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4">
                      <p className="text-slate-900 dark:text-slate-100">Welcome to the future of messaging! 🚀</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Onchain • Immutable</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl rounded-tr-none p-4 text-white max-w-md ml-auto">
                      <p>This is incredible! Every message is stored on the blockchain. True decentralization! 💎</p>
                      <p className="text-xs text-blue-100 mt-1">Onchain • Immutable</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Why Choose Ambience?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Built for those who value privacy, transparency, and true ownership of their data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔐",
                title: "Wallet Authentication",
                description: "Connect with MetaMask, Coinbase Wallet, WalletConnect, and more. Your identity, your control.",
              },
              {
                icon: "⛓️",
                title: "Fully Onchain",
                description: "Every message is stored directly on Base blockchain. Immutable, transparent, and verifiable by anyone.",
              },
              {
                icon: "🛡️",
                title: "Censorship Resistant",
                description: "No centralized servers can control or delete your messages. True freedom of communication.",
              },
              {
                icon: "⚡",
                title: "Real-time Updates",
                description: "Live chat interface with automatic message updates. Experience seamless communication.",
              },
              {
                icon: "👤",
                title: "User Profiles",
                description: "Onchain identity management with ENS/Basename support. Your profile, permanently yours.",
              },
              {
                icon: "📜",
                title: "Complete History",
                description: "Browse complete immutable chat history. Every conversation is permanently recorded.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Simple, secure, and decentralized messaging in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Your Wallet",
                description: "Link your Web3 wallet to authenticate and access your decentralized identity.",
              },
              {
                step: "02",
                title: "Start Chatting",
                description: "Join rooms or create new ones. Every message is sent as an onchain transaction.",
              },
              {
                step: "03",
                title: "Own Your Data",
                description: "All messages are permanently stored on Base blockchain. You truly own your conversations.",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl mb-6">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transform translate-x-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 sm:p-16 shadow-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Experience Decentralized Messaging?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join the future of communication. Connect your wallet and start chatting on the blockchain today.
            </p>
            <button
              onClick={() => setShowComingSoon(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Launch Ambience Chat
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Ambience
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-center md:text-right">
              Built on Base Blockchain • Decentralized • Open Source
            </p>
          </div>
        </div>
      </footer>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Coming Soon!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                The chat feature is currently under development. We're working hard to bring you the best decentralized messaging experience. Stay tuned!
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
