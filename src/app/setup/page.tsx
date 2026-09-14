'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

type Step = 'names' | 'member' | 'secret';

export default function SetupPage() {
  const router = useRouter();
  const { setupInstance, selectMember, setSecret, isAuthenticated } = useAuthStore();
  
  const [step, setStep] = useState<Step>('names');
  const [memberA, setMemberA] = useState('');
  const [memberB, setMemberB] = useState('');
  const [selectedMember, setSelectedMember] = useState<'MEMBER_A' | 'MEMBER_B' | null>(null);
  const [secretInput, setSecretInput] = useState('');

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleNamesSubmit = () => {
    if (memberA.trim() && memberB.trim()) {
      setupInstance({ memberA: memberA.trim(), memberB: memberB.trim() });
      setStep('member');
    }
  };

  const handleMemberSelect = (slot: 'MEMBER_A' | 'MEMBER_B') => {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💕 Espacio de Pareja</h1>
          <p className="text-gray-600">Configura tu espacio privado</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {['names', 'member', 'secret'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                step === s ? 'bg-pastel-pink-200 scale-125' : 
                ['names', 'member', 'secret'].indexOf(step) > i ? 'bg-pastel-green-200' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        <Card className="p-6">
          {step === 'names' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">¿Cómo se llaman?</h2>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Persona 1</label>
                <Input
                  placeholder="Nombre"
                  value={memberA}
                  onChange={(e) => setMemberA(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Persona 2</label>
                <Input
                  placeholder="Nombre"
                  value={memberB}
                  onChange={(e) => setMemberB(e.target.value)}
                />
              </div>
              <Button
                onClick={handleNamesSubmit}
                disabled={!memberA.trim() || !memberB.trim()}
                className="w-full"
              >
                Continuar
              </Button>
            </div>
          )}

          {step === 'member' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">¿Quién eres tú?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleMemberSelect('MEMBER_A')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-center',
                    'hover:border-pastel-pink-200 hover:bg-pastel-pink-50',
                    selectedMember === 'MEMBER_A' && 'border-pastel-pink-300 bg-pastel-pink-100'
                  )}
                >
                  <span className="text-3xl mb-2 block">👤</span>
                  <span className="font-medium">{memberA}</span>
                </button>
                <button
                  onClick={() => handleMemberSelect('MEMBER_B')}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-center',
                    'hover:border-pastel-green-200 hover:bg-pastel-green-50',
                    selectedMember === 'MEMBER_B' && 'border-pastel-green-300 bg-pastel-green-100'
                  )}
                >
                  <span className="text-3xl mb-2 block">👤</span>
                  <span className="font-medium">{memberB}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'secret' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Crea un código secreto</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                Este código lo usarán ambos para acceder
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
                ¡Comenzar! 💕
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
