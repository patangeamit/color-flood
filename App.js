import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  ScrollView,
  Alert
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

  function openLevelSelect() {
    setScreen("levels")
  }

  function offerWatchAd(requiredDiamonds) {
    Alert.alert(
      "Out of diamonds",
      `You need ${requiredDiamonds} diamonds. Watch an ad to get 5 diamonds?`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Watch Ad",
          onPress: () => {
            setDiamonds(current => current + 5)
            Alert.alert("Ad complete", "You received 5 diamonds.")
          }
        }
      ]
    )
  }

  function enterLevel(level) {
    if (level > unlockedLevel) return

    const { entryCost } = getLevelConfig(level)

    if (diamonds < entryCost) {
      offerWatchAd(entryCost)
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

  function handleWin(level, score, action) {
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

      offerWatchAd(entryCost)
    }

    setScreen("levels")
  }

  function handleRetry(level) {
    enterLevel(level)
  }

  if (screen === "home") {
    return (
      <HomeScreen
        highScore={highScore}
        diamonds={diamonds}
        onPlay={openLevelSelect}
        onRemoveAds={() => setScreen("removeAds")}
      />
    )
  }

  if (screen === "removeAds") {
    return (
      <RemoveAdsScreen diamonds={diamonds} onBack={() => setScreen("home")} />
    )
  }

  if (screen === "levels") {
    return (
      <LevelSelectScreen
        diamonds={diamonds}
        unlockedLevel={unlockedLevel}
        selectedLevel={selectedLevel}
        onBack={() => setScreen("home")}
        onSelectLevel={enterLevel}
      />
    )
  }

  return (
    <GameScreen
      level={selectedLevel}
      sessionId={gameSession}
      diamonds={diamonds}
      highScore={highScore}
      onBackToLevels={() => setScreen("levels")}
      onRetry={handleRetry}
      onWin={handleWin}
    />
  )
}

