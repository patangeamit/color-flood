import React, { useEffect, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ConfettiCannon from "react-native-confetti-cannon"
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  ScrollView,
  Modal,
  Share
} from "react-native"

const { width, height } = Dimensions.get("window")

const COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#e67e22"
]

const MAX_LEVELS = 20
const STARTING_DIAMONDS = 1
const DIALOG_IDLE = { visible: false, title: "", message: "", actions: [] }
const STORAGE_KEY = "color-flood-progress"

function getLevelConfig(level) {
  const index = Math.max(0, level - 1)
  const cols = Math.min(5 + Math.floor((index + 1) / 2), 12)
  const rows = Math.min(7 + Math.floor(index / 2), 14)
  const moveLimit = rows + cols + 6 + Math.floor(index / 2)
  const entryCost = 1 + Math.floor(index / 2)
  const reward = entryCost + 3

  return { rows, cols, moveLimit, entryCost, reward }
}

export default function App() {
  const [screen, setScreen] = useState("home")
  const [highScore, setHighScore] = useState(0)
  const [diamonds, setDiamonds] = useState(STARTING_DIAMONDS)
  const [unlockedLevel, setUnlockedLevel] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [gameSession, setGameSession] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [dialog, setDialog] = useState(DIALOG_IDLE)
  const dialogResolverRef = useRef(null)

  function openLevelSelect() {
    setScreen("levels")
  }

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      console.log("Loading progress...", STORAGE_KEY)
      let savedState = null

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        savedState = raw ? JSON.parse(raw) : null
      } catch (error) {
        console.log("Failed to load progress, starting fresh.", error)
        savedState = null
      }

      if (mounted && savedState) {
        setHighScore(savedState.highScore ?? 0)
        setDiamonds(savedState.diamonds ?? STARTING_DIAMONDS)
        console.log("Loaded progress:", savedState)
        setUnlockedLevel(savedState.unlockedLevel ?? 1)
        setSelectedLevel(savedState.selectedLevel ?? 1)
      }
      else{
        console.log("No saved progress found, starting fresh.")
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
        console.log("Saving progress...",{
            highScore,
            diamonds,
            unlockedLevel,
            selectedLevel
          } );
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            highScore,
            diamonds,
            unlockedLevel,
            selectedLevel
          })
        )
      } catch (error) {
        // Ignore persistence failures and keep the game playable.
      }
    }

    persistProgress()
  }, [diamonds, highScore, isReady, selectedLevel, unlockedLevel])

  async function showDialog({ title, message, actions }) {
    return new Promise(resolve => {
      dialogResolverRef.current = resolve
      setDialog({ visible: true, title, message, actions })
    })
  }

  function closeDialog(action) {
    setDialog(DIALOG_IDLE)

    if (dialogResolverRef.current) {
      dialogResolverRef.current(action)
      dialogResolverRef.current = null
    }
  }

  async function offerWatchAd(requiredDiamonds) {
    const action = await showDialog({
      title: "Out of diamonds",
      message: `You need ${requiredDiamonds} diamonds to keep playing.`,
      actions: [
        { key: "cancel", label: "Not now", style: "ghost" },
        { key: "watch", label: "Watch Ad", style: "primary" }
      ]
    })

    if (action === "watch") {
      setDiamonds(current => current + 5)

      await showDialog({
        title: "Ad complete",
        message: "You received 5 diamonds.",
        actions: [{ key: "done", label: "Nice", style: "primary" }]
      })
    }
  }

  async function enterLevel(level) {
    if (level > unlockedLevel) return

    const { entryCost } = getLevelConfig(level)

    if (diamonds < entryCost) {
      await offerWatchAd(entryCost)
      return
    }

    setDiamonds(current => current - entryCost)
    setSelectedLevel(level)
    setGameSession(current => current + 1)
    setScreen("game")
  }

  function collectWin(level, score) {
    const { reward } = getLevelConfig(level)
    const nextUnlocked = Math.max(
      unlockedLevel,
      Math.min(MAX_LEVELS, level + 1)
    )
    const availableDiamonds = diamonds + reward

    setDiamonds(availableDiamonds)
    setUnlockedLevel(nextUnlocked)
    setHighScore(current => Math.max(current, score))

    return { reward, availableDiamonds }
  }

  async function handleWin(level, score, action) {
    const outcome = collectWin(level, score)

    if (action === "next" && level < MAX_LEVELS) {
      const nextLevel = level + 1
      const { entryCost } = getLevelConfig(nextLevel)

      if (outcome.availableDiamonds >= entryCost) {
        setDiamonds(outcome.availableDiamonds - entryCost)
        setSelectedLevel(nextLevel)
        setGameSession(current => current + 1)
        setScreen("game")
        return
      }

      await offerWatchAd(entryCost)
    }

    setScreen("levels")
  }

  async function handleRetry(level) {
    await enterLevel(level)
  }

  async function handleExitLevel() {
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
  }

  async function handlePaymentSoon() {
    await showDialog({
      title: "Premium soon",
      message: "Payments are not wired up yet, but the premium screen is ready.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }

  async function handleShareApp() {
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
  }

  async function handleRateApp() {
    await showDialog({
      title: "Rate Color Flood",
      message:
        "The store rating link is the last thing left to connect. The button is ready once you have the app URL.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }

  if (!isReady) {
    return <View style={styles.splashScreen} />
  }

  if (screen === "home") {
    return (
      <>
        <HomeScreen
          highScore={highScore}
          diamonds={diamonds}
          onPlay={openLevelSelect}
          onRemoveAds={() => setScreen("removeAds")}
          onShareApp={handleShareApp}
          onRateApp={handleRateApp}
        />
        <GameDialog dialog={dialog} onClose={closeDialog} />
      </>
    )
  }

  if (screen === "removeAds") {
    return (
      <>
        <RemoveAdsScreen
          diamonds={diamonds}
          onBack={() => setScreen("home")}
          onPremiumPress={handlePaymentSoon}
        />
        <GameDialog dialog={dialog} onClose={closeDialog} />
      </>
    )
  }

  if (screen === "levels") {
    return (
      <>
        <LevelSelectScreen
          diamonds={diamonds}
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
        diamonds={diamonds}
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

function GameScreen({
  level,
  sessionId,
  diamonds,
  highScore,
  onBackToLevels,
  onRetry,
  onWin,
  onShareApp,
  onRateApp
}) {
  const [grid, setGrid] = useState([])
  const [movesLeft, setMovesLeft] = useState(getLevelConfig(level).moveLimit)
  const [territoryColor, setTerritoryColor] = useState(0)
  const [overlay, setOverlay] = useState(null)
  const [score, setScore] = useState(0)
  const [confettiKey, setConfettiKey] = useState(0)

  const overlayOpacity = useRef(new Animated.Value(0)).current
  const paletteScale = useRef(COLORS.map(() => new Animated.Value(1))).current

  const tileAnim = useRef({}).current

  const { rows, cols, moveLimit, entryCost, reward } = getLevelConfig(level)
  const gap = 3
  const horizontalPadding = 24
  const boardMaxWidth = width - horizontalPadding
  const boardMaxHeight = height - 320
  const tileSize = Math.max(
    16,
    Math.floor(
      Math.min(
        (boardMaxWidth - gap * (cols + 1)) / cols,
        (boardMaxHeight - gap * (rows + 1)) / rows
      )
    )
  )

  useEffect(() => {
    newGame()
  }, [level, sessionId])

  function newGame() {
    const { rows: nextRows, cols: nextCols, moveLimit: nextMoveLimit } =
      getLevelConfig(level)

    const g = []

    Object.keys(tileAnim).forEach(key => {
      delete tileAnim[key]
    })

    for (let y = 0; y < nextRows; y++) {
      const row = []
      for (let x = 0; x < nextCols; x++) {
        row.push({
          color: Math.floor(Math.random() * COLORS.length),
          owned: false
        })
      }
      g.push(row)
    }

    g[0][0].owned = true

    setGrid(g)
    setMovesLeft(nextMoveLimit)
    setOverlay(null)
    setScore(0)
    setConfettiKey(0)
    setTerritoryColor(g[0][0].color)
    overlayOpacity.setValue(0)
  }

  function floodFill(newColor) {
    if (overlay) return
    if (newColor === territoryColor) return

    const g = grid.map(r => r.map(t => ({ ...t })))
    const queue = []

    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        if (g[y][x].owned) {
          g[y][x].color = newColor
          queue.push([x, y])
        }
      }
    }

    const absorbed = []

    let queueIndex = 0

    while (queueIndex < queue.length) {
      const [x, y] = queue[queueIndex]
      queueIndex += 1

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]

      for (const [dx, dy] of dirs) {
        const nx = x + dx
        const ny = y + dy

        if (
          nx >= 0 &&
          ny >= 0 &&
          ny < g.length &&
          nx < g[ny].length &&
          !g[ny][nx].owned &&
          g[ny][nx].color === newColor
        ) {
          g[ny][nx].owned = true
          queue.push([nx, ny])
          absorbed.push([nx, ny])
        }
      }
    }

    absorbed.forEach(([x, y]) => {
      const key = `${x}-${y}`
      tileAnim[key] = new Animated.Value(0.85)
      Animated.spring(tileAnim[key], {
        toValue: 1,
        useNativeDriver: true
      }).start()
    })

    const nextMoves = movesLeft - 1
    setGrid(g)
    setTerritoryColor(newColor)
    setMovesLeft(nextMoves)

    const used = moveLimit - nextMoves
    const sc = Math.max(0, 1000 - used * 40)
    setScore(sc)

    checkGame(g, nextMoves, sc)
  }

  function checkGame(g, moves, sc) {
    const first = g[0][0].color

    let all = true

    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        if (g[y][x].color !== first) all = false
      }
    }

    if (all) {
      setOverlay("win")
      setConfettiKey(current => current + 1)

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true
      }).start()
    } else if (moves <= 0) {
      setOverlay("lose")

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true
      }).start()
    }
  }

  function palettePress(i) {
    if (overlay || i === territoryColor) return

    floodFill(i)

    Animated.sequence([
      Animated.spring(paletteScale[i], {
        toValue: 0.88,
        useNativeDriver: true
      }),
      Animated.spring(paletteScale[i], {
        toValue: 1,
        useNativeDriver: true
      })
    ]).start()
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <TouchableOpacity style={styles.headerButton} onPress={onBackToLevels}>
          <Text style={styles.cornerButtonText}>Levels</Text>
        </TouchableOpacity>

        <View style={styles.gameHeaderTitle}>
          <Text style={styles.header}>Level {level}</Text>
          <Text style={styles.subHeader}>
            Score {score} • {rows} x {cols}
          </Text>
        </View>

        <DiamondBadge value={diamonds} />
      </View>

      <View style={styles.gameContent}>
        <View style={styles.board}>
          {grid.map((row, y) => (
            <View key={y} style={{ flexDirection: "row" }}>
              {row.map((tile, x) => {
                const key = `${x}-${y}`

                return (
                  <Animated.View
                    key={x}
                    style={[
                      {
                        width: tileSize,
                        height: tileSize,
                        margin: 1.5,
                        borderRadius: 5,
                        backgroundColor: COLORS[tile.color],
                        borderWidth: tile.owned ? 2 : 0,
                        borderColor: "white",
                        transform: [{ scale: tileAnim[key] || 1 }]
                      }
                    ]}
                  />
                )
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.paletteDock}>
        <Text style={styles.moves}>Moves Left: {movesLeft}</Text>

        <View style={styles.palette}>
          {COLORS.map((c, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              style={styles.paletteSlot}
              onPress={() => palettePress(i)}
            >
              <Animated.View
                style={[
                  styles.paletteBtn,
                  {
                    backgroundColor: c,
                    borderWidth: territoryColor === i ? 4 : 2,
                    transform: [{ scale: paletteScale[i] }]
                  }
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {overlay && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          {overlay === "win" ? (
            <>
              <Text style={styles.overlayText}>You Win 🎉</Text>
              <Text style={styles.overlaySub}>
                Score {score} | High {Math.max(highScore, score)}
              </Text>
              <Text style={styles.rewardText}>+{reward} diamonds earned</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => onWin(level, score, "next")}
              >
                <Text style={styles.buttonText}>
                  {level < MAX_LEVELS ? "Collect & Next" : "Collect Reward"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onWin(level, score, "levels")}
              >
                <Text style={styles.secondaryButtonText}>Back to Levels</Text>
              </TouchableOpacity>
              <View style={styles.overlayActionRow}>
                <TouchableOpacity
                  style={styles.overlayMiniButton}
                  onPress={onShareApp}
                >
                  <Text style={styles.overlayMiniButtonText}>Share App</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.overlayMiniButton}
                  onPress={onRateApp}
                >
                  <Text style={styles.overlayMiniButtonText}>Rate</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.overlayText}>Game Over</Text>
              <Text style={styles.overlaySub}>
                Retry costs {entryCost} diamonds
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => onRetry(level)}
              >
                <Text style={styles.buttonText}>Retry Level</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onBackToLevels}
              >
                <Text style={styles.secondaryButtonText}>Choose Another</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {confettiKey > 0 && (
        <ConfettiCannon
          key={confettiKey}
          count={120}
          fadeOut
          explosionSpeed={280}
          fallSpeed={2200}
          origin={{ x: width / 2, y: height - 120 }}
        />
      )}
    </View>
  )
}

function HomeScreen({
  highScore,
  diamonds,
  onPlay,
  onRemoveAds,
  onShareApp,
  onRateApp
}) {
  const size = 5
  const gap = 3
  const tileSize = (width * 0.7 - gap * size) / size

  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Math.floor(Math.random() * COLORS.length)
    )
  )

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderSpacer} />
        <DiamondBadge value={diamonds} />
      </View>

      <View style={styles.homeTitleSection}>
        <View style={styles.titleRow}>
          {"COLOR FLOOD".split("").map((l, i) => (
            <Text
              key={i}
              style={[styles.titleLetter, { color: COLORS[i % COLORS.length] }]}
            >
              {l}
            </Text>
          ))}
        </View>

        <Text style={styles.tagline}>Fill the board. Beat the clock.</Text>
      </View>

      <View style={styles.homeContent}>
        <View style={styles.homePreview}>
          {grid.map((row, y) => (
            <View key={y} style={{ flexDirection: "row" }}>
              {row.map((c, x) => (
                <View
                  key={x}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    margin: gap / 2,
                    borderRadius: 5,
                    backgroundColor: COLORS[c]
                  }}
                />
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playText}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.removeAdsButton} onPress={onRemoveAds}>
          <Text style={styles.removeAdsText}>REMOVE ADS</Text>
        </TouchableOpacity>

        <View style={styles.homeActionRow}>
          <TouchableOpacity
            style={styles.homeSecondaryAction}
            onPress={onShareApp}
          >
            <Text style={styles.homeSecondaryActionText}>Share App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeSecondaryAction}
            onPress={onRateApp}
          >
            <Text style={styles.homeSecondaryActionText}>Rate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bestText}>Best: {highScore}</Text>

        <Text style={styles.version}>Version 1.0</Text>
      </View>
    </View>
  )
}

function LevelSelectScreen({
  diamonds,
  unlockedLevel,
  selectedLevel,
  onBack,
  onSelectLevel
}) {
  return (
    <View style={styles.levelsContainer}>
      <View style={styles.gameHeader}>

      <TouchableOpacity style={styles.cornerButton} onPress={onBack}>
        <Text style={styles.cornerButtonText}>Home</Text>
      </TouchableOpacity>

      <DiamondBadge value={diamonds} style={styles.diamondBadgeLevels} />
      </View>

      <Text style={styles.levelTitle}>Select Stage</Text>
      <Text style={styles.levelSubtitle}>
        Pick a board and keep the flood run alive.
      </Text>

      <View style={styles.levelDeck}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelScroller}
        >
          {Array.from({ length: MAX_LEVELS }, (_, index) => {
            const level = index + 1
            const config = getLevelConfig(level)
            const locked = level > unlockedLevel
            const isSelected = level === selectedLevel

            return (
              <View
                key={level}
                style={[
                  styles.levelCard,
                  locked && styles.levelCardLocked,
                  isSelected && !locked && styles.levelCardActive
                ]}
              >
                <Text style={styles.levelCardNumber}>Level {level}</Text>
                <LevelPreview rows={config.rows} cols={config.cols} />
                {locked ? (
                  <View style={styles.levelCardLockedChip}>
                    <Text style={styles.levelCardLockedText}>Locked</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectLevel(level)}
                    style={styles.levelPlayButton}
                  >
                    <Text style={styles.levelPlayButtonText}>Play</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

function LevelPreview({ rows, cols }) {
  const previewWidth = 120
  const gap = 2
  const tileSize = Math.max(
    4,
    Math.floor(
      Math.min(
        (previewWidth - gap * (cols - 1)) / cols,
        (72 - gap * (rows - 1)) / rows
      )
    )
  )

  return (
    <View style={styles.levelPreview}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View key={rowIndex} style={styles.levelPreviewRow}>
          {Array.from({ length: cols }, (_, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.levelPreviewTile,
                {
                  width: tileSize,
                  height: tileSize,
                  marginRight: colIndex === cols - 1 ? 0 : gap,
                  marginBottom: gap,
                  backgroundColor: COLORS[(rowIndex + colIndex) % COLORS.length]
                }
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

function RemoveAdsScreen({ diamonds, onBack, onPremiumPress }) {
  return (
    <ScrollView
      contentContainerStyle={styles.removeAdsContainer}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <TouchableOpacity style={styles.cornerButton} onPress={onBack}>
        <Text style={styles.cornerButtonText}>Home</Text>
      </TouchableOpacity>

      <DiamondBadge value={diamonds} style={styles.diamondBadgeLevels} />

      <Text style={styles.crown}>👑</Text>

      <Text style={styles.premiumTitle}>Go Premium</Text>

      <Text style={styles.premiumSubtitle}>
        Enjoy Color Flood without interruptions
      </Text>

      <View style={styles.featureCard}>
        {[
          "Remove all ads",
          "Unlock all future levels",
          "Exclusive color themes (coming soon)",
          "Support the developer ❤️"
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={{ marginRight: 10 }}>✅</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.premiumButton}
        onPress={onPremiumPress}
      >
        <Text style={styles.premiumButtonText}>Get Premium — ₹99</Text>
      </TouchableOpacity>

      <Text style={styles.purchaseNote}>
        One-time purchase • No subscription
      </Text>

      <TouchableOpacity>
        <Text style={styles.restore}>Restore Purchase</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function DiamondBadge({ value, style }) {
  return (
    <View style={[styles.diamondBadge, style]}>
      <Text style={styles.diamondIcon}>◆</Text>
      <Text style={styles.diamondText}>{value}</Text>
    </View>
  )
}

function GameDialog({ dialog, onClose }) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={dialog.visible}
      onRequestClose={() => {
        const fallback = dialog.actions[0]?.key
        if (fallback) onClose(fallback)
      }}
    >
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{dialog.title}</Text>
          <Text style={styles.dialogMessage}>{dialog.message}</Text>

          <View style={styles.dialogActions}>
            {dialog.actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.dialogButton,
                  action.style === "ghost"
                    ? styles.dialogButtonGhost
                    : styles.dialogButtonPrimary
                ]}
                onPress={() => onClose(action.key)}
              >
                <Text
                  style={[
                    styles.dialogButtonText,
                    action.style === "ghost"
                      ? styles.dialogButtonTextGhost
                      : styles.dialogButtonTextPrimary
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    paddingTop: 24,
    width: "100%"
  },

  splashScreen: {
    flex: 1,
    backgroundColor: "#0f0f0f"
  },

  header: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
  },

  subHeader: {
    color: "#8d96a8",
    fontSize: 13,
    marginTop: 4
  },

  gameHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12
  },

  gameHeaderTitle: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12
  },

  moves: {
    color: "white",
    marginBottom: 14,
    fontWeight: "bold"
  },

  gameContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 12
  },

  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360
  },

  paletteDock: {
    width: "100%",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 26,
    paddingHorizontal: 18,
    backgroundColor: "#151b25",
    borderTopWidth: 1,
    borderTopColor: "#2d3648"
  },

  paletteSlot: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 12
  },

  paletteBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: "white",
    marginHorizontal: 6
  },

  board: {
    alignItems: "center",
    justifyContent: "center"
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center"
  },

  overlayText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold"
  },

  overlaySub: {
    color: "white",
    marginTop: 10
  },

  rewardText: {
    color: "#71f79f",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold"
  },

  button: {
    marginTop: 20,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8
  },

  buttonText: {
    fontWeight: "bold"
  },

  overlayActionRow: {
    flexDirection: "row",
    marginTop: 14
  },

  overlayMiniButton: {
    marginHorizontal: 6,
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10
  },

  overlayMiniButtonText: {
    color: "white",
    fontWeight: "bold"
  },

  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#3b4354",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8
  },

  secondaryButtonText: {
    color: "white",
    fontWeight: "bold"
  },

  cornerButton: {
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },

  headerButton: {
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },

  cornerButtonText: {
    color: "white",
    fontWeight: "700"
  },

  diamondBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },

  diamondIcon: {
    color: "#7ed7ff",
    fontSize: 16,
    marginRight: 6
  },

  diamondText: {
    color: "white",
    fontWeight: "bold"
  },

  homeContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    width: "100%",
    paddingTop: 18,
    paddingBottom: 28
  },

  homeHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 54
  },

  homeHeaderSpacer: {
    width: 76
  },

  homeTitleSection: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18
  },

  homeContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20
  },

  homePreview: {
    marginBottom: 28
  },

  titleRow: { flexDirection: "row" },

  titleLetter: {
    fontSize: 42,
    fontWeight: "bold"
  },

  tagline: {
    color: "#888",
    fontSize: 15,
    marginTop: 6
  },

  playButton: {
    width: "80%",
    height: 58,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },

  playText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "black"
  },

  removeAdsButton: {
    width: "80%",
    height: 50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },

  removeAdsText: {
    color: "white",
    fontWeight: "bold"
  },

  homeActionRow: {
    flexDirection: "row",
    width: "80%",
    marginTop: 14,
    gap: 10
  },

  homeSecondaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    alignItems: "center",
    justifyContent: "center"
  },

  homeSecondaryActionText: {
    color: "white",
    fontWeight: "bold"
  },

  bestText: {
    color: "#aaa",
    marginTop: 20,
    fontSize: 16
  },

  version: {
    color: "#555",
    fontSize: 12,
    marginTop: 20
  },

  levelsContainer: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#0f0f0f",
    paddingTop: 110
  },

  levelTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    paddingHorizontal: 24,
    marginTop: 20
  },

  levelSubtitle: {
    color: "#8b93a5",
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 24,
    marginTop: 10,
    maxWidth: 320
  },

  levelDeck: {
    marginTop: 28,
    marginHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#293246",
    backgroundColor: "#141a24",
    paddingVertical: 22
  },

  levelScroller: {
    paddingHorizontal: 20
  },

  levelCard: {
    width: 176,
    minHeight: 228,
    marginRight: 16,
    borderRadius: 24,
    backgroundColor: "#1b2330",
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 18,
    justifyContent: "space-between"
  },

  levelCardActive: {
    borderColor: "#7ed7ff",
    transform: [{ translateY: -4 }]
  },

  levelCardLocked: {
    opacity: 0.35
  },

  levelCardNumber: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold"
  },

  levelPreview: {
    marginTop: 16,
    marginBottom: 14,
    alignSelf: "center"
  },

  levelPreviewRow: {
    flexDirection: "row",
    justifyContent: "center"
  },

  levelPreviewTile: {
    borderRadius: 2
  },

  levelCardLockedChip: {
    alignSelf: "flex-start",
    backgroundColor: "#10151f",
    borderWidth: 1,
    borderColor: "#2a3242",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },

  levelCardLockedText: {
    color: "#8b93a5",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8
  },

  levelPlayButton: {
    backgroundColor: "#7ed7ff",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center"
  },

  levelPlayButtonText: {
    color: "#07111f",
    fontWeight: "bold",
    fontSize: 16
  },

  removeAdsContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 60
  },

  crown: {
    fontSize: 64,
    marginBottom: 10
  },

  premiumTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white"
  },

  premiumSubtitle: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    maxWidth: "70%",
    marginVertical: 12
  },

  featureCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    width: "80%",
    marginVertical: 20
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },

  featureText: {
    color: "white",
    fontSize: 16
  },

  premiumButton: {
    width: "80%",
    height: 58,
    borderRadius: 16,
    backgroundColor: "#f1c40f",
    alignItems: "center",
    justifyContent: "center"
  },

  premiumButtonText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "black"
  },

  purchaseNote: {
    color: "#666",
    fontSize: 12,
    marginTop: 10
  },

  restore: {
    marginTop: 10,
    color: "#888",
    textDecorationLine: "underline"
  },

  dialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 14, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },

  dialogCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#161d29",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 22
  },

  dialogTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold"
  },

  dialogMessage: {
    color: "#a3adbf",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10
  },

  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 22
  },

  dialogButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: 10
  },

  dialogButtonPrimary: {
    backgroundColor: "#7ed7ff"
  },

  dialogButtonGhost: {
    backgroundColor: "#0f141d",
    borderWidth: 1,
    borderColor: "#2f3c53"
  },

  dialogButtonText: {
    fontWeight: "bold"
  },

  dialogButtonTextPrimary: {
    color: "#07111f"
  },

  dialogButtonTextGhost: {
    color: "white"
  }
})
