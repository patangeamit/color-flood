import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ConfettiCannon from "react-native-confetti-cannon"
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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

const MAX_LEVELS = 30
const STARTING_DIAMONDS = 1
const DIALOG_IDLE = { visible: false, title: "", message: "", actions: [] }
const STORAGE_KEY = "color-flood-progress"
const TOP_INSET = (StatusBar.currentHeight || 0) + 12

function getLevelConfig(level) {
  const index = Math.max(0, level - 1)
  const cols = Math.min(5 + Math.floor((index + 1) / 2), 18)
  const rows = Math.min(7 + Math.floor(index / 2), 21)
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
  const diamondsRef = useRef(diamonds)
  const unlockedLevelRef = useRef(unlockedLevel)

  useEffect(() => {
    diamondsRef.current = diamonds
    unlockedLevelRef.current = unlockedLevel
  }, [diamonds, unlockedLevel])

  const openLevelSelect = useCallback(() => {
    setScreen("levels")
  }, [])

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
        setDiamonds(savedState.diamonds ?? STARTING_DIAMONDS)
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

  const offerWatchAd = useCallback(async requiredDiamonds => {
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
  }, [showDialog])

  const enterLevel = useCallback(async level => {
    if (level > unlockedLevelRef.current) return

    const { entryCost } = getLevelConfig(level)

    if (diamondsRef.current < entryCost) {
      await offerWatchAd(entryCost)
      return
    }

    setDiamonds(current => current - entryCost)
    setSelectedLevel(level)
    setGameSession(current => current + 1)
    setScreen("game")
  }, [offerWatchAd])

  const collectWin = useCallback((level, score) => {
    const { reward } = getLevelConfig(level)
    const nextUnlocked = Math.max(
      unlockedLevelRef.current,
      Math.min(MAX_LEVELS, level + 1)
    )
    const availableDiamonds = diamondsRef.current + reward

    setDiamonds(availableDiamonds)
    setUnlockedLevel(nextUnlocked)
    setHighScore(current => Math.max(current, score))

    return { reward, availableDiamonds }
  }, [])

  const handleWin = useCallback(async (level, score, action) => {
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
  }, [collectWin, offerWatchAd])

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

  const handlePaymentSoon = useCallback(async () => {
    await showDialog({
      title: "Premium soon",
      message: "Payments are not wired up yet, but the premium screen is ready.",
      actions: [{ key: "ok", label: "OK", style: "primary" }]
    })
  }, [showDialog])

  const handleHackProgress = useCallback(async () => {
    setDiamonds(999)
    setUnlockedLevel(MAX_LEVELS)
    setSelectedLevel(MAX_LEVELS)

    await showDialog({
      title: "Test boost active",
      message: "Unlocked all levels and topped up diamonds for testing.",
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
  const movesLeftRef = useRef(movesLeft)
  const scoreRef = useRef(score)

  useEffect(() => {
    movesLeftRef.current = movesLeft
    scoreRef.current = score
  }, [movesLeft, score])

  const { rows, cols, moveLimit, entryCost, reward } = useMemo(
    () => getLevelConfig(level),
    [level]
  )
  const gap = 3
  const horizontalPadding = 24
  const boardMaxWidth = width - horizontalPadding
  const boardMaxHeight = height - 320
  const tileSize = useMemo(
    () =>
      Math.max(
        16,
        Math.floor(
          Math.min(
            (boardMaxWidth - gap * (cols + 1)) / cols,
            (boardMaxHeight - gap * (rows + 1)) / rows
          )
        )
      ),
    [boardMaxHeight, boardMaxWidth, cols, gap, rows]
  )

  useEffect(() => {
    newGame()
  }, [newGame, sessionId])

  const newGame = useCallback(() => {
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
  }, [level, overlayOpacity, tileAnim])

  const checkGame = useCallback((g, moves, sc) => {
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
  }, [overlayOpacity])

  const floodFill = useCallback(newColor => {
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

    const nextMoves = movesLeftRef.current - 1
    setGrid(g)
    setTerritoryColor(newColor)
    setMovesLeft(nextMoves)

    const sc = scoreRef.current + 40
    setScore(sc)

    checkGame(g, nextMoves, sc)
  }, [checkGame, overlay, territoryColor, tileAnim])

  const palettePress = useCallback(i => {
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
  }, [floodFill, overlay, paletteScale, territoryColor])

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
            <View style={styles.winPanel}>
              <View style={styles.winBadge}>
                <Text style={styles.winBadgeText}>VICTORY</Text>
              </View>
              <Text style={styles.winTitle}>LEVEL CLEARED!</Text>
              <Text style={styles.winScore}>SCORE {score}</Text>
              <Text style={styles.winHighScore}>
                BEST {Math.max(highScore, score)}
              </Text>
              <View style={styles.winRewardPill}>
                <Text style={styles.winRewardIcon}>◆</Text>
                <Text style={styles.winRewardText}>+{reward} DIAMONDS</Text>
              </View>
              <TouchableOpacity
                style={styles.winPrimaryButton}
                onPress={() => onWin(level, score, "next")}
              >
                <Text style={styles.winPrimaryButtonText}>
                  {level < MAX_LEVELS ? "Collect & Next" : "Collect Reward"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.winSecondaryButton}
                onPress={() => onWin(level, score, "levels")}
              >
                <Text style={styles.winSecondaryButtonText}>
                  Back to Levels
                </Text>
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
            </View>
          ) : (
            <View style={styles.losePanel}>
              <View style={styles.loseBadge}>
                <Text style={styles.loseBadgeText}>OOPS</Text>
              </View>
              <Text style={styles.loseTitle}>TRY AGAIN!</Text>
              <Text style={styles.loseSub}>That board almost cracked.</Text>
              <View style={styles.loseInfoPill}>
                <Text style={styles.loseInfoText}>Retry costs {entryCost} ◆</Text>
              </View>
              <TouchableOpacity
                style={styles.losePrimaryButton}
                onPress={() => onRetry(level)}
              >
                <Text style={styles.losePrimaryButtonText}>Retry Level</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loseSecondaryButton}
                onPress={onBackToLevels}
              >
                <Text style={styles.loseSecondaryButtonText}>Choose Another</Text>
              </TouchableOpacity>
            </View>
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

const HomeScreen = memo(function HomeScreen({
  highScore,
  diamonds,
  onPlay,
  onRemoveAds,
  onShareApp,
  onRateApp
}) {
  const size = 5
  const gap = 3
  const tileSize = useMemo(() => (width * 0.7 - gap * size) / size, [gap, size])

  const grid = useMemo(
    () =>
      Array.from({ length: size }, () =>
        Array.from({ length: size }, () =>
          Math.floor(Math.random() * COLORS.length)
        )
      ),
    [size]
  )

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderSpacer} />
        <DiamondBadge value={diamonds} />
      </View>

      <View style={styles.homeTitleSection}>
        <View style={styles.homeTopBadge}>
          <Text style={styles.homeTopBadgeText}>ARCADE PUZZLE</Text>
        </View>
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

        {/* <Text style={styles.tagline}>Fill the board. Beat the clock.</Text> */}
      </View>

      <View style={styles.homeContent}>
        {/* <View style={styles.homePreviewCard}> */}
          {/* <Text style={styles.homePreviewLabel}>Daily Color Rush</Text> */}
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
          {/* </View> */}
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
})

const LevelSelectScreen = memo(function LevelSelectScreen({
  diamonds,
  unlockedLevel,
  selectedLevel,
  onBack,
  onSelectLevel
}) {
  const levels = useMemo(
    () =>
      Array.from({ length: MAX_LEVELS }, (_, index) => {
        const level = index + 1

        return {
          level,
          ...getLevelConfig(level)
        }
      }),
    []
  )

  return (
    <View style={styles.levelsContainer}>
      <View style={styles.levelsHeader}>
        <TouchableOpacity style={styles.cornerButton} onPress={onBack}>
          <Text style={styles.cornerButtonText}>Home</Text>
        </TouchableOpacity>

        <DiamondBadge value={diamonds} />
      </View>

      <View style={styles.levelTitleWrap}>
        <View style={styles.levelTopBadge}>
          <Text style={styles.levelTopBadgeText}>LEVEL RUSH</Text>
        </View>
        <Text style={styles.levelTitle}>TAP A STAGE</Text>
        <Text style={styles.levelSubtitle}>
          Pick a board, flood it fast, and unlock the next one.
        </Text>
      </View>

      <View style={styles.levelDeck}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.levelScroller}
        >
          {levels.map(config => {
            const level = config.level
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
                <Text style={styles.levelCardCaption}>
                  {locked ? "Beat the last stage first" : `${config.rows} x ${config.cols} board`}
                </Text>
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
                    <Text style={styles.levelPlayButtonText}>PLAY</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
})

const LevelPreview = memo(function LevelPreview({ rows, cols }) {
  const previewWidth = 120
  const gap = 2
  const tileSize = useMemo(
    () =>
      Math.max(
        4,
        Math.floor(
          Math.min(
            (previewWidth - gap * (cols - 1)) / cols,
            (72 - gap * (rows - 1)) / rows
          )
        )
      ),
    [cols, rows]
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
})

const RemoveAdsScreen = memo(function RemoveAdsScreen({
  diamonds,
  onBack,
  onPremiumPress,
  onHackPress
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.removeAdsContainer}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <View style={styles.levelsHeader}>
        <TouchableOpacity style={styles.cornerButton} onPress={onBack}>
          <Text style={styles.cornerButtonText}>Home</Text>
        </TouchableOpacity>
        <DiamondBadge value={diamonds} />
      </View>

      <View style={styles.premiumHero}>
        <Text style={styles.crown}>👑</Text>
        <View style={styles.levelTopBadge}>
          <Text style={styles.levelTopBadgeText}>PREMIUM PASS</Text>
        </View>
        <Text style={styles.premiumTitle}>GO PREMIUM</Text>
        <Text style={styles.premiumSubtitle}>
          Enjoy Color Flood without interruptions and support the game.
        </Text>
      </View>

      <View style={styles.premiumFeaturePanel}>
        {[
          "Remove all ads",
          "Unlock all future levels",
          "Exclusive color themes (coming soon)",
          "Support the developer ❤️"
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.premiumButton}
        onPress={onPremiumPress}
      >
        <Text style={styles.premiumButtonText}>Get Premium - ₹99</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.hackButton} onPress={onHackPress}>
        <Text style={styles.hackButtonText}>TEST HACK</Text>
      </TouchableOpacity>

      <Text style={styles.purchaseNote}>
        One-time purchase • No subscription
      </Text>

      <TouchableOpacity>
        <Text style={styles.restore}>Restore Purchase</Text>
      </TouchableOpacity>
    </ScrollView>
  )
})

const DiamondBadge = memo(function DiamondBadge({ value, style }) {
  return (
    <View style={[styles.diamondBadge, style]}>
      <Text style={styles.diamondIcon}>◆</Text>
      <Text style={styles.diamondText}>{value}</Text>
    </View>
  )
})

const GameDialog = memo(function GameDialog({ dialog, onClose }) {
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
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    paddingTop: TOP_INSET,
    width: "100%"
  },

  splashScreen: {
    flex: 1,
    backgroundColor: "#0f0f0f"
  },

  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "900"
  },

  subHeader: {
    color: "#8d96a8",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "700"
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
    fontWeight: "900",
    fontSize: 18
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
    fontSize: 34,
    fontWeight: "900"
  },

  overlaySub: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700"
  },

  rewardText: {
    color: "#71f79f",
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900"
  },

  winPanel: {
    width: "86%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "#fff4db",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 4,
    borderColor: "#ffd54f"
  },

  winBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  winBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  winTitle: {
    color: "#1c1404",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  winScore: {
    color: "#2b2110",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16
  },

  winHighScore: {
    color: "#7b6541",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 6
  },

  winRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171d29",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20
  },

  winRewardIcon: {
    color: "#7ed7ff",
    fontSize: 22,
    marginRight: 8
  },

  winRewardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900"
  },

  winPrimaryButton: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "#2ecc71",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },

  winPrimaryButtonText: {
    color: "#062010",
    fontSize: 20,
    fontWeight: "900"
  },

  winSecondaryButton: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#1b2330",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },

  winSecondaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800"
  },

  losePanel: {
    width: "86%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "#1b2330",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 4,
    borderColor: "#ff6b35"
  },

  loseBadge: {
    backgroundColor: "#ffd54f",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  loseBadgeText: {
    color: "#201600",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  loseTitle: {
    color: "#fff4db",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  loseSub: {
    color: "#d5c7aa",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center"
  },

  loseInfoPill: {
    backgroundColor: "#10151f",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 18
  },

  loseInfoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900"
  },

  losePrimaryButton: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "#ff6b35",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },

  losePrimaryButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900"
  },

  loseSecondaryButton: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#fff4db",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },

  loseSecondaryButtonText: {
    color: "#1b2330",
    fontSize: 18,
    fontWeight: "900"
  },

  button: {
    marginTop: 20,
    backgroundColor: "white",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14
  },

  buttonText: {
    fontWeight: "900",
    fontSize: 18
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
    fontWeight: "800",
    fontSize: 16
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
    fontWeight: "800",
    fontSize: 17
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
    fontWeight: "800",
    fontSize: 15
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
    fontWeight: "900",
    fontSize: 16
  },

  homeContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    width: "100%",
    paddingTop: TOP_INSET,
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

  homeTopBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 18
  },

  homeTopBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.1
  },

  homeContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20
  },

  homePreview: {
    marginTop: 14
  },

  homePreviewCard: {
    width: "86%",
    backgroundColor: "#fff4db",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ffd54f",
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 28
  },

  homePreviewLabel: {
    color: "#201600",
    fontSize: 20,
    fontWeight: "900"
  },

  titleRow: { flexDirection: "row" },

  titleLetter: {
    fontSize: 50,
    fontWeight: "900"
  },

  tagline: {
    color: "#888",
    fontSize: 17,
    marginTop: 10,
    fontWeight: "700"
  },

  playButton: {
    width: "80%",
    height: 64,
    backgroundColor: "#2ecc71",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },

  playText: {
    fontWeight: "900",
    fontSize: 22,
    color: "#062010"
  },

  removeAdsButton: {
    width: "80%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#1b2330",
    borderWidth: 3,
    borderColor: "#ff6b35",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },

  removeAdsText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16
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
    fontWeight: "800",
    fontSize: 16
  },

  bestText: {
    color: "#aaa",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "800"
  },

  version: {
    color: "#7a6a49",
    fontSize: 13,
    marginTop: 18,
    fontWeight: "700"
  },

  levelsContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    width: "100%",
    paddingTop: TOP_INSET,
    paddingBottom: 26
  },

  levelsHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 54
  },

  levelTitleWrap: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20
  },

  levelTopBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  levelTopBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  levelTitle: {
    color: "#fff4db",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  levelSubtitle: {
    color: "#d4c7aa",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 340,
    fontWeight: "700"
  },

  levelDeck: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#ffd54f",
    backgroundColor: "#ffe8a3",
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }
  },

  levelScroller: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  levelCard: {
    width: "47%",
    minHeight: 254,
    marginBottom: 18,
    borderRadius: 30,
    backgroundColor: "#1b2330",
    borderWidth: 3,
    borderColor: "#2f3c53",
    padding: 18,
    justifyContent: "space-between"
  },

  levelCardActive: {
    borderColor: "#2ecc71",
    // transform: [{ translateY: -8 }]
  },

  levelCardLocked: {
    opacity: 0.42
  },

  levelCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  levelNumberBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ff6b35",
    alignItems: "center",
    justifyContent: "center"
  },

  levelNumberBubbleLocked: {
    backgroundColor: "#566074"
  },

  levelNumberBubbleText: {
    color: "white",
    fontSize: 22,
    fontWeight: "900"
  },

  levelCardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffd54f",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },

  levelCardBadgeActive: {
    backgroundColor: "#2ecc71"
  },

  levelCardBadgeText: {
    color: "#201600",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },

  levelPreview: {
      // marginTop: 18,
      // marginBottom: 16,
    alignSelf: "center"
  },

  levelPreviewRow: {
    flexDirection: "row",
    justifyContent: "center"
  },

  levelPreviewTile: {
    borderRadius: 2
  },

  levelCardCaption: {
    color: "#d5c7aa",
    fontSize: 18  ,
    fontWeight: "700",
    textAlign: "center",
    // marginBottom: 12
  },

  levelCardLockedChip: {
    alignSelf: "center",
    backgroundColor: "#10151f",
    borderWidth: 2,
    borderColor: "#2a3242",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },

  levelCardLockedText: {
    color: "#a6b0c2",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 0.9
  },

  levelPlayButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },

  levelPlayButtonText: {
    color: "#062010",
    fontWeight: "900",
    fontSize: 18
  },

  levelPlayCost: {
    color: "#0b3a1d",
    fontWeight: "900",
    fontSize: 13,
    marginTop: 2
  },

  removeAdsContainer: {
    alignItems: "center",
    paddingTop: TOP_INSET,
    paddingBottom: 60
  },

  premiumHero: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22
  },

  crown: {
    fontSize: 72,
    marginBottom: 12
  },

  premiumTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff4db",
    marginTop: 18
  },

  premiumSubtitle: {
    color: "#d4c7aa",
    fontSize: 17,
    textAlign: "center",
    maxWidth: 320,
    marginTop: 10,
    fontWeight: "700",
    lineHeight: 24
  },

  premiumFeaturePanel: {
    backgroundColor: "#fff4db",
    borderRadius: 28,
    padding: 22,
    borderWidth: 3,
    borderColor: "#ffd54f",
    width: "86%",
    marginVertical: 20
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },

  featureCheck: {
    color: "#2ecc71",
    fontSize: 22,
    fontWeight: "900",
    marginRight: 12
  },

  featureText: {
    color: "#201600",
    fontSize: 18,
    fontWeight: "800",
    flex: 1
  },

  premiumButton: {
    width: "86%",
    height: 62,
    borderRadius: 20,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center"
  },

  premiumButtonText: {
    fontWeight: "900",
    fontSize: 22,
    color: "#062010"
  },

  hackButton: {
    marginTop: 12,
    backgroundColor: "#1b2330",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#7ed7ff",
    paddingHorizontal: 18,
    paddingVertical: 12
  },

  hackButtonText: {
    color: "#7ed7ff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8
  },

  purchaseNote: {
    color: "#a99c80",
    fontSize: 14,
    marginTop: 14,
    fontWeight: "700"
  },

  restore: {
    marginTop: 14,
    color: "#fff4db",
    fontWeight: "800",
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