function GameScreen({
  level,
  sessionId,
  diamonds,
  highScore,
  onBackToLevels,
  onRetry,
  onWin
}) {
  const [grid, setGrid] = useState([])
  const [movesLeft, setMovesLeft] = useState(getLevelConfig(level).moveLimit)
  const [territoryColor, setTerritoryColor] = useState(0)
  const [overlay, setOverlay] = useState(null)
  const [score, setScore] = useState(0)

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

    while (queue.length) {
      const [x, y] = queue.shift()

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

    setGrid(g)
    setTerritoryColor(newColor)
    setMovesLeft(m => m - 1)

    const used = moveLimit - (movesLeft - 1)
    const sc = Math.max(0, 1000 - used * 40)
    setScore(sc)

    checkGame(g, movesLeft - 1, sc)
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

    floodFill(i)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() =>
          Alert.alert("Leave level?", "You can replay it from the level list.", [
            { text: "Cancel", style: "cancel" },
            { text: "Leave", onPress: onBackToLevels }
          ])
        }
      >
        <Text style={{ color: "white", fontSize: 22 }}>✕</Text>
      </TouchableOpacity>

      <DiamondBadge value={diamonds} style={styles.diamondBadgeGame} />

      <Text style={styles.header}>Level {level}</Text>
      <Text style={styles.header}>Score {score}</Text>
      <Text style={styles.subHeader}>
        {rows} x {cols} grid • Entry {entryCost} • Win +{reward}
      </Text>

      <View style={styles.board}>
        {grid.map((row, y) => (
          <View key={y} style={{ flexDirection: "row" }}>
            {row.map((tile, x) => {
              const key = `${x}-${y}`
              const scale = tileAnim[key] || new Animated.Value(1)

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
                      transform: [{ scale }]
                    }
                  ]}
                />
              )
            })}
          </View>
        ))}
      </View>

      <Text style={styles.moves}>Moves Left: {movesLeft}</Text>

      <View style={styles.palette}>
        {COLORS.map((c, i) => (
          <TouchableOpacity key={i} onPress={() => palettePress(i)}>
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
    </View>
  )
}

function HomeScreen({ highScore, diamonds, onPlay, onRemoveAds }) {
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
      <DiamondBadge value={diamonds} style={styles.diamondBadgeHome} />

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

      <View style={{ marginVertical: 30 }}>
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

      <Text style={styles.bestText}>Best: {highScore}</Text>

      <Text style={styles.version}>Version 1.0</Text>
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
      <TouchableOpacity style={styles.backArrow} onPress={onBack}>
        <Text style={{ color: "white", fontSize: 24 }}>←</Text>
      </TouchableOpacity>

      <DiamondBadge value={diamonds} style={styles.diamondBadgeLevels} />

      <Text style={styles.levelTitle}>Choose a Level</Text>
      <Text style={styles.levelSubtitle}>
        Finish levels to unlock more boards and keep your diamond run going.
      </Text>

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
            <TouchableOpacity
              key={level}
              activeOpacity={0.9}
              disabled={locked}
              onPress={() => onSelectLevel(level)}
              style={[
                styles.levelCard,
                locked && styles.levelCardLocked,
                isSelected && !locked && styles.levelCardActive
              ]}
            >
              <Text style={styles.levelCardNumber}>Level {level}</Text>
              <LevelPreview rows={config.rows} cols={config.cols} />
              <Text style={styles.levelCardMeta}>
                {config.moveLimit} moves
              </Text>
              <Text style={styles.levelCardMeta}>Entry {config.entryCost}</Text>
              <Text style={styles.levelCardState}>
                {locked ? "Locked" : "Tap to play"}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
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

function RemoveAdsScreen({ diamonds, onBack }) {
  return (
    <ScrollView
      contentContainerStyle={styles.removeAdsContainer}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <TouchableOpacity style={styles.backArrow} onPress={onBack}>
        <Text style={{ color: "white", fontSize: 24 }}>←</Text>
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
        onPress={() => Alert.alert("Payment coming soon!")}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    paddingTop: 60
  },

  header: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
  },

  subHeader: {
    color: "#8d96a8",
    fontSize: 13,
    marginTop: 6
  },

  moves: {
    color: "white",
    marginTop: 12,
    fontWeight: "bold"
  },

  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: 208,
    marginTop: 20
  },

  paletteBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: "white",
    margin: 6
  },

  board: {
    marginTop: 12
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

  exitButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10
  },

  diamondBadge: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10
  },

  diamondBadgeHome: {
    top: 56
  },

  diamondBadgeGame: {
    top: 50
  },

  diamondBadgeLevels: {
    top: 40
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
    justifyContent: "center",
    paddingVertical: 40
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
    backgroundColor: "#0f0f0f",
    paddingTop: 110
  },

  levelTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    paddingHorizontal: 24
  },

  levelSubtitle: {
    color: "#8b93a5",
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 24,
    marginTop: 10,
    maxWidth: 320
  },

  levelScroller: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40
  },

  levelCard: {
    width: width * 0.62,
    maxWidth: 260,
    minHeight: 190,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: "#1a1f2b",
    borderWidth: 1,
    borderColor: "#2f384c",
    padding: 20,
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
    fontSize: 24,
    fontWeight: "bold"
  },

  levelCardGrid: {
    color: "#dbe6ff",
    fontSize: 18,
    marginTop: 12
  },

  levelPreview: {
    marginTop: 16,
    marginBottom: 8,
    alignSelf: "flex-start"
  },

  levelPreviewRow: {
    flexDirection: "row"
  },

  levelPreviewTile: {
    borderRadius: 2
  },

  levelCardMeta: {
    color: "#8b93a5",
    fontSize: 14,
    marginTop: 8
  },

  levelCardState: {
    color: "#7ed7ff",
    fontWeight: "bold",
    marginTop: 18
  },

  removeAdsContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 60
  },

  backArrow: {
    position: "absolute",
    top: 40,
    left: 20
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
  }
})
