import { create } from "zustand";
import { CartItem, FishProduct, CategoryFilter } from "@/types";

interface StoreState {
  // Cart
  cart: CartItem[];
  addToCart: (product: FishProduct, size: string, quantity?: number) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Catalogue filters
  activeCategory: CategoryFilter;
  setActiveCategory: (category: CategoryFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  quoteModalOpen: boolean;
  setQuoteModalOpen: (open: boolean) => void;
  selectedProduct: FishProduct | null;
  setSelectedProduct: (product: FishProduct | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Cart state
  cart: [],
  addToCart: (product, size, quantity = 1) => {
    const { cart } = get();
    const existing = cart.find(
      (item) => item.product.id === product.id && item.selectedSize === size,
    );
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        ),
      });
    } else {
      set({ cart: [...cart, { product, selectedSize: size, quantity }] });
    }
  },
  removeFromCart: (productId, size) => {
    set({
      cart: get().cart.filter(
        (item) =>
          !(item.product.id === productId && item.selectedSize === size),
      ),
    });
  },
  updateQuantity: (productId, size, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId, size);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item,
      ),
    });
  },
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

  // Filter state
  activeCategory: "All Species",
  setActiveCategory: (category) => set({ activeCategory: category }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // UI state
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  quoteModalOpen: false,
  setQuoteModalOpen: (open) => set({ quoteModalOpen: open }),
  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}));
