import React, { memo, useMemo } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import ScreenHeader from "../components/ScreenHeader"
import { MAX_LEVELS, getLevelConfig } from "../config"
import styles from "../styles"

const LevelSelectScreen = memo(function LevelSelectScreen({
  coins,
  gems,
  unlockedLevel,
  selectedLevel,
  onBack,
  onSelectLevel
}) {
  const levels = useMemo(
    () =>
      Array.from({ length: MAX_LEVELS }, (_, index) => {
        const level = index + 1
        return { level, ...getLevelConfig(level) }
      }),
    []
  )

  return (
    <View style={styles.levelsContainer}>
      <ScreenHeader
        leftLabel="Home"
        onLeftPress={onBack}
        coins={coins}
        gems={gems}
      />
      <View style={styles.headerSpacer} />

      <View style={styles.levelTitleWrap}>
        <View style={styles.levelTopBadge}>
          <Text style={styles.levelTopBadgeText}>LEVEL RUSH</Text>
        </View>
        <Text style={styles.levelTitle}>TAP A STAGE</Text>
        <Text style={styles.levelSubtitle}>
          Pick a board, flood it fast, and unlock the next one. Level cost: 1 coin.
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
                {locked ? (
                  <View style={styles.lockedLevelWrap}>
                    <Text style={styles.levelPlayButtonText}>{level}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectLevel(level)}
                    style={styles.levelPlayButton}
                  >
                    <Text style={styles.levelPlayButtonText}>{level}</Text>
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

export default LevelSelectScreen
