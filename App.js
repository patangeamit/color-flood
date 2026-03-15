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

const { width } = Dimensions.get("window")

const COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#e67e22"
]

export default function App() {
  const [screen, setScreen] = useState("home")
  const [highScore, setHighScore] = useState(0)

  if (screen === "home") {
    return (
      <HomeScreen
        highScore={highScore}
        onPlay={() => setScreen("game")}
        onRemoveAds={() => setScreen("removeAds")}
      />
    )
  }

  if (screen === "removeAds") {
    return <RemoveAdsScreen onBack={() => setScreen("home")} />
  }

  return (
    <GameScreen
      highScore={highScore}
      setHighScore={setHighScore}
      onExit={() => setScreen("home")}
    />
  )
}

function GameScreen({ highScore, setHighScore, onExit }) {
  const highScoreRef = useRef(highScore)
  const [level, setLevel] = useState(1)
  const [grid, setGrid] = useState([])
  const [movesLeft, setMovesLeft] = useState(22)
  const [territoryColor, setTerritoryColor] = useState(0)
  const [overlay, setOverlay] = useState(null)
  const [score, setScore] = useState(0)

  const overlayOpacity = useRef(new Animated.Value(0)).current
  const paletteScale = useRef(COLORS.map(() => new Animated.Value(1))).current

  const tileAnim = useRef({}).current

  const size = level === 1 ? 8 : level === 2 ? 10 : 12
  const moveLimit = level === 1 ? 22 : level === 2 ? 27 : 30

  const gap = 3
  const tileSize = (width - gap * (size + 1)) / size

  useEffect(() => {
    newGame(level)
  }, [])

  function newGame(lvl) {
    const s = lvl === 1 ? 8 : lvl === 2 ? 10 : 12
    const m = lvl === 1 ? 22 : lvl === 2 ? 27 : 30

    const g = []

    for (let y = 0; y < s; y++) {
      const row = []
      for (let x = 0; x < s; x++) {
        row.push({
          color: Math.floor(Math.random() * COLORS.length),
          owned: false
        })
      }
      g.push(row)
    }

    g[0][0].owned = true

    setGrid(g)
    setMovesLeft(m)
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
      for (let x = 0; x < g.length; x++) {
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
          nx < g.length &&
          ny < g.length &&
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
      for (let x = 0; x < g.length; x++) {
        if (g[y][x].color !== first) all = false
      }
    }

    if (all) {
      if (sc > highScoreRef.current) {
        highScoreRef.current = sc
        setHighScore(sc)
      }

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

  function nextLevel() {
    const lvl = level + 1
    setLevel(lvl)
    newGame(lvl)
  }

  function reset() {
    newGame(level)
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
          Alert.alert("Quit game?", "Your progress will be lost.", [
            { text: "Cancel", style: "cancel" },
            { text: "Quit", onPress: onExit }
          ])
        }
      >
        <Text style={{ color: "white", fontSize: 22 }}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Level {level}</Text>
      <Text style={styles.header}>Score {score}</Text>

      <View style={{ marginTop: 12 }}>
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
                Score {score} | High {highScoreRef.current}
              </Text>
              <TouchableOpacity style={styles.button} onPress={nextLevel}>
                <Text style={styles.buttonText}>Next Level</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.overlayText}>Game Over</Text>
              <TouchableOpacity style={styles.button} onPress={reset}>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  )
}

function HomeScreen({ highScore, onPlay, onRemoveAds }) {
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

function RemoveAdsScreen({ onBack }) {
  return (
    <ScrollView
      contentContainerStyle={styles.removeAdsContainer}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <TouchableOpacity style={styles.backArrow} onPress={onBack}>
        <Text style={{ color: "white", fontSize: 24 }}>←</Text>
      </TouchableOpacity>

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

  moves: {
    color: "white",
    marginTop: 12,
    fontWeight: "bold"
  },

  palette: {
    flexDirection: "row",
    marginTop: 20
  },

  paletteBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: "white",
    marginHorizontal: 6
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

  exitButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10
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
