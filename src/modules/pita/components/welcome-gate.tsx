'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface WelcomeGateProps {
  presentationTitle: string;
  onEnter: (name: string) => void;
}

export function WelcomeGate({ presentationTitle, onEnter }: WelcomeGateProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onEnter(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative">
      {/* Subtle wave rings background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="400" cy="300" r="80" stroke="#4FAF8F" strokeWidth="0.5"/>
        <circle cx="400" cy="300" r="140" stroke="#4FAF8F" strokeWidth="0.5"/>
        <circle cx="400" cy="300" r="200" stroke="#2D6CDF" strokeWidth="0.5"/>
        <circle cx="400" cy="300" r="260" stroke="#E9EEF2" strokeWidth="0.5"/>
        <circle cx="400" cy="300" r="320" stroke="#E9EEF2" strokeWidth="0.3"/>
      </svg>

      <div className="relative z-10 w-full max-w-md text-center animate-pita-fade-in">
        {/* PITA Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/pita.png"
            alt="PITA"
            width={80}
            height={80}
            className="opacity-80"
          />
        </div>

        {/* Welcome Message */}
        <h1 className="font-editorial text-3xl font-bold text-[#0E1B2C] mb-2">
          Welcome
        </h1>
        <p className="text-[#0E1B2C]/40 mb-8 text-sm">
          You&apos;re about to review: <span className="text-[#4FAF8F] font-medium">{presentationTitle}</span>
        </p>

        {/* Name Entry */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full px-6 py-4 bg-[#0E1B2C]/[0.03] border border-[#E9EEF2] rounded-xl text-[#0E1B2C] placeholder-[#0E1B2C]/25 text-center text-lg focus:outline-none focus:border-[#4FAF8F]/50 focus:ring-1 focus:ring-[#4FAF8F]/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#4FAF8F] text-white rounded-xl font-semibold text-lg hover:bg-[#4FAF8F]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Start Review
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-6 text-xs text-[#0E1B2C]/25">
          Your feedback helps this idea take root.
        </p>
      </div>
    </div>
  );
}
