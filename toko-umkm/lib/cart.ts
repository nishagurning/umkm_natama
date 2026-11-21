export function setActiveCartUser(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem('natama_cart_owner', userId);
  } else {
    localStorage.removeItem('natama_cart_owner');
  }
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCartKey(): string {
  if (typeof window === 'undefined') return 'cart_guest';
  const owner = localStorage.getItem('natama_cart_owner');
  return owner ? `cart_${owner}` : 'cart_guest';
}