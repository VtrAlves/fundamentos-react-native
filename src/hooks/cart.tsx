import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect
} from 'react'
import { Alert } from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'

interface Product {
  id: string
  title: string
  image_url: string
  price: number
  quantity: number
}

interface CartContext {
  products: Product[]
  addToCart(item: Omit<Product, 'quantity'>): void
  increment(id: string): void
  decrement(id: string): void
}

const CartContext = createContext<CartContext | null>(null)

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem('@GoMarketPlace:cart')
      if (cartProducts) {
        setProducts(JSON.parse(cartProducts))
      }
    }

    loadProducts()
  }, [])

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(item => product.id === item.id)

      if (!productExist) {
        const productWithQuantity = product

        productWithQuantity.quantity = 1

        const newProducts = products.concat([productWithQuantity])

        await AsyncStorage.setItem(
          '@GoMarketPlace:cart',
          JSON.stringify(newProducts)
        )

        setProducts(newProducts)
        return
      }

      const newQuantity = productExist.quantity + 1 || 1

      productExist.quantity = newQuantity

      const productsExceptNew = products.filter(item => product.id !== item.id)

      const productsUpdated = productsExceptNew.concat([product])

      setProducts(productsUpdated)

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(productsUpdated)
      )
    },
    [products]
  )

  const increment = useCallback(
    async id => {
      const product = products.find(item => item.id === id)

      if (!product) {
        Alert.alert(
          'Erro',
          'Ocorreu um erro ao incluir mais um produto no carrinho'
        )
        return
      }

      const newQuantity = product.quantity + 1 || 1

      product.quantity = newQuantity

      const productsExceptModified = products.filter(item => item.id !== id)

      const productsUpdated = productsExceptModified.concat([product])

      setProducts(productsUpdated)

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(productsUpdated)
      )
    },
    [products]
  )

  const decrement = useCallback(
    async id => {
      const product = products.find(item => item.id === id)

      if (!product) {
        Alert.alert('Erro', 'Ocorreu um erro ao excluir o produto do carrinho')
        return
      }

      const newQuantity = product.quantity - 1

      product.quantity = newQuantity

      const productsExceptModified = products.filter(item => item.id !== id)

      const productsUpdated =
        newQuantity === 0
          ? productsExceptModified
          : productsExceptModified.concat([product])

      setProducts(productsUpdated)

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(productsUpdated)
      )
    },
    [products]
  )

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart(): CartContext {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`)
  }

  return context
}

export { CartProvider, useCart }
