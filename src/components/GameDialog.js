import React, { memo } from "react"
import { Modal, Text, TouchableOpacity, View } from "react-native"
import styles from "../styles"

const GameDialog = memo(function GameDialog({ dialog, onClose }) {
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
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{dialog.title}</Text>
          <Text style={styles.dialogMessage}>{dialog.message}</Text>

          <View style={styles.dialogActions}>
            {dialog.actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.dialogButton,
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
