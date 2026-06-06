import { create } from "zustand";
import { CartItem, FishProduct, CategoryFilter } from "@/types";

interface StoreState {
  // Cart
  cart: CartItem[];
  orderGroups: string[];
  activeOrderGroup: string;
  addToCart: (
    product: FishProduct,
    size: string,
    quantity?: number,
    group?: string,
  ) => void;
  removeFromCart: (productId: number, size: string, group?: string) => void;
  updateQuantity: (
    productId: number,
    size: string,
    quantity: number,
    group?: string,
  ) => void;
  moveToGroup: (
    productId: number,
    size: string,
    fromGroup: string,
    toGroup: string,
  ) => void;
  addOrderGroup: (name: string) => void;
  removeOrderGroup: (name: string) => void;
  renameOrderGroup: (oldName: string, newName: string) => void;
  setActiveOrderGroup: (group: string) => void;
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
  selectedSize: string;
  setSelectedProduct: (product: FishProduct | null) => void;
  setSelectedSize: (size: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Cart state
  cart: [],
  orderGroups: ["Order A"],
  activeOrderGroup: "Order A",
  addToCart: (product, size, quantity = 1, group) => {
    const { cart, orderGroups, activeOrderGroup } = get();
    const targetGroup = group || activeOrderGroup;
    // Ensure the group exists
    if (!orderGroups.includes(targetGroup)) {
      set({ orderGroups: [...orderGroups, targetGroup] });
    }
    const existing = cart.find(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === size &&
        item.group === targetGroup,
    );
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.group === targetGroup
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        ),
      });
    } else {
      set({
        cart: [...cart, { product, selectedSize: size, quantity, group: targetGroup }],
      });
    }
  },
  removeFromCart: (productId, size, group) => {
    set({
      cart: get().cart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            (group ? item.group === group : true)
          ),
      ),
    });
  },
  updateQuantity: (productId, size, quantity, group) => {
    if (quantity <= 0) {
      get().removeFromCart(productId, size, group);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId &&
        item.selectedSize === size &&
        (group ? item.group === group : true)
          ? { ...item, quantity }
          : item,
      ),
    });
  },
  moveToGroup: (productId, size, fromGroup, toGroup) => {
    const { cart, orderGroups } = get();
    if (!orderGroups.includes(toGroup)) {
      set({ orderGroups: [...orderGroups, toGroup] });
    }
    // Check if same product+size exists in target group
    const targetExisting = cart.find(
      (item) =>
        item.product.id === productId &&
        item.selectedSize === size &&
        item.group === toGroup,
    );
    const source = cart.find(
      (item) =>
        item.product.id === productId &&
        item.selectedSize === size &&
        item.group === fromGroup,
    );
    if (!source) return;

    if (targetExisting) {
      // Merge quantities
      set({
        cart: cart
          .filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === size &&
                item.group === fromGroup
              ),
          )
          .map((item) =>
            item.product.id === productId &&
            item.selectedSize === size &&
            item.group === toGroup
              ? { ...item, quantity: item.quantity + source.quantity }
              : item,
          ),
      });
    } else {
      set({
        cart: cart.map((item) =>
          item.product.id === productId &&
          item.selectedSize === size &&
          item.group === fromGroup
            ? { ...item, group: toGroup }
            : item,
        ),
      });
    }
  },
  addOrderGroup: (name) => {
    const { orderGroups } = get();
    if (!orderGroups.includes(name)) {
      set({ orderGroups: [...orderGroups, name], activeOrderGroup: name });
    }
  },
  removeOrderGroup: (name) => {
    const { orderGroups, cart, activeOrderGroup } = get();
    if (orderGroups.length <= 1) return; // Keep at least one
    // Move items from this group to the first remaining group
    const remaining = orderGroups.filter((g) => g !== name);
    const fallback = remaining[0];
    set({
      orderGroups: remaining,
      activeOrderGroup: activeOrderGroup === name ? fallback : activeOrderGroup,
      cart: cart.map((item) =>
        item.group === name ? { ...item, group: fallback } : item,
      ),
    });
  },
  renameOrderGroup: (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    const { orderGroups, cart, activeOrderGroup } = get();
    set({
      orderGroups: orderGroups.map((g) => (g === oldName ? newName : g)),
      cart: cart.map((item) =>
        item.group === oldName ? { ...item, group: newName } : item,
      ),
      activeOrderGroup: activeOrderGroup === oldName ? newName : activeOrderGroup,
    });
  },
  setActiveOrderGroup: (group) => set({ activeOrderGroup: group }),
  clearCart: () => set({ cart: [], orderGroups: ["Order A"], activeOrderGroup: "Order A" }),
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
  selectedSize: "",
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedSize: (size) => set({ selectedSize: size }),
}));
