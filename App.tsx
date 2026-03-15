import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";

const { width } = Dimensions.get("window");

const COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#e67e22",
];

type Tile = {
  color: number;
  owned: boolean;
};

export default function App() {
  const highScore = useRef(0);

  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [movesLeft, setMovesLeft] = useState(22);
  const [territoryColor, setTerritoryColor] = useState(0);
  const [overlay, setOverlay] = useState<null | "win" | "lose">(null);
  const [score, setScore] = useState(0);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const paletteScale = useRef(
    COLORS.map(() => new Animated.Value(1))
  ).current;

  const tileAnim = useRef<{ [key: string]: Animated.Value }>({}).current;

  const size = level === 1 ? 8 : level === 2 ? 10 : 12;
  const moveLimit = level === 1 ? 22 : level === 2 ? 27 : 30;

  const gap = 3;
  const tileSize = (width - gap * (size + 1)) / size;

  useEffect(() => {
    newGame(level);
  }, []);

  function newGame(lvl: number) {
    const s = lvl === 1 ? 8 : lvl === 2 ? 10 : 12;
    const m = lvl === 1 ? 22 : lvl === 2 ? 27 : 30;

    const g: Tile[][] = [];

    for (let y = 0; y < s; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < s; x++) {
        row.push({
          color: Math.floor(Math.random() * COLORS.length),
          owned: false,
        });
      }
      g.push(row);
    }

    g[0][0].owned = true;

    setGrid(g);
    setMovesLeft(m);
    setOverlay(null);
    setScore(0);
    setTerritoryColor(g[0][0].color);
    overlayOpacity.setValue(0);
  }

  function floodFill(newColor: number) {
    if (overlay) return;
    if (newColor === territoryColor) return;

    const g = grid.map((r) => r.map((t) => ({ ...t })));
    const queue: [number, number][] = [];

    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g.length; x++) {
        if (g[y][x].owned) {
          g[y][x].color = newColor;
          queue.push([x, y]);
        }
      }
    }

    const absorbed: [number, number][] = [];

    while (queue.length) {
      const [x, y] = queue.shift()!;

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;

        if (
          nx >= 0 &&
          ny >= 0 &&
          nx < g.length &&
          ny < g.length &&
          !g[ny][nx].owned &&
          g[ny][nx].color === newColor
        ) {
          g[ny][nx].owned = true;
          queue.push([nx, ny]);
          absorbed.push([nx, ny]);
        }
      }
    }

    absorbed.forEach(([x, y]) => {
      const key = `${x}-${y}`;
      tileAnim[key] = new Animated.Value(0.85);
      Animated.spring(tileAnim[key], {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    setGrid(g);
    setTerritoryColor(newColor);
    setMovesLeft((m) => m - 1);

    const used = moveLimit - (movesLeft - 1);
    const sc = Math.max(0, 1000 - used * 40);
    setScore(sc);

    checkGame(g, movesLeft - 1, sc);
  }

  function checkGame(g: Tile[][], moves: number, sc: number) {
    const first = g[0][0].color;

    let all = true;
    let owned = 0;

    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g.length; x++) {
        if (g[y][x].color !== first) all = false;
        if (g[y][x].owned) owned++;
      }
    }

    if (all) {
      if (sc > highScore.current) highScore.current = sc;
      setOverlay("win");

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else if (moves <= 0) {
      setOverlay("lose");

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }

  function nextLevel() {
    const lvl = level + 1;
    setLevel(lvl);
    newGame(lvl);
  }

  function reset() {
    newGame(level);
  }

  function palettePress(i: number) {
    Animated.sequence([
      Animated.spring(paletteScale[i], {
        toValue: 0.88,
        useNativeDriver: true,
      }),
      Animated.spring(paletteScale[i], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    floodFill(i);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Level {level}</Text>
      <Text style={styles.header}>Score {score}</Text>

      <View style={{ marginTop: 12 }}>
        {grid.map((row, y) => (
          <View key={y} style={{ flexDirection: "row" }}>
            {row.map((tile, x) => {
              const key = `${x}-${y}`;
              const scale = tileAnim[key] || new Animated.Value(1);

              return (
                <Animated.View
                  key={x}
                  style={[
                    {
                      width: tileSize,
                      height: tileSize,
                      margin: gap / 2,
                      borderRadius: 5,
                      backgroundColor: COLORS[tile.color],
                      borderWidth: tile.owned ? 2 : 0,
                      borderColor: "white",
                      transform: [{ scale }],
                    },
                  ]}
                />
              );
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
                  transform: [{ scale: paletteScale[i] }],
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {overlay && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
        >
          {overlay === "win" ? (
            <>
              <Text style={styles.overlayText}>You Win 🎉</Text>
              <Text style={styles.overlaySub}>
                Score {score} | High {highScore.current}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
  },

  header: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  moves: {
    color: "white",
    marginTop: 12,
    fontWeight: "bold",
  },

  palette: {
    flexDirection: "row",
    marginTop: 20,
  },

  paletteBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderColor: "white",
    marginHorizontal: 6,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  overlayText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },

  overlaySub: {
    color: "white",
    marginTop: 10,
  },

  button: {
    marginTop: 20,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  buttonText: {
    fontWeight: "bold",
  },
});