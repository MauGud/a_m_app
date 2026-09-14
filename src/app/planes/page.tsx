'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmModal } from '@/components/ui/confirm-modal';
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
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const handleComplete = (id: string) => {
    setCompleting(id);
    setTimeout(() => {
      completePlan(id);
      setCompleting(null);
    }, 300);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deletePlan(deleteConfirm);
      setDeleteConfirm(null);
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
                <Card 
                  key={plan.id} 
                  className={cn(
                    "p-4 transition-all duration-300",
                    completing === plan.id && "bg-pastel-green-100 scale-95 opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(plan.id)}
                      disabled={completing === plan.id}
                      className={cn(
                        "mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center",
                        completing === plan.id 
                          ? "border-pastel-green-400 bg-pastel-green-200"
                          : "border-pastel-pink-200 hover:bg-pastel-pink-100 hover:border-pastel-pink-300 active:scale-90"
                      )}
                    >
                      {completing === plan.id && <span className="text-pastel-green-600 text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(plan.id)}
                      className="text-gray-400 hover:text-red-500 p-2 -m-2 hover:bg-red-50 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                    <span className="mt-1 w-6 h-6 rounded-full bg-pastel-green-200 flex items-center justify-center text-pastel-green-600 text-sm flex-shrink-0">✓</span>
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="¿Eliminar plan?"
        message="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}
