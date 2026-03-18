import React, { memo } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import ScreenHeader from "../components/ScreenHeader"
import { COIN_EXCHANGE_OFFERS, GEM_PACKS } from "../config"
import styles from "../styles"

const StoreScreen = memo(function StoreScreen({
  coins,
  gems,
  onBack,
  onBuyGemPack,
  onExchangeGems,
  onRestorePurchases,
  onHackPress
}) {
  return (
    <View style={styles.levelsContainer}>
      <ScreenHeader
        leftLabel="Home"
        onLeftPress={onBack}
        coins={coins}
        gems={gems}
      />
      <View style={styles.headerSpacer} />

      <ScrollView
        contentContainerStyle={styles.storeContainer}
        style={styles.storeScreen}
      >

      <View style={styles.premiumHero}>
        <Text style={styles.crown}>✦</Text>
        <View style={styles.levelTopBadge}>
          <Text style={styles.levelTopBadgeText}>HARD CURRENCY SHOP</Text>
        </View>
        <Text style={styles.premiumTitle}>BUY GEMS</Text>
        <Text style={styles.premiumSubtitle}>
          Gems are the premium currency. Buy them with real money, then trade
          them in for coin boosts whenever your run needs help.
        </Text>
      </View>

      <View style={styles.premiumFeaturePanel}>
        {[
          "Coins are the soft currency used for level entry",
          "Gems are the hard currency purchased in the shop",
          "Use gems for emergency coin refills",
          "Store wiring can later connect to App Store / Play billing"
        ].map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.shopSection}>
        <Text style={styles.shopSectionTitle}>Gem Packs</Text>
        {GEM_PACKS.map(pack => {
          const total = pack.amount + pack.bonus

          return (
            <TouchableOpacity
              key={pack.id}
              style={styles.storePackCard}
              onPress={() => onBuyGemPack(pack)}
            >
              <View>
                <Text style={styles.storePackTitle}>{pack.title}</Text>
                <Text style={styles.storePackAmount}>{total} Gems</Text>
                <Text style={styles.storePackBonus}>
                  {pack.amount} base + {pack.bonus} bonus
                </Text>
              </View>
              <View style={styles.storePackPriceWrap}>
                <Text style={styles.storePackPrice}>{pack.price}</Text>
                <Text style={styles.storePackCta}>Buy</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.shopSection}>
        <Text style={styles.shopSectionTitle}>Gem Exchange</Text>
        {COIN_EXCHANGE_OFFERS.map(offer => (
          <TouchableOpacity
            key={offer.id}
            style={styles.exchangeCard}
            onPress={() => onExchangeGems(offer)}
          >
            <View>
              <Text style={styles.exchangeTitle}>{offer.coins} Coins</Text>
              <Text style={styles.exchangeSubtitle}>
                Spend {offer.gems} gems for a quick refill
              </Text>
            </View>
            <Text style={styles.exchangeCost}>{offer.gems} ✦</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.hackButton} onPress={onHackPress}>
        <Text style={styles.hackButtonText}>TEST HACK</Text>
      </TouchableOpacity>

      <Text style={styles.purchaseNote}>
        Hard currency is now the only monetization path in the app.
      </Text>

      <TouchableOpacity onPress={onRestorePurchases}>
        <Text style={styles.restore}>Restore Purchase</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  )
})

export default StoreScreen
