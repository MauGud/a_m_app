'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

type Step = 'member' | 'secret';

export default function SetupPage() {
  const router = useRouter();
  const { setupInstance, selectMember, setSecret, isAuthenticated } = useAuthStore();
  
  const [step, setStep] = useState<Step>('member');
  const [selectedMember, setSelectedMember] = useState<'MEMBER_A' | 'MEMBER_B' | null>(null);
  const [secretInput, setSecretInput] = useState('');

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleMemberSelect = (slot: 'MEMBER_A' | 'MEMBER_B') => {
    // Hardcoded: Amanda es MEMBER_A, Mau es MEMBER_B
    setupInstance({ memberA: 'Amanda', memberB: 'Mau' });
    setSelectedMember(slot);
    selectMember(slot);
    setStep('secret');
  };

  const handleSecretSubmit = () => {
    if (secretInput.trim().length >= 4) {
      setSecret(secretInput.trim());
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💕 A & M</h1>
          <p className="text-gray-600">Nuestro espacio privado</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {['member', 'secret'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                step === s ? 'bg-pastel-pink-200 scale-125' : 
                ['member', 'secret'].indexOf(step) > i ? 'bg-pastel-green-200' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        <Card className="p-6">
          {step === 'member' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">¿Quién eres?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMemberSelect('MEMBER_A')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-center',
                    'hover:border-pastel-pink-200 hover:bg-pastel-pink-50',
                    selectedMember === 'MEMBER_A' && 'border-pastel-pink-300 bg-pastel-pink-100'
                  )}
                >
                  <span className="text-3xl mb-2 block">👩</span>
                  <span className="font-medium">Amanda</span>
                </button>
                <button
                  onClick={() => handleMemberSelect('MEMBER_B')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-center',
                    'hover:border-pastel-blue-200 hover:bg-pastel-blue-50',
                    selectedMember === 'MEMBER_B' && 'border-pastel-blue-300 bg-pastel-blue-100'
                  )}
                >
                  <span className="text-3xl mb-2 block">👨</span>
                  <span className="font-medium">Mau</span>
                </button>
              </div>
            </div>
          )}

          {step === 'secret' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Código secreto</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                El código que solo nosotros conocemos 💕
              </p>
              <Input
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                autoFocus
              />
              <Button
                onClick={handleSecretSubmit}
                disabled={secretInput.trim().length < 4}
                className="w-full"
              >
                Entrar 💕
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
