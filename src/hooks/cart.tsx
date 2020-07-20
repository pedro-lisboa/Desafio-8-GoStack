import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarket:products');

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  // useEffect(() => {
  //   async function saveProducts(): Promise<void> {
  //     await AsyncStorage.setItem(
  //       '@GoMarket:products',
  //       JSON.stringify(products),
  //     );
  //   }

  //   saveProducts();
  // }, [products]);

  const addToCart = useCallback(
    async (product: Product) => {
      // verificar se já existe um produto no carrinho
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex >= 0) {
        const productsCopy = [...products];
        productsCopy[productIndex].quantity += 1;
        setProducts(productsCopy);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(async (id: string) => {
    setProducts(oldState =>
      oldState.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      }),
    );

    await AsyncStorage.setItem('@GoMarket:products', JSON.stringify(products));
  }, []);

  const decrement = useCallback(async (id: string) => {
    setProducts(oldState =>
      oldState.map(product => {
        if (product.id === id && product.quantity > 1) {
          return {
            ...product,
            quantity: product.quantity - 1,
          };
        }
        return product;
      }),
    );

    await AsyncStorage.setItem('@GoMarket:products', JSON.stringify(products));
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
