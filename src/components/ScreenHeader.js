import React, { memo } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import CurrencyBar from "./CurrencyBar"
import styles from "../styles"

const ScreenHeader = memo(function ScreenHeader({
  leftLabel,
  onLeftPress,
  leftContent,
  coins,
  gems
}) {
  return (
    <View style={styles.fixedHeader}>
      {leftContent ? (
        leftContent
      ) : leftLabel ? (
        <TouchableOpacity style={styles.headerButton} onPress={onLeftPress}>
          <Text style={styles.cornerButtonText}>{leftLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButtonSpacer} />
      )}

      <View style={styles.fixedHeaderCenter} />

      <CurrencyBar coins={coins} gems={gems} />
    </View>
  )
})

export default ScreenHeader
