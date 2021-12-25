import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const localStorageKey = "@RocketShoes:cart"

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(localStorageKey);
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart] 
      const productExists = newCart.find(product => product.id === productId)
      const currentAmount = productExists? productExists.amount : 0
      const amount = currentAmount+1 

      if(productExists){
        if(await vefStock(productId, amount)){
          productExists.amount = amount
          saveCart(newCart)
        }
      }else{
        const newProduct = await getProduct(productId) as Product
        newCart.push({...newProduct, amount: amount})
        saveCart(newCart)
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const productIndex = newCart.findIndex(product => product.id === productId)
      
      if(productIndex >= 0){
        newCart.splice(productIndex, 1)
        saveCart(newCart)
        return true
      }
        
      throw Error()
      
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount < 1)
        return false

      const newCart = [...cart]
      const productExists = newCart.find(product => product.id === productId)

      if(productExists){        
        if(await vefStock(productId, amount)){
          productExists.amount = amount
          saveCart(newCart)
          return true
        }          
        else{
          return false
        }          
      }

      throw Error()

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  const saveCart = (newCart: Product[]) => {
    localStorage.setItem(localStorageKey, JSON.stringify(newCart))
    setCart(newCart)
  }

  const vefStock = async (productId: number, amount: number) => {
    let response = await api.get(`/stock/${productId}`)
    let stock = response.data as Stock
    if(stock.amount >= amount){
      return true
    }else{
      toast.error('Quantidade solicitada fora de estoque')
      return false
    }
  }

  const getProduct = async (productId: number) => {
    let response = await api.get(`/products/${productId}`)
    return response.data as Product
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
