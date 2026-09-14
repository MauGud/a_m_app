'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth-store';
import { usePlansStore } from '@/stores/plans-store';
import { cn } from '@/lib/utils';

export default function PlanesPage() {
  const { memberSlot } = useAuthStore();
  const { addPlan, completePlan, deletePlan, getPendingPlans, getCompletedPlans } = usePlansStore();
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const pendingPlans = getPendingPlans();
  const completedPlans = getCompletedPlans();

  const handleSubmit = () => {
    if (title.trim() && memberSlot) {
      addPlan(title.trim(), description.trim() || undefined, memberSlot);
      setTitle('');
      setDescription('');
      setShowForm(false);
    }
  };

  return (
    <AppLayout title="Planes">
      <div className="page-container space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeTab === 'pending'
                  ? 'bg-pastel-pink-100 text-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              Pendientes ({pendingPlans.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeTab === 'completed'
                  ? 'bg-pastel-green-100 text-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              Logrados ({completedPlans.length})
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? '✕' : '+'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-4 space-y-3 border-2 border-pastel-pink-200">
            <Input
              placeholder="¿Qué quieren hacer juntos?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <Button onClick={handleSubmit} disabled={!title.trim()} className="w-full">
              Agregar plan
            </Button>
          </Card>
        )}

        {/* Plans List */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {pendingPlans.length === 0 ? (
              <div className="empty-state">
                <p className="text-4xl mb-2">🎯</p>
                <p className="text-gray-500">No hay planes pendientes</p>
                <p className="text-sm text-gray-400 mt-1">¡Agreguen algo que quieran hacer juntos!</p>
              </div>
            ) : (
              pendingPlans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => completePlan(plan.id)}
                      className="mt-1 w-5 h-5 rounded-full border-2 border-pastel-pink-200 flex-shrink-0 hover:bg-pastel-pink-100 transition-all"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedPlans.length === 0 ? (
              <div className="empty-state">
                <p className="text-4xl mb-2">✨</p>
                <p className="text-gray-500">Aún no han completado planes</p>
              </div>
            ) : (
              completedPlans.map((plan) => (
                <Card key={plan.id} className="p-4 bg-pastel-green-50/50">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-pastel-green-400">✓</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-600 line-through">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
