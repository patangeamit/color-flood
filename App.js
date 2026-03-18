import React, { useCallback, useEffect, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Share, View } from "react-native"
import GameDialog from "./src/components/GameDialog"
import {
  DIALOG_IDLE,
  MAX_LEVELS,
  STARTING_COINS,
  STARTING_GEMS,
  STORAGE_KEY,
  getLevelConfig
} from "./src/config"
import GameScreen from "./src/screens/GameScreen"
import HomeScreen from "./src/screens/HomeScreen"
import LevelSelectScreen from "./src/screens/LevelSelectScreen"
import StoreScreen from "./src/screens/StoreScreen"
import styles from "./src/styles"

export default function App() {
  const [screen, setScreen] = useState("home")
  const [highScore, setHighScore] = useState(0)
  const [coins, setCoins] = useState(STARTING_COINS)
  const [gems, setGems] = useState(STARTING_GEMS)
  const [unlockedLevel, setUnlockedLevel] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [gameSession, setGameSession] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [dialog, setDialog] = useState(DIALOG_IDLE)

  const dialogResolverRef = useRef(null)
  const coinsRef = useRef(coins)
  const gemsRef = useRef(gems)
  const unlockedLevelRef = useRef(unlockedLevel)

  useEffect(() => {
    coinsRef.current = coins
    gemsRef.current = gems
    unlockedLevelRef.current = unlockedLevel
  }, [coins, gems, unlockedLevel])

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      let savedState = null

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        savedState = raw ? JSON.parse(raw) : null
      } catch (error) {
        savedState = null
      }

      if (mounted && savedState) {
        setHighScore(savedState.highScore ?? 0)
        setCoins(savedState.coins ?? savedState.diamonds ?? STARTING_COINS)
        setGems(savedState.gems ?? STARTING_GEMS)
        setUnlockedLevel(savedState.unlockedLevel ?? 1)
        setSelectedLevel(savedState.selectedLevel ?? 1)
      }

      if (mounted) {
        setIsReady(true)
      }
    }

    loadProgress()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!isReady) return

    async function persistProgress() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            highScore,
            coins,
            gems,
            unlockedLevel,
            selectedLevel
          })
        )
      } catch (error) {
        // Ignore persistence failures and keep the game playable.
      }
    }

    persistProgress()
  }, [coins, gems, highScore, isReady, selectedLevel, unlockedLevel])

  const showDialog = useCallback(async ({ title, message, actions }) => {
    return new Promise(resolve => {
      dialogResolverRef.current = resolve
      setDialog({ visible: true, title, message, actions })
    })
  }, [])

  const closeDialog = useCallback(action => {
    setDialog(DIALOG_IDLE)

    if (dialogResolverRef.current) {
      dialogResolverRef.current(action)
      dialogResolverRef.current = null
    }
  }, [])

  const promptGemShop = useCallback(async requiredCoins => {
    const action = await showDialog({
      title: "Not enough coins",
      message: `You need ${requiredCoins} coins to keep playing. Open the gem shop?`,
      actions: [
        { key: "cancel", label: "Not now", style: "ghost" },
        { key: "shop", label: "Open Shop", style: "primary" }
      ]
    })

    if (action === "shop") {
      setScreen("shop")
    }

    return action
  }, [showDialog])

  const enterLevel = useCallback(async level => {
    if (level > unlockedLevelRef.current) return

    const { entryCost } = getLevelConfig(level)

    if (coinsRef.current < entryCost) {
      await promptGemShop(entryCost)
      return
    }

    setCoins(current => current - entryCost)
    setSelectedLevel(level)
    setGameSession(current => current + 1)
    setScreen("game")
  }, [promptGemShop])

  const collectWin = useCallback((level, score) => {
    const { reward } = getLevelConfig(level)
    const nextUnlocked = Math.max(
      unlockedLevelRef.current,
      Math.min(MAX_LEVELS, level + 1)
    )
    const availableCoins = coinsRef.current + reward

    setCoins(availableCoins)
    setUnlockedLevel(nextUnlocked)
    setHighScore(current => Math.max(current, score))

    return { reward, availableCoins }
  }, [])

  const handleWin = useCallback(async (level, score, action) => {
    const outcome = collectWin(level, score)

    if (action === "next" && level < MAX_LEVELS) {
      const nextLevel = level + 1
      const { entryCost } = getLevelConfig(nextLevel)

      if (outcome.availableCoins >= entryCost) {
        setCoins(outcome.availableCoins - entryCost)
        setSelectedLevel(nextLevel)
        setGameSession(current => current + 1)
        setScreen("game")
        return
      }

      const nextAction = await promptGemShop(entryCost)
      if (nextAction !== "shop") {
        setScreen("levels")
      }
      return
    }

    setScreen("levels")
  }, [collectWin, promptGemShop])

  const handleRetry = useCallback(async level => {
    await enterLevel(level)
  }, [enterLevel])

  const handleExitLevel = useCallback(async () => {
    const action = await showDialog({
      title: "Leave level?",
      message: "You can replay it any time from the level select.",
      actions: [
        { key: "stay", label: "Stay", style: "ghost" },
        { key: "leave", label: "Leave", style: "primary" }
      ]
    })

    if (action === "leave") {
      setScreen("levels")
    }
  }, [showDialog])

  const handleRestorePurchases = useCallback(async () => {
    await showDialog({
      title: "Restore purchases",
      message:
        "Purchase restore is not connected yet. The hard-currency shop is ready for real billing integration.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }, [showDialog])

  const handleBuyGemPack = useCallback(async pack => {
    const totalGems = pack.amount + pack.bonus
    setGems(current => current + totalGems)

    await showDialog({
      title: "Purchase complete",
      message: `Added ${totalGems} gems to your wallet for ${pack.price}.`,
      actions: [{ key: "ok", label: "Nice", style: "primary" }]
    })
  }, [showDialog])

  const handleExchangeGems = useCallback(async offer => {
    if (gemsRef.current < offer.gems) {
      await showDialog({
        title: "Not enough gems",
        message: `You need ${offer.gems} gems to claim this coin bundle.`,
        actions: [{ key: "ok", label: "OK", style: "primary" }]
      })
      return
    }

    setGems(current => current - offer.gems)
    setCoins(current => current + offer.coins)

    await showDialog({
      title: "Exchange complete",
      message: `Converted ${offer.gems} gems into ${offer.coins} coins.`,
      actions: [{ key: "ok", label: "Great", style: "primary" }]
    })
  }, [showDialog])

  const handleHackProgress = useCallback(async () => {
    setCoins(999)
    setGems(250)
    setUnlockedLevel(MAX_LEVELS)
    setSelectedLevel(MAX_LEVELS)

    await showDialog({
      title: "Test boost active",
      message: "Unlocked all levels and topped up coins and gems for testing.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }, [showDialog])

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message:
          "Come play Color Flood with me. Clear boards, unlock stages, and chase a higher score."
      })
    } catch (error) {
      await showDialog({
        title: "Share unavailable",
        message: "Sharing is not available on this device right now.",
        actions: [{ key: "ok", label: "OK", style: "primary" }]
      })
    }
  }, [showDialog])

  const handleRateApp = useCallback(async () => {
    await showDialog({
      title: "Rate Color Flood",
      message:
        "The store rating link is the last thing left to connect. The button is ready once you have the app URL.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }, [showDialog])

  if (!isReady) {
    return <View style={styles.splashScreen} />
  }

  if (screen === "home") {
    return (
      <>
        <HomeScreen
          highScore={highScore}
          coins={coins}
          gems={gems}
          onPlay={() => setScreen("levels")}
          onOpenShop={() => setScreen("shop")}
          onShareApp={handleShareApp}
          onRateApp={handleRateApp}
        />
        <GameDialog dialog={dialog} onClose={closeDialog} />
      </>
    )
  }

  if (screen === "shop") {
    return (
      <>
        <StoreScreen
          coins={coins}
          gems={gems}
          onBack={() => setScreen("home")}
          onBuyGemPack={handleBuyGemPack}
          onExchangeGems={handleExchangeGems}
          onRestorePurchases={handleRestorePurchases}
          onHackPress={handleHackProgress}
        />
        <GameDialog dialog={dialog} onClose={closeDialog} />
      </>
    )
  }

  if (screen === "levels") {
    return (
      <>
        <LevelSelectScreen
          coins={coins}
          gems={gems}
          unlockedLevel={unlockedLevel}
          selectedLevel={selectedLevel}
          onBack={() => setScreen("home")}
          onSelectLevel={enterLevel}
        />
        <GameDialog dialog={dialog} onClose={closeDialog} />
      </>
    )
  }

  return (
    <>
      <GameScreen
        level={selectedLevel}
        sessionId={gameSession}
        coins={coins}
        gems={gems}
        highScore={highScore}
        onBackToLevels={handleExitLevel}
        onRetry={handleRetry}
        onWin={handleWin}
        onShareApp={handleShareApp}
        onRateApp={handleRateApp}
      />
      <GameDialog dialog={dialog} onClose={closeDialog} />
    </>
  )
}
