import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { cartApi, wishlistApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';

interface ShopContextValue {
  cartCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<boolean>;
  wished: (productId: number) => boolean;
  toggleWish: (productId: number) => Promise<void>;
}

const ShopContext = createContext<ShopContextValue | null>(null);

/** 장바구니 개수와 찜 목록을 헤더·상품 카드·상세 페이지가 함께 쓰도록 모아 둡니다. */
export function ShopProvider({ children }: { children: ReactNode }) {
  const { member, requireMember } = useAuth();
  const toast = useToast();
  const [cartCount, setCartCount] = useState(0);
  const [wishIds, setWishIds] = useState<Set<number>>(new Set());

  const refreshCart = useCallback(async () => {
    if (!member) {
      setCartCount(0);
      return;
    }
    try {
      setCartCount((await cartApi.count()).count);
    } catch {
      setCartCount(0);
    }
  }, [member]);

  useEffect(() => {
    void refreshCart();
    if (!member) {
      setWishIds(new Set());
      return;
    }
    wishlistApi
      .ids()
      .then((ids) => setWishIds(new Set(ids)))
      .catch(() => setWishIds(new Set()));
  }, [member, refreshCart]);

  const addToCart = useCallback(
    async (productId: number, quantity: number) => {
      if (!requireMember('장바구니는 회원만 이용할 수 있어요.')) return false;
      try {
        const cart = await cartApi.add(productId, quantity);
        setCartCount(cart.items.length);
        return true;
      } catch (e) {
        toast(e instanceof ApiError ? e.message : '장바구니에 담지 못했어요.');
        return false;
      }
    },
    [requireMember, toast],
  );

  const toggleWish = useCallback(
    async (productId: number) => {
      if (!requireMember('찜한 향은 회원만 모아 둘 수 있어요.')) return;
      const had = wishIds.has(productId);
      setWishIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (had) await wishlistApi.remove(productId);
        else await wishlistApi.add(productId);
        toast(had ? '찜한 향에서 뺐어요.' : '찜한 향에 담았어요. 마이페이지에서 다시 볼 수 있어요.');
      } catch {
        setWishIds((prev) => {
          const next = new Set(prev);
          if (had) next.add(productId);
          else next.delete(productId);
          return next;
        });
        toast('잠시 후 다시 시도해 주세요.');
      }
    },
    [requireMember, toast, wishIds],
  );

  const value = useMemo(
    () => ({ cartCount, refreshCart, addToCart, wished: (id: number) => wishIds.has(id), toggleWish }),
    [cartCount, refreshCart, addToCart, wishIds, toggleWish],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
