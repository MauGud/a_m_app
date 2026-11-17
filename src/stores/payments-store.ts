import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured, logSupabaseError } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { useActivitiesStore } from './activities-store';
import { mergeById } from '@/lib/merge';
import { notifyCouple } from '@/lib/notifications';
import { MEMBER_NAMES, type MemberSlot, type RecurringType } from '@/lib/constants';
import { getNextDueDate, getTodayISO } from '@/lib/utils';
import { formatMoney } from '@/lib/finanzas';

export interface PaymentReminder {
  id: string;
  title: string;
  amount: number;
  notes?: string;
  due_date: string;
  assigned_to: MemberSlot;
  created_by: MemberSlot;
  status: 'pending' | 'completed';
  recurring: RecurringType;
  created_at: string;
  completed_at?: string;
  notified_at?: string;
  updated_at?: string;
}

interface PaymentsState {
  payments: PaymentReminder[];
  addPayment: (input: Omit<PaymentReminder, 'id' | 'status' | 'created_at' | 'completed_at'>) => Promise<PaymentReminder>;
  completePayment: (id: string) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
  notifyDuePayments: (member: MemberSlot) => Promise<void>;
}

function paymentActivityTitle(title: string) {
  return `Pago: ${title}`;
}

function findPaymentActivity(payment: Pick<PaymentReminder, 'title' | 'due_date'>) {
  const title = paymentActivityTitle(payment.title);
  return useActivitiesStore
    .getState()
    .activities.find(
      (activity) =>
        activity.category === 'pago' &&
        activity.title === title &&
        activity.due_date === payment.due_date
    );
}

function toDb(payment: PaymentReminder, instanceId: string) {
  return {
    id: payment.id,
    instance_id: instanceId,
    title: payment.title,
    amount: payment.amount,
    notes: payment.notes || null,
    due_date: payment.due_date,
    assigned_to: payment.assigned_to,
    created_by: payment.created_by,
    status: payment.status,
    recurring: payment.recurring,
    created_at: payment.created_at,
    completed_at: payment.completed_at || null,
    notified_at: payment.notified_at || null,
  };
}

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set, get) => ({
      payments: [],

      addPayment: async (input) => {
        const now = new Date().toISOString();
        const payment: PaymentReminder = {
          ...input,
          id: crypto.randomUUID(),
          status: 'pending',
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ payments: [payment, ...state.payments] }));
        void useActivitiesStore.getState().addActivity({
          title: paymentActivityTitle(payment.title),
          description: formatMoney(payment.amount),
          category: 'pago',
          due_date: payment.due_date,
          assigned_to: payment.assigned_to,
          created_by: payment.created_by,
          recurring: 'none',
        });

        const auth = useAuthStore.getState();
        void (async () => {
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                const { error } = await client.from('payments').insert(toDb(payment, auth.instanceId));
                if (error) logSupabaseError('payments.insert', error);
              }
            } catch (err) {
              console.warn('Could not sync payment:', err);
            }
          }
          const assignee = MEMBER_NAMES[payment.assigned_to];
          const creator = MEMBER_NAMES[payment.created_by];
          await notifyCouple(
            `Pago para ${assignee}`,
            `${creator} apuntó ${payment.title} · ${formatMoney(payment.amount)} · ${payment.due_date}`
          );
        })();
        return payment;
      },

      completePayment: async (id) => {
        const payment = get().payments.find((p) => p.id === id);
        if (!payment) return;
        const completedAt = new Date().toISOString();
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, status: 'completed', completed_at: completedAt, updated_at: completedAt } : p
          ),
        }));
        const linked = findPaymentActivity(payment);
        if (linked && linked.status === 'pending') {
          void useActivitiesStore.getState().completeActivity(linked.id, payment.assigned_to);
        }

        const auth = useAuthStore.getState();
        void (async () => {
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client
                  .from('payments')
                  .update({ status: 'completed', completed_at: completedAt })
                  .eq('id', id);
              }
            } catch (err) {
              console.warn('Could not sync payment completion:', err);
            }
          }
        })();

        const nextDate = getNextDueDate(payment.due_date, payment.recurring);
        if (nextDate) {
          void get().addPayment({
            title: payment.title,
            amount: payment.amount,
            notes: payment.notes,
            due_date: nextDate,
            assigned_to: payment.assigned_to,
            created_by: payment.created_by,
            recurring: payment.recurring,
          });
        }
      },

      deletePayment: async (id) => {
        const payment = get().payments.find((p) => p.id === id);
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
        if (payment) {
          const linked = findPaymentActivity(payment);
          if (linked) void useActivitiesStore.getState().deleteActivity(linked.id);
        }
        const auth = useAuthStore.getState();
        void (async () => {
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) await client.from('payments').delete().eq('id', id);
            } catch (err) {
              console.warn('Could not sync payment deletion:', err);
            }
          }
        })();
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;
        try {
          const client = auth.getSupabase();
          if (!client) return;
          const { data, error } = await client
            .from('payments')
            .select('*')
            .eq('instance_id', auth.instanceId)
            .order('due_date', { ascending: true });
          if (error) {
            logSupabaseError('payments.fetch', error);
            return;
          }
          if (!data) return;
          const remote: PaymentReminder[] = data.map((d) => ({
            id: d.id,
            title: d.title,
            amount: Number(d.amount) || 0,
            notes: d.notes || undefined,
            due_date: d.due_date,
            assigned_to: d.assigned_to,
            created_by: d.created_by,
            status: d.status,
            recurring: d.recurring || 'none',
            created_at: d.created_at,
            completed_at: d.completed_at || undefined,
            notified_at: d.notified_at || undefined,
            updated_at: d.updated_at || d.created_at,
          }));
          set({ payments: mergeById(get().payments, remote) });
        } catch (err) {
          console.warn('Could not fetch payments:', err);
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};
        const channel = supabase
          .channel(`payments-changes-${auth.instanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'payments',
              filter: `instance_id=eq.${auth.instanceId}`,
            },
            () => {
              get().fetchFromSupabase();
            }
          )
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      },

      notifyDuePayments: async (member) => {
        const today = getTodayISO();
        const due = get().payments.filter(
          (p) => p.status === 'pending' && p.assigned_to === member && p.due_date <= today
        );
        for (const payment of due) {
          if (payment.notified_at && payment.notified_at.slice(0, 10) === today) continue;
          await notifyCouple(
            `Pago de ${payment.title}`,
            `${formatMoney(payment.amount)} vence ${payment.due_date === today ? 'hoy' : payment.due_date}`
          );
          set((state) => ({
            payments: state.payments.map((p) =>
              p.id === payment.id ? { ...p, notified_at: new Date().toISOString() } : p
            ),
          }));
        }
      },
    }),
    {
      name: 'espacio-pareja-payments',
      partialize: (state) => ({ payments: state.payments }),
    }
  )
);
