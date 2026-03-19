import { StatusBar } from "react-native"

export const COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#e67e22"
]

export const MAX_LEVELS = 45
export const STARTING_COINS = 8
export const STARTING_GEMS = 0
export const DAILY_GEM_REWARD = 3
export const DAILY_REWARD_INTERVAL_MS = 24 * 60 * 60 * 1000
export const DIALOG_IDLE = { visible: false, title: "", message: "", actions: [] }
export const STORAGE_KEY = "color-flood-progress"
export const TOP_INSET = (StatusBar.currentHeight || 0) + 12
export const HEADER_HEIGHT = 72
export const GEM_PACKS = [
  { id: "starter", title: "Starter Pack", amount: 25, bonus: 5, price: "₹99" },
  { id: "stack", title: "Gem Stack", amount: 70, bonus: 20, price: "₹249" },
  { id: "vault", title: "Gem Vault", amount: 160, bonus: 60, price: "₹499" }
]
export const COIN_EXCHANGE_OFFERS = [
  { id: "boost", gems: 5, coins: 20 },
  { id: "bundle", gems: 12, coins: 55 }
]

export function getLevelConfig(level) {
  const index = Math.max(0, level - 1)
  const cols = Math.min(5 + Math.floor((index + 1) / 2), 18)
  const rows = Math.min(7 + Math.floor(index / 2), 21)
  const moveLimit = Math.max(10, rows + cols + 2 + Math.floor(index / 16))
  const entryCost = 1 + Math.floor(index / 2)
  const reward = entryCost + 3

  return { rows, cols, moveLimit, entryCost, reward }
}

export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
  const seconds = String(totalSeconds % 60).padStart(2, "0")

  return `${hours}:${minutes}:${seconds}`
}
