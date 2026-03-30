import { createContext, useContext } from 'react'
import type { Client } from '@/lib/types'

export type Ctx = {
  client: Client | null
  setClient: (c: Client) => void
  clients: Client[]
  isAdmin: boolean
  dark: boolean
  setDark: (v: boolean) => void
  toast: (title: string, body: string) => void
}

export const AppCtx = createContext<Ctx>({} as Ctx)
export const useApp = () => useContext(AppCtx)
