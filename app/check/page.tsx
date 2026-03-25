// app/check/page.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

const exampleClaims = [
  "Earth is flat",
  "Diet Coke is healthier than Coke",
  "Taylor Swift is richer than Shah Rukh Khan"
];

interface FactCheckResult {
  verdict: string;
  confidence: number;
  reason: string;
  source?: string;
}

export default function CheckPage() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!claim.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: claim }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check claim');
      }

      setResult(data.result ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setClaim(example);
    setResult(null);
    setError(null);
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict?.toUpperCase()) {
      case 'TRUE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FALSE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'UNCERTAIN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="min-h-screen bg-white relative overflow-hidden"
    >
      {/* gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            AI Fact Checker
          </h1>
          <p className="text-gray-600 text-lg">
            Verify claims with AI-powered fact-checking
          </p>
        </motion.div>

        {/* input card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <Textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a claim (e.g., 'Dell laptops overheat a lot')"
            className="min-h-[120px] text-lg resize-none border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleCheck();
              }
            }}
          />

          <Button
            onClick={handleCheck}
            disabled={!claim.trim() || loading}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Check Fact'
            )}
          </Button>
        </motion.div>

        {/* example chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 justify-center mb-8"
        >
          <span className="text-sm text-gray-500">Try examples:</span>
          {exampleClaims.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExampleClick(example)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>

        {/* error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-red-800"
            >
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Result</h3>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className={`px-6 py-2 rounded-full font-bold text-lg border-2 ${getVerdictColor(result.verdict)}`}
                >
                  {result.verdict}
                </motion.div>
              </div>

              {result.confidence !== undefined && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Confidence
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={result.confidence * 100} 
                    className="h-3"
                  />
                </div>
              )}

              {result.reason && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Explanation
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {result.reason}
                  </p>
                </motion.div>
              )}

              {result.source && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 text-sm text-gray-500"
                >
                  <span className="font-semibold">Source:</span>{' '}
                  {result.source}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
