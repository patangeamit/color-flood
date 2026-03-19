import React, { memo } from "react"
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import styles from "../styles"

const GameDialog = memo(function GameDialog({ dialog, onClose }) {
  const isInstructions = dialog.variant === "instructions"

  return (
    <Modal
      transparent
      animationType="fade"
      visible={dialog.visible}
      onRequestClose={() => {
        const fallback =
          dialog.actions && dialog.actions[0] ? dialog.actions[0].key : null
        if (fallback) onClose(fallback)
      }}
    >
      <View
        style={[
          styles.dialogBackdrop,
          isInstructions && styles.instructionsBackdrop
        ]}
      >
        <View
          style={[
            styles.dialogCard,
            isInstructions && styles.instructionsDialogCard
          ]}
        >
          {isInstructions ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.instructionsScrollContent}
              >
                <View style={styles.instructionsHero}>
                  <View style={styles.instructionsBadge}>
                    <Text style={styles.instructionsBadgeText}>GAME GUIDE</Text>
                  </View>
                  <Text style={styles.instructionsTitle}>{dialog.title}</Text>
                  <Text style={styles.instructionsMessage}>{dialog.message}</Text>
                </View>

                <View style={styles.instructionsPreviewCard}>
                  <View style={styles.instructionsPreviewRow}>
                    <View style={[styles.instructionsPreviewTile, { backgroundColor: "#e74c3c" }]} />
                    <View style={[styles.instructionsPreviewTile, { backgroundColor: "#3498db" }]} />
                    <View style={[styles.instructionsPreviewTile, { backgroundColor: "#2ecc71" }]} />
                    <View style={[styles.instructionsPreviewTile, { backgroundColor: "#f1c40f" }]} />
                  </View>
                  <Text style={styles.instructionsPreviewLabel}>
                    Match colors to grow your territory.
                  </Text>
                </View>

                <View style={styles.instructionsPanel}>
                  <Text style={styles.instructionsPanelTitle}>How A Run Works</Text>
                  {dialog.items.map((item, index) => (
                    <View key={item} style={styles.instructionsRow}>
                      <View style={styles.instructionsStep}>
                        <Text style={styles.instructionsStepText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionsRowText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.instructionsTipsRow}>
                  <View style={styles.instructionsTipCard}>
                    <Text style={styles.instructionsTipLabel}>Goal</Text>
                    <Text style={styles.instructionsTipText}>Fill every tile.</Text>
                  </View>
                  <View style={styles.instructionsTipCard}>
                    <Text style={styles.instructionsTipLabel}>Watch</Text>
                    <Text style={styles.instructionsTipText}>Moves left.</Text>
                  </View>
                </View>
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              <Text style={styles.dialogMessage}>{dialog.message}</Text>
            </>
          )}

          <View
            style={[
              styles.dialogActions,
              isInstructions && styles.instructionsActions
            ]}
          >
            {dialog.actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.dialogButton,
                  isInstructions && styles.instructionsPrimaryButton,
                  action.style === "ghost"
                    ? styles.dialogButtonGhost
                    : styles.dialogButtonPrimary
                ]}
                onPress={() => onClose(action.key)}
              >
                <Text
                  style={[
                    styles.dialogButtonText,
                    action.style === "ghost"
                      ? styles.dialogButtonTextGhost
                      : styles.dialogButtonTextPrimary
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
})

export default GameDialog
