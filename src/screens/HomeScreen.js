import React, { memo, useMemo } from "react"
import { Dimensions, Text, TouchableOpacity, View } from "react-native"
import ScreenHeader from "../components/ScreenHeader"
import { COLORS } from "../config"
import styles from "../styles"

const { width } = Dimensions.get("window")

const HomeScreen = memo(function HomeScreen({
  highScore,
  coins,
  gems,
  onPlay,
  onOpenShop,
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
      <ScreenHeader
        leftLabel={null}
        coins={coins}
        gems={gems}
      />
      <View style={styles.headerSpacer} />

      <View style={styles.homeTitleSection}>
        <View style={styles.homeTopBadge}>
          <Text style={styles.homeTopBadgeText}>ARCADE PUZZLE</Text>
        </View>
        <View style={styles.titleRow}>
          {"COLOR FLOOD".split("").map((letter, index) => (
            <Text
              key={index}
              style={[styles.titleLetter, { color: COLORS[index % COLORS.length] }]}
            >
              {letter}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.homeContent}>
        <View style={styles.homePreview}>
          {grid.map((row, y) => (
            <View key={y} style={{ flexDirection: "row" }}>
              {row.map((color, x) => (
                <View
                  key={x}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    margin: gap / 2,
                    borderRadius: 5,
                    backgroundColor: COLORS[color]
                  }}
                />
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playText}>PLAY</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.storeButton} onPress={onOpenShop}>
          <Text style={styles.storeButtonText}>BUY GEMS</Text>
        </TouchableOpacity> */}

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

export default HomeScreen
