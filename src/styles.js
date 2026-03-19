import { StyleSheet } from "react-native"
import { HEADER_HEIGHT, TOP_INSET } from "./config"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    width: "100%"
  },

  splashScreen: {
    flex: 1,
    backgroundColor: "#0f0f0f"
  },

  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "900"
  },

  subHeader: {
    color: "#8d96a8",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "700"
  },

  gameHeader: {
    width: "100%"
  },

  gameHeaderTitle: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10
  },

  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    height: TOP_INSET + HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: TOP_INSET,
    paddingBottom: 12,
    backgroundColor: "#0f0f0f"
  },

  fixedHeaderCenter: {
    flex: 1,
    paddingHorizontal: 12
  },

  headerSpacer: {
    height: TOP_INSET + HEADER_HEIGHT
  },

  screenBody: {
    flex: 1,
    width: "100%"
  },

  moves: {
    color: "white",
    marginBottom: 14,
    fontWeight: "900",
    fontSize: 18
  },

  gameContent: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 12
  },

  board: {
    alignItems: "center",
    justifyContent: "center"
  },

  boardRow: {
    flexDirection: "row"
  },

  tile: {
    margin: 1.5,
    borderRadius: 5,
    borderColor: "white"
  },

  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360
  },

  paletteDock: {
    flexShrink: 0,
    width: "100%",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 26,
    paddingHorizontal: 18,
    backgroundColor: "#151b25",
    borderTopWidth: 1,
    borderTopColor: "#2d3648"
  },

  paletteSlot: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 12
  },

  paletteBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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

  winPanel: {
    width: "86%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "#fff4db",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 4,
    borderColor: "#ffd54f"
  },

  winBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  winBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  winTitle: {
    color: "#1c1404",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  winScore: {
    color: "#2b2110",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16
  },

  winHighScore: {
    color: "#7b6541",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 6
  },

  winRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171d29",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20
  },

  coinIcon: {
    color: "#f1c40f",
    fontSize: 22,
    marginRight: 8
  },

  winRewardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900"
  },

  winPrimaryButton: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "#2ecc71",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },

  winPrimaryButtonText: {
    color: "#062010",
    fontSize: 20,
    fontWeight: "900"
  },

  winSecondaryButton: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#1b2330",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },

  winSecondaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800"
  },

  losePanel: {
    width: "86%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "#1b2330",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 4,
    borderColor: "#ff6b35"
  },

  loseBadge: {
    backgroundColor: "#ffd54f",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  loseBadgeText: {
    color: "#201600",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  loseTitle: {
    color: "#fff4db",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  loseSub: {
    color: "#d5c7aa",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center"
  },

  loseInfoPill: {
    backgroundColor: "#10151f",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 18
  },

  loseInfoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900"
  },

  losePrimaryButton: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "#ff6b35",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },

  losePrimaryButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900"
  },

  loseSecondaryButton: {
    width: "100%",
    marginTop: 12,
    backgroundColor: "#fff4db",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },

  loseSecondaryButtonText: {
    color: "#1b2330",
    fontSize: 18,
    fontWeight: "900"
  },

  overlayActionRow: {
    flexDirection: "row",
    marginTop: 14
  },

  overlayMiniButton: {
    marginHorizontal: 6,
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10
  },

  overlayMiniButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16
  },

  cornerButton: {
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },

  headerButton: {
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },

  headerButtonSpacer: {
    width: 72
  },

  gameHeaderLeftActions: {
    flexDirection: "row",
    alignItems: "center"
  },

  headerIconButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    alignItems: "center",
    justifyContent: "center"
  },

  headerIconButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900"
  },

  headerRewardBadge: {
    minWidth: 88,
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6
  },

  headerRewardTitle: {
    color: "#7ed7ff",
    fontSize: 11,
    fontWeight: "900"
  },

  headerRewardText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2
  },

  cornerButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15
  },

  currencyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c2331",
    borderWidth: 1,
    borderColor: "#344056",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },

  currencyIcon: {
    fontSize: 16,
    marginRight: 6
  },

  currencyText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16
  },

  currencyLabel: {
    color: "#8d96a8",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
    textTransform: "uppercase"
  },

  homeContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    width: "100%",
    paddingBottom: 28
  },

  homeHeader: {
    width: "100%"
  },

  homeHeaderSpacer: {
    width: 76
  },

  homeTitleSection: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18
  },

  homeTopBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 18
  },

  homeTopBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.1
  },

  homeTitleBlock: {
    alignItems: "center"
  },

  homeTitleAccent: {
    color: "#fff4db",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    marginBottom: -8
  },

  homeContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20
  },

  dailyRewardCard: {
    width: "86%",
    backgroundColor: "#171d29",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  dailyRewardEyebrow: {
    color: "#7ed7ff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },

  dailyRewardTitle: {
    color: "#fff4db",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6
  },

  dailyRewardSubtitle: {
    color: "#a3adbf",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
    maxWidth: 180
  },

  dailyRewardButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96
  },

  dailyRewardButtonDisabled: {
    backgroundColor: "#2a3242"
  },

  dailyRewardButtonText: {
    color: "#07111f",
    fontSize: 14,
    fontWeight: "900"
  },

  homePreview: {
    marginTop: 14
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center"
  },

  titleLetter: {
    fontSize: 58,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12
  },

  homeTagline: {
    color: "#a3adbf",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    letterSpacing: 0.3
  },

  playButton: {
    width: "80%",
    height: 64,
    backgroundColor: "#2ecc71",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },

  playText: {
    fontWeight: "900",
    fontSize: 22,
    // color: "#062010"
    color: "#ffffff" 
  },

  storeButton: {
    width: "80%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#1b2330",
    // borderWidth: 3,
    // borderColor: "#ff6b35",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14
  },

  storeButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16
  },

  homeActionRow: {
    flexDirection: "row",
    width: "80%",
    marginTop: 14,
    gap: 10
  },

  homeSecondaryAction: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    alignItems: "center",
    justifyContent: "center"
  },

  homeSecondaryActionText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16
  },

  homeCreditsButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10
  },

  homeCreditsButtonText: {
    color: "#a3adbf",
    fontSize: 15,
    fontWeight: "800",
    textDecorationLine: "underline"
  },

  bestText: {
    color: "#aaa",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "800"
  },

  version: {
    color: "#7a6a49",
    fontSize: 13,
    marginTop: 18,
    fontWeight: "700"
  },

  levelsContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    width: "100%",
    paddingBottom: 26
  },

  levelsHeader: {
    width: "100%"
  },

  levelTitleWrap: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20
  },

  levelTopBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  levelTopBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2
  },

  levelTitle: {
    color: "#fff4db",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18
  },

  levelSubtitle: {
    color: "#d4c7aa",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 340,
    fontWeight: "700"
  },

  levelDeck: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#ffd54f",
    backgroundColor: "#ffe8a3",
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }
  },

  levelScroller: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  levelCard: {
    width: "30%",
    marginBottom: 18,
    borderRadius: 30,
    backgroundColor: "#1b2330",
    borderWidth: 3,
    borderColor: "#2f3c53",
    padding: 18,
    justifyContent: "space-between"
  },

  levelCardActive: {
    borderColor: "#2ecc71"
  },

  levelCardLocked: {
    opacity: 0.42
  },

  lockedLevelWrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },

  levelPlayButton: {
    borderRadius: 999,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },

  levelPlayButtonText: {
    color: "#f3f3f3",
    fontWeight: "900",
    fontSize: 30
  },

  storeScreen: {
    backgroundColor: "#0f0f0f"
  },

  storeContainer: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 60
  },

  gameStatsRow: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8
  },

  gameScorePill: {
    backgroundColor: "#171d29",
    borderWidth: 1,
    borderColor: "#2f3c53",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  gameScoreText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900"
  },

  premiumHero: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22
  },

  crown: {
    fontSize: 72,
    marginBottom: 12
  },

  premiumTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff4db",
    marginTop: 18,
    alignContent: "center",
    textAlign: "center"
  },

  premiumSubtitle: {
    color: "#d4c7aa",
    fontSize: 17,
    textAlign: "center",
    maxWidth: 320,
    marginTop: 10,
    fontWeight: "700",
    lineHeight: 24
  },

  premiumFeaturePanel: {
    backgroundColor: "#fff4db",
    borderRadius: 28,
    padding: 22,
    borderWidth: 3,
    borderColor: "#ffd54f",
    width: "86%",
    marginVertical: 20
  },

  shopSection: {
    width: "86%",
    marginBottom: 18
  },

  shopSectionTitle: {
    color: "#fff4db",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },

  featureCheck: {
    color: "#2ecc71",
    fontSize: 22,
    fontWeight: "900",
    marginRight: 12
  },

  featureText: {
    color: "#201600",
    fontSize: 18,
    fontWeight: "800",
    flex: 1
  },

  storePackCard: {
    backgroundColor: "#171d29",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  storePackTitle: {
    color: "#8d96a8",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },

  storePackAmount: {
    color: "#fff4db",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6
  },

  storePackBonus: {
    color: "#7ed7ff",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6
  },

  storePackPriceWrap: {
    alignItems: "flex-end"
  },

  storePackPrice: {
    color: "#2ecc71",
    fontSize: 24,
    fontWeight: "900"
  },

  storePackCta: {
    color: "#fff4db",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6
  },

  exchangeCard: {
    backgroundColor: "#fff4db",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#ffd54f",
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  exchangeTitle: {
    color: "#201600",
    fontSize: 22,
    fontWeight: "900"
  },

  exchangeSubtitle: {
    color: "#6b5a36",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4
  },

  exchangeCost: {
    color: "#1b2330",
    fontSize: 22,
    fontWeight: "900"
  },

  hackButton: {
    marginTop: 12,
    backgroundColor: "#1b2330",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#7ed7ff",
    paddingHorizontal: 18,
    paddingVertical: 12
  },

  hackButtonText: {
    color: "#7ed7ff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8
  },

  purchaseNote: {
    color: "#a99c80",
    fontSize: 14,
    marginTop: 14,
    fontWeight: "700"
  },

  restore: {
    marginTop: 14,
    color: "#fff4db",
    fontWeight: "800",
    textDecorationLine: "underline"
  },

  creditsContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 48
  },

  creditsHero: {
    width: "100%",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 18
  },

  creditsCard: {
    width: "86%",
    backgroundColor: "#171d29",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 20,
    marginBottom: 16
  },

  creditsSectionTitle: {
    color: "#fff4db",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10
  },

  creditsLine: {
    color: "#c3cbda",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    marginBottom: 6
  },

  dialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 14, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },

  instructionsBackdrop: {
    backgroundColor: "rgba(8, 11, 18, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 24
  },

  dialogCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#161d29",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2f3c53",
    padding: 22
  },

  instructionsDialogCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: "#fff4db",
    borderWidth: 3,
    borderColor: "#ffd54f",
    borderRadius: 30,
    padding: 0,
    overflow: "hidden"
  },

  instructionsScrollContent: {
    padding: 24
  },

  instructionsHero: {
    alignItems: "center"
  },

  instructionsBadge: {
    backgroundColor: "#ff6b35",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },

  instructionsBadgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1
  },

  instructionsTitle: {
    color: "#1c1404",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16
  },

  instructionsMessage: {
    color: "#6f5a35",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    fontWeight: "800",
    marginTop: 10
  },

  instructionsPanel: {
    backgroundColor: "#171d29",
    borderRadius: 24,
    padding: 18,
    marginTop: 20
  },

  instructionsPanelTitle: {
    color: "#fff4db",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 14
  },

  instructionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },

  instructionsStep: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2ecc71",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },

  instructionsStepText: {
    color: "#062010",
    fontSize: 16,
    fontWeight: "900"
  },

  instructionsRowText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800"
  },

  instructionsPreviewCard: {
    backgroundColor: "#1b2330",
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    alignItems: "center"
  },

  instructionsPreviewRow: {
    flexDirection: "row"
  },

  instructionsPreviewTile: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginHorizontal: 4
  },

  instructionsPreviewLabel: {
    color: "#fff4db",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14
  },

  instructionsTipsRow: {
    flexDirection: "row",
    marginTop: 16
  },

  instructionsTipCard: {
    flex: 1,
    backgroundColor: "#ffefbf",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 4
  },

  instructionsTipLabel: {
    color: "#ff6b35",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },

  instructionsTipText: {
    color: "#1c1404",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6
  },

  dialogTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold"
  },

  dialogMessage: {
    color: "#a3adbf",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10
  },

  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 22
  },

  instructionsActions: {
    marginTop: 0,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff4db",
    borderTopWidth: 1,
    borderTopColor: "#edd9a0"
  },

  dialogButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginLeft: 10
  },

  instructionsPrimaryButton: {
    flex: 1,
    marginLeft: 0,
    minHeight: 52,
    justifyContent: "center"
  },

  dialogButtonPrimary: {
    backgroundColor: "#7ed7ff"
  },

  dialogButtonGhost: {
    backgroundColor: "#0f141d",
    borderWidth: 1,
    borderColor: "#2f3c53"
  },

  dialogButtonText: {
    fontWeight: "bold",
    textAlign: "center",
  },

  dialogButtonTextPrimary: {
    color: "#07111f"
  },

  dialogButtonTextGhost: {
    color: "white"
  }
})

export default styles
