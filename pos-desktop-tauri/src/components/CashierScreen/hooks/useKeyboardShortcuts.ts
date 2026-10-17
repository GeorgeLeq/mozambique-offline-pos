import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { CartItem } from './useCart';

export function useKeyboardShortcuts(
  cart: CartItem[],
  updateQuantity: (id: string, qty: number) => void,
  removeItem: (id: string) => void,
  clearCart: () => void,
  onCheckoutCash: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field (except Escape to blur)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'F12') {
        if (cart.length > 0) {
          e.preventDefault();
          onCheckoutCash();
        }
      } else if (e.key === 'Backspace') {
        if (cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          removeItem(lastItem.id);
          toast(`Removido: ${lastItem.name}`, { icon: '🗑️' });
        }
      } else if (e.key === 'Escape') {
        if (cart.length > 0) {
          e.preventDefault();
          clearCart();
          toast('Carrinho limpo', { icon: '🧹' });
        }
      } else if (e.key === '+' || e.key === 'ArrowUp') {
        if (cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          updateQuantity(lastItem.id, lastItem.quantity + 1);
          toast.success(`${lastItem.name}: Qtd + 1 (${lastItem.quantity + 1})`, { id: 'qty-change' });
        }
      } else if (e.key === '-' || e.key === 'ArrowDown') {
        if (cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          if (lastItem.quantity > 1) {
            updateQuantity(lastItem.id, lastItem.quantity - 1);
            toast.success(`${lastItem.name}: Qtd - 1 (${lastItem.quantity - 1})`, { id: 'qty-change' });
          } else {
            removeItem(lastItem.id);
            toast(`Removido: ${lastItem.name}`, { icon: '🗑️' });
          }
        }
      } else if (e.key === '*' || e.key === 'q' || e.key === 'Q') {
        if (cart.length > 0) {
          e.preventDefault();
          const lastItem = cart[cart.length - 1];
          const val = prompt(`Digite a quantidade para ${lastItem.name}:`, lastItem.quantity.toString());
          if (val !== null) {
            const qty = parseInt(val, 10);
            if (!isNaN(qty) && qty > 0) {
              updateQuantity(lastItem.id, qty);
              toast.success(`${lastItem.name}: Qtd alterada para ${qty}`);
            } else if (qty === 0) {
              removeItem(lastItem.id);
              toast(`Removido: ${lastItem.name}`, { icon: '🗑️' });
            }
          }
        }
      } else if (e.key === '/' || e.key === 'c' || e.key === 'C' || e.key === 'F1') {
        if (cart.length > 0) {
          e.preventDefault();
          onCheckoutCash();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, updateQuantity, removeItem, clearCart, onCheckoutCash]);
}
