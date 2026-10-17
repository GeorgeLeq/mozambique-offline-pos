import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CreateShopSimulationProps {
  onBack: () => void;
  onShopCreated: (shopCode: string, masterPin: string) => void;
}

export default function CreateShopSimulation({ onBack, onShopCreated }: CreateShopSimulationProps) {
  const [shopName, setShopName] = useState('');
  const [masterPin, setMasterPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Generate a random 6-character alphanumeric code
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newShopCode = `SHOP-${randomCode}`;

      const { error: insertError } = await supabase.from('shops').insert({
        code: newShopCode,
        name: shopName,
        master_pin: masterPin
      });

      if (insertError) {
        throw insertError;
      }

      // Automatically pass the credentials back to the activation screen
      onShopCreated(newShopCode, masterPin);
    } catch (err: any) {
      console.error('Failed to create shop:', err);
      setError(err.message || 'Failed to create shop. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 max-w-md w-full relative z-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Create a Shop</h1>
        <p className="text-slate-500 dark:text-zinc-500 mt-2 font-medium">Headquarters Backoffice Simulation</p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-400 mb-2">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 outline-none transition-all shadow-sm"
            placeholder="e.g. Maputo Central Store"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-400 mb-2">Master PIN</label>
          <input
            type="password"
            value={masterPin}
            onChange={(e) => setMasterPin(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 outline-none transition-all tracking-[0.5em] shadow-sm"
            placeholder="••••••"
            maxLength={6}
            pattern="\d{6}"
            title="Must be a 6-digit PIN"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 dark:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)] disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? 'Creating...' : 'Create Shop & Generate Code'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold py-4 rounded-2xl transition-all border border-slate-200 dark:border-white/5 active:scale-95 shadow-sm"
        >
          Back to Activation
        </button>
      </form>
    </div>
  );
}
