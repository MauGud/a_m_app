'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MAU_OPS_EMAIL, MAX_PAYMENT_METHODS } from '@/lib/security';
import { mailtoForIncident, useOpsStore } from '@/stores/ops-store';

export function TallerPanel() {
  const incidents = useOpsStore((s) => s.incidents);
  const report = useOpsStore((s) => s.report);
  const markSent = useOpsStore((s) => s.markSent);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  const send = () => {
    setError('');
    try {
      report(draft);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se guardó.');
    }
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      setCopied('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Protocolo de tarjetas · peras y manzanas</h3>
        <p className="text-sm text-gray-600">
          Si esta app pudiera teclear tu tarjeta en Walmart, esta app ya tendría tu tarjeta. Eso es justo lo que un
          hacker busca. Por eso no lo hacemos.
        </p>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>1.</strong> Tú le das los 16 dígitos al banco o a Nu, nunca a A & M.
          </p>
          <p>
            <strong>2.</strong> Aquí solo vive un apodo, la marca y cuatro dígitos. Máximo {MAX_PAYMENT_METHODS}{' '}
            métodos.
          </p>
          <p>
            <strong>3.</strong> La lista sale de aquí. El cobro ocurre en la caja de Walmart, Chedraui, Soriana, Costco o
            Sam’s, con su propio candado.
          </p>
          <p>
            <strong>4.</strong> Un token de Stripe o Mercado Pago no abre la caja de Walmart. Distinto candado, distinta
            llave. Por eso un bot que “pague por ti” exigiría guardar el número. Eso se rechaza.
          </p>
        </div>
        <div className="rounded-2xl bg-pastel-blue-50 p-3 text-sm space-y-1">
          <p>Tú → lista → A & M → Maps / WhatsApp</p>
          <p>Tú → números → banco / Nu</p>
          <p>A & M nunca → números → súper</p>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Taller de Mau</h3>
        <p className="text-sm text-gray-600">
          Dilo en lenguaje normal. Yo clasifico el impacto, te armo el recado para Cursor y lo mando a {MAU_OPS_EMAIL}.
          Amanda no ve esto.
        </p>
        <Textarea
          rows={3}
          value={draft}
          placeholder="Se trabó la lista del súper o un aviso"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button className="w-full" disabled={!draft.trim()} onClick={send}>
          Registrar
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </Card>

      {incidents.map((incident) => (
        <Card key={incident.id} className="p-4 space-y-2">
          <p className="text-sm font-medium">{incident.report.title}</p>
          <p className="text-sm text-gray-600">{incident.text}</p>
          <p className="text-xs text-gray-500">{incident.report.summary}</p>
          {incident.report.alsoTouches.length > 0 && (
            <p className="text-xs text-gray-500">También toca: {incident.report.alsoTouches.join(', ')}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copy(incident.cursorPrompt, incident.id)}
            >
              {copied === incident.id ? 'Copiado' : 'Copiar para Cursor'}
            </Button>
            <a href={mailtoForIncident(incident)} onClick={() => markSent(incident.id)}>
              <Button size="sm" variant="ghost">
                Correo a Mau
              </Button>
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
