/// <reference types="vite/client" />

import type { Wm26Api } from '../../preload/index'

declare global {
  interface Window {
    wm26: Wm26Api
  }
}

export {}
