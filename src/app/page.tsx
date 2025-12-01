'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { WalletErrorBoundary } from '@/components/errors/WalletErrorBoundary';
import { ChatSkeleton, ModalSkeleton } from '@/components/LoadingSkeleton';

// Dynamically import heavy components with loading states
const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  loading: () => <ChatSkeleton />,
  ssr: false,
});

const WalletConnectModal = dynamic(() => import('@/components/wallet/WalletConnectModal'), {
  loading: () => <ModalSkeleton />,
  ssr: false,
});

// Dynamically import the profile page component
const ProfilePage = dynamic(() => import('@/app/profile/page'), {
  loading: () => <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading profile...</div></div>,
  ssr: false,
});

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50"
        aria-label="Primary navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Ambience
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8" role="menubar" aria-label="Main navigation menu">
              <a 
                href="#features" 
                role="menuitem"
                className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                role="menuitem"
                className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                How It Works
              </a>
              <button
                onClick={() => setShowProfile(true)}
                className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Profile
              </button>
              <button
                onClick={() => setShowChat(true)}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Open Chat
              </button>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Connect Wallet
              </button>
              <ThemeToggle />
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${mobileOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${mobileOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${mobileOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              How It Works
            </a>
            <button
              onClick={() => {
                setShowProfile(true);
                setMobileOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Profile
            </button>
            <button
              onClick={() => {
                setShowChat(true);
                setMobileOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Open Chat
            </button>
            <button
              onClick={() => {
                setShowWalletModal(true);
                setMobileOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* Wallet Connect Modal */}
      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-900/75" onClick={() => setShowChat(false)}></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-xl">
                  <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<ChatSkeleton />}>
                      <ChatInterface />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Page */}
      {showProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowProfile(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white dark:bg-slate-800 rounded-md text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowProfile(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Suspense fallback={
                <div className="w-full h-64 flex items-center justify-center">
                  <div className="animate-pulse">Loading profile...</div>
                </div>
              }>
                <ProfilePage />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="hero-heading">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-8" role="status">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  ✨ Decentralized • Onchain • Censorship-Resistant
                </span>
              </div>
              
              <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-linear-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Chat on the Blockchain
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-200 mb-12 leading-relaxed max-w-3xl mx-auto">
                Experience the future of messaging with{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Ambience
                </span>{' '}
                — a fully decentralized chat application where every message is
                stored onchain, ensuring immutability, transparency, and true
                ownership.
              </p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => setShowComingSoon(true)}
                  className="group px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-describedby="start-chatting-description"
                >
                  Start Chatting
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <span id="start-chatting-description" className="sr-only">
                  Launch the chat application to start messaging
                </span>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full font-semibold text-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              className="mt-20 relative"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35 }}
            >
              <div className="max-w-5xl mx-auto bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Ambience Chat
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Powered by Base Blockchain
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-500"></div>
                      <motion.div
                        className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="text-slate-900 dark:text-slate-100">
                          Welcome to the future of messaging! 🚀
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Onchain • Immutable
                        </p>
                      </motion.div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <motion.div
                        className="flex-1 bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl rounded-tr-none p-4 text-white max-w-md ml-auto"
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="text-slate-100">
                          This is incredible! Every message is stored on the
                          blockchain. True decentralization! 💎
                        </p>
                        <p className="text-xs text-slate-200 mt-1">
                          Onchain • Immutable
                        </p>
                      </motion.div>
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-cyan-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-900/50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Why Choose Ambience?
              </h2>
              <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
                Built for those who value privacy, transparency, and true
                ownership of their data
              </p>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Key features">
              {[
                {
                  icon: '🔐',
                  title: 'Wallet Authentication',
                  description:
                    'Connect with MetaMask, Coinbase Wallet, WalletConnect, and more. Your identity, your control.',
                },
                {
                  icon: '⛓️',
                  title: 'Fully Onchain',
                  description:
                    'Every message is stored directly on Base blockchain. Immutable, transparent, and verifiable by anyone.',
                },
                {
                  icon: '🛡️',
                  title: 'Censorship Resistant',
                  description:
                    'No centralized servers can control or delete your messages. True freedom of communication.',
                },
                {
                  icon: '⚡',
                  title: 'Real-time Updates',
                  description:
                    'Live chat interface with automatic message updates. Experience seamless communication.',
                },
                {
                  icon: '👤',
                  title: 'User Profiles',
                  description:
                    'Onchain identity management with ENS/Basename support. Your profile, permanently yours.',
                },
                {
                  icon: '📜',
                  title: 'Complete History',
                  description:
                    'Browse complete immutable chat history. Every conversation is permanently recorded.',
                },
              ].map((feature, index) => (
                <li key={index} role="listitem">
                  <article className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                    <div className="text-4xl mb-4" aria-hidden="true">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
                Simple, secure, and decentralized messaging in three easy steps
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto" role="list" aria-label="Steps to get started">
              {[
                {
                  step: '01',
                  title: 'Connect Your Wallet',
                  description:
                    'Link your Web3 wallet to authenticate and access your decentralized identity.',
                },
                {
                  step: '02',
                  title: 'Start Chatting',
                  description:
                    'Join rooms or create new ones. Every message is sent as an onchain transaction.',
                },
                {
                  step: '03',
                  title: 'Own Your Data',
                  description:
                    'All messages are permanently stored on Base blockchain. You truly own your conversations.',
                },
              ].map((step, index) => (
                <li key={index} role="listitem" className="relative">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl mb-6">
                      {step.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-linear-to-r from-blue-600 to-indigo-600 transform translate-x-4"></div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 sm:p-16 shadow-2xl">
              <h2 id="cta-heading" className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to Experience Decentralized Messaging?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join the future of communication. Connect your wallet and start
                chatting on the blockchain today.
              </p>
              <button
                type="button"
                onClick={() => setShowComingSoon(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Launch Ambience Chat
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Ambience
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-center md:text-right">
                Built on Base Blockchain • Decentralized • Open Source
              </p>
            </div>
          </div>
        </footer>

        {/* Coming Soon Modal */}
        {showComingSoon && (
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
            aria-describedby="coming-soon-desc"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                id="coming-soon-title"
                className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3"
              >
                Coming Soon!
              </h3>
              <p
                id="coming-soon-desc"
                className="text-slate-600 dark:text-slate-400 mb-6"
              >
                The chat feature is currently under development. We&apos;re
                working hard to bring you the best decentralized messaging
                experience. Stay tuned!
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
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
