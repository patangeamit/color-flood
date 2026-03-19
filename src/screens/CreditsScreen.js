import React, { memo } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import ScreenHeader from "../components/ScreenHeader"
import styles from "../styles"

const CreditsScreen = memo(function CreditsScreen({ coins, gems, onBack }) {
  return (
    <View style={styles.levelsContainer}>
      <ScreenHeader
        leftLabel="Home"
        onLeftPress={onBack}
        coins={coins}
        gems={gems}
      />
      <View style={styles.headerSpacer} />

      <ScrollView contentContainerStyle={styles.creditsContainer}>
        <View style={styles.creditsHero}>
          <View style={styles.levelTopBadge}>
            <Text style={styles.levelTopBadgeText}>CREDITS</Text>
          </View>
          <Text style={styles.premiumTitle}>THANKS FOR PLAYING</Text>
          <Text style={styles.premiumSubtitle}>
            Color Flood is built as a fast, colorful puzzle game with a simple
            economy and a clean mobile-first layout.
          </Text>
        </View>

        <View style={styles.creditsCard}>
          <Text style={styles.creditsSectionTitle}>Game</Text>
          <Text style={styles.creditsLine}>Design and development: Amit</Text>
          <Text style={styles.creditsLine}>Framework: React Native + Expo</Text>
          <Text style={styles.creditsLine}>Storage: AsyncStorage</Text>
          <Text style={styles.creditsLine}>Celebration effect: Confetti Cannon</Text>
        </View>

        <View style={styles.creditsCard}>
          <Text style={styles.creditsSectionTitle}>Special Thanks</Text>
          <Text style={styles.creditsLine}>Everyone testing the level balance</Text>
          <Text style={styles.creditsLine}>Players sharing feedback on the economy</Text>
          <Text style={styles.creditsLine}>Friends helping shape the UI polish</Text>
        </View>

        <TouchableOpacity style={styles.storeButton} onPress={onBack}>
          <Text style={styles.storeButtonText}>BACK HOME</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
})

export default CreditsScreen
