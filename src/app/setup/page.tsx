'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { MEMBER_NAMES, type MemberSlot } from '@/lib/constants';
import { BrandMark } from '@/components/brand/brand-mark';

type Step = 'member' | 'secret';

export default function SetupPage() {
  const router = useRouter();
  const { selectMember, verifySecret, isAuthenticated, hasHydrated, memberSlot, displayName } =
    useAuthStore();

  const [step, setStep] = useState<Step>('member');
  const [selectedMember, setSelectedMember] = useState<MemberSlot | null>(memberSlot);
  const [secretInput, setSecretInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push('/');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && memberSlot && !isAuthenticated) {
      setSelectedMember(memberSlot);
      setStep('secret');
    }
  }, [hasHydrated, memberSlot, isAuthenticated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">💕</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleMemberSelect = (slot: MemberSlot) => {
    setSelectedMember(slot);
    selectMember(slot);
    setError('');
    setStep('secret');
  };

  const handleSecretSubmit = async () => {
    setError('');
    setSubmitting(true);
    const ok = await verifySecret(secretInput.trim());
    setSubmitting(false);
    if (ok) {
      router.push('/');
    } else {
      setError('Código incorrecto');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandMark size={72} className="mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">A & M</h1>
          <p className="text-gray-600">Nuestro espacio privado</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {['member', 'secret'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                step === s
                  ? 'bg-pastel-pink-200 scale-125'
                  : ['member', 'secret'].indexOf(step) > i
                    ? 'bg-pastel-green-200'
                    : 'bg-gray-200'
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
                  <span className="font-medium">{MEMBER_NAMES.MEMBER_A}</span>
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
                  <span className="font-medium">{MEMBER_NAMES.MEMBER_B}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'secret' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-2">Código secreto</h2>
              {displayName && (
                <p className="text-sm text-gray-600 text-center">
                  Hola {displayName} 💕 El código se pide cada 60 días
                </p>
              )}
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Código de 4 dígitos"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && secretInput.trim().length >= 4) {
                    handleSecretSubmit();
                  }
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              <Button
                onClick={handleSecretSubmit}
                disabled={secretInput.trim().length < 4 || submitting}
                className="w-full"
              >
                {submitting ? 'Entrando...' : 'Entrar 💕'}
              </Button>
              {memberSlot && (
                <button
                  type="button"
                  onClick={() => {
                    setStep('member');
                    setError('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  No soy {displayName}
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
