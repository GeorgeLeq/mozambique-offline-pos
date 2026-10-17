import React from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { useDeliveryDetails } from './useDeliveryDetails';
import { DetailsHeader } from './DetailsHeader';
import { ItemsTable } from './ItemsTable';
import { DetailsFooter } from './DetailsFooter';
import { useI18n } from '../../../i18n';

interface ExpectedDeliveryDetailsModalProps {
  deliveryId: string;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function ExpectedDeliveryDetailsModal({ deliveryId, onClose, onStatusUpdated }: ExpectedDeliveryDetailsModalProps) {
  const t = useI18n();
  const {
    delivery,
    items,
    receivedQtyMap,
    setReceivedQtyMap,
    verificationMap,
    isLoading,
    isSaving,
    isFullScreen,
    setIsFullScreen,
    handleToggleItemVerification,
    handleConfirmReceipt,
  } = useDeliveryDetails(deliveryId, onClose, onStatusUpdated);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider">{t.filterPending || 'Pendente'}</span>;
      case 'received':
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">{t.filterReceived || 'Recebido'}</span>;
      case 'discrepancy':
        return <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-wider">{t.discrepancy || 'Divergência'}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return createPortal(
    <div key="delivery-details-modal" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs"
      />

      {/* Right Drawer Shell - Full height, right-aligned, instant opening */}
      <div 
        className={`absolute top-0 right-0 bottom-0 ${
          isFullScreen 
            ? 'w-full max-w-full rounded-none' 
            : 'w-full max-w-5xl md:rounded-l-3xl'
        } h-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 text-slate-900 dark:text-white overflow-hidden`}
      >
        <DetailsHeader 
          delivery={delivery}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          onClose={onClose}
        />

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin space-y-5 flex-1 text-slate-700 dark:text-zinc-300">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 font-bold text-sm text-slate-500">
              {t.loadingDetails || 'A carregar detalhes...'}
            </div>
          ) : delivery ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/90 dark:bg-zinc-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.currentStatus || 'Estado Atual'}</span>
                  <div>{getStatusBadge(delivery.status)}</div>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.invoiceRef || 'Nº Fatura / Guia'}</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {delivery.invoice_number || (t.noInvoice || 'Sem Fatura')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.expectedDate || 'Data Prevista'}</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {delivery.expected_date ? new Date(delivery.expected_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.createdBy || 'Criado Por'}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {delivery.creator_name || 'Admin'}
                  </span>
                </div>
              </div>

              {/* Timeline Indicator with Actual Time */}
              <div className="bg-slate-50/80 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                  <Clock size={14} className="text-indigo-600" />
                  {t.timelineTitle || 'Linha do Tempo de Estado'}
                </h3>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-zinc-900" />
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t.orderCreated || 'Encomenda Criada'}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full ${delivery.status !== 'pending' ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-zinc-700'} ring-4 ring-slate-50 dark:ring-zinc-900`} />
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                      <span>{t.statusUpdate || 'Atualização de Estado'}:</span>
                      <span className="uppercase text-[10px] font-black">{delivery.status}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {delivery.updated_at ? new Date(delivery.updated_at).toLocaleString() : (delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>

              <ItemsTable 
                items={items}
                delivery={delivery}
                receivedQtyMap={receivedQtyMap}
                setReceivedQtyMap={setReceivedQtyMap}
                verificationMap={verificationMap}
                handleToggleItemVerification={handleToggleItemVerification}
              />
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">{t.orderNotFound || 'Encomenda não encontrada.'}</div>
          )}
        </div>

        <DetailsFooter 
          delivery={delivery}
          isSaving={isSaving}
          handleConfirmReceipt={handleConfirmReceipt}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
}

