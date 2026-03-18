import React, { memo } from "react"
import { Text, View } from "react-native"
import styles from "../styles"

const CurrencyBadge = memo(function CurrencyBadge({
  value,
  icon,
  label,
  tintColor,
  style
}) {
  return (
    <View style={[styles.currencyBadge, style]}>
      <Text style={[styles.currencyIcon, { color: tintColor }]}>{icon}</Text>
      <Text style={styles.currencyText}>{value}</Text>
      <Text style={styles.currencyLabel}>{label}</Text>
    </View>
  )
})

const CurrencyBar = memo(function CurrencyBar({ coins, gems, style }) {
  return (
    <View style={[styles.currencyBar, style]}>
      <CurrencyBadge
        value={coins}
        icon="●"
        label="Coins"
        tintColor="#f1c40f"
      />
      <CurrencyBadge
        value={gems}
        icon="✦"
        label="Gems"
        tintColor="#7ed7ff"
      />
    </View>
  )
})

export default CurrencyBar
