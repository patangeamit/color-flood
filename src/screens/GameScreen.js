import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ConfettiCannon from "react-native-confetti-cannon"
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import ScreenHeader from "../components/ScreenHeader"
import { COLORS, MAX_LEVELS, getLevelConfig } from "../config"
import styles from "../styles"

const { width, height } = Dimensions.get("window")

function GameScreen({
  level,
  sessionId,
  coins,
  gems,
  highScore,
  onBackToLevels,
  onShowInstructions,
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
  const [contentSize, setContentSize] = useState({
    width: width - 24,
    height: Math.max(220, height - 360)
  })

  const overlayOpacity = useRef(new Animated.Value(0)).current
  const paletteScale = useRef(COLORS.map(() => new Animated.Value(1))).current
  const tileAnim = useRef({}).current
  const movesLeftRef = useRef(movesLeft)
  const scoreRef = useRef(score)

  useEffect(() => {
    movesLeftRef.current = movesLeft
    scoreRef.current = score
  }, [movesLeft, score])

  const { rows, cols, entryCost, reward } = useMemo(
    () => getLevelConfig(level),
    [level]
  )
  const gap = 3
  const boardMaxWidth = Math.max(220, contentSize.width - 12)
  const boardMaxHeight = Math.max(220, contentSize.height - 12)
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

  const newGame = useCallback(() => {
    const { rows: nextRows, cols: nextCols, moveLimit: nextMoveLimit } =
      getLevelConfig(level)
    const nextGrid = []

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

      nextGrid.push(row)
    }

    nextGrid[0][0].owned = true

    setGrid(nextGrid)
    setMovesLeft(nextMoveLimit)
    setOverlay(null)
    setScore(0)
    setConfettiKey(0)
    setTerritoryColor(nextGrid[0][0].color)
    overlayOpacity.setValue(0)
  }, [level, overlayOpacity, tileAnim])

  useEffect(() => {
    newGame()
  }, [newGame, sessionId])

  const checkGame = useCallback((nextGrid, moves) => {
    if (
      !nextGrid ||
      !Array.isArray(nextGrid) ||
      nextGrid.length === 0 ||
      !nextGrid[0] ||
      nextGrid[0].length === 0
    ) {
      return
    }

    const first = nextGrid[0][0].color
    let allMatch = true

    for (let y = 0; y < nextGrid.length; y++) {
      for (let x = 0; x < nextGrid[y].length; x++) {
        if (nextGrid[y][x].color !== first) {
          allMatch = false
        }
      }
    }

    if (allMatch) {
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
    if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) return

    const nextGrid = grid.map(row => row.map(tile => ({ ...tile })))
    const queue = []

    for (let y = 0; y < nextGrid.length; y++) {
      for (let x = 0; x < nextGrid[y].length; x++) {
        if (nextGrid[y][x].owned) {
          nextGrid[y][x].color = newColor
          queue.push([x, y])
        }
      }
    }

    const absorbed = []
    let queueIndex = 0

    while (queueIndex < queue.length) {
      const [x, y] = queue[queueIndex]
      queueIndex += 1

      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]

      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy

        if (
          nx >= 0 &&
          ny >= 0 &&
          ny < nextGrid.length &&
          nx < nextGrid[ny].length &&
          !nextGrid[ny][nx].owned &&
          nextGrid[ny][nx].color === newColor
        ) {
          nextGrid[ny][nx].owned = true
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
    const nextScore = scoreRef.current + 40

    setGrid(nextGrid)
    setTerritoryColor(newColor)
    setMovesLeft(nextMoves)
    setScore(nextScore)
    checkGame(nextGrid, nextMoves)
  }, [checkGame, grid, overlay, territoryColor, tileAnim])

  const palettePress = useCallback(index => {
    if (overlay || index === territoryColor) return

    floodFill(index)

    Animated.sequence([
      Animated.spring(paletteScale[index], {
        toValue: 0.88,
        useNativeDriver: true
      }),
      Animated.spring(paletteScale[index], {
        toValue: 1,
        useNativeDriver: true
      })
    ]).start()
  }, [floodFill, overlay, paletteScale, territoryColor])

  return (
    <View style={styles.container}>
      <ScreenHeader
        leftContent={(
          <View style={styles.gameHeaderLeftActions}>
            <TouchableOpacity style={styles.headerButton} onPress={onBackToLevels}>
              <Text style={styles.cornerButtonText}>Levels</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={onShowInstructions}>
              <Text style={styles.headerIconButtonText}>i</Text>
            </TouchableOpacity>
          </View>
        )}
        coins={coins}
        gems={gems}
      />
      <View style={styles.headerSpacer} />

      <View style={styles.gameHeader}>
        <View style={styles.gameHeaderTitle}>
          <Text style={styles.header}>Moves Left: {movesLeft}</Text> 
          <Text style={styles.header}>Score {score}</Text> 
        </View>

        {/* <View style={styles.gameStatsRow}>
          <View style={styles.gameScorePill}>
            <Text style={styles.gameScoreText}>Score {score}</Text>
          </View>
        </View> */}
      </View>

      <View
        style={styles.gameContent}
        onLayout={event => {
          const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout
          setContentSize(current => {
            if (current.width === nextWidth && current.height === nextHeight) {
              return current
            }

            return { width: nextWidth, height: nextHeight }
          })
        }}
      >
        <View style={styles.board}>
          {grid.map((row, y) => (
            <View key={y} style={styles.boardRow}>
              {row.map((tile, x) => {
                const key = `${x}-${y}`

                return (
                  <Animated.View
                    key={x}
                    style={[
                      styles.tile,
                      {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: COLORS[tile.color],
                        borderWidth: tile.owned ? 2 : 0,
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
        {/* <Text style={styles.moves}>Moves Left: {movesLeft}</Text> */}

        <View style={styles.palette}>
          {COLORS.map((color, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              style={styles.paletteSlot}
              onPress={() => palettePress(index)}
            >
              <Animated.View
                style={[
                  styles.paletteBtn,
                  {
                    backgroundColor: color,
                    borderWidth: territoryColor === index ? 4 : 2,
                    transform: [{ scale: paletteScale[index] }]
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
                <Text style={styles.coinIcon}>●</Text>
                <Text style={styles.winRewardText}>+{reward} COINS</Text>
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
                <Text style={styles.loseInfoText}>
                  Retry costs {entryCost} coins
                </Text>
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

export default GameScreen
