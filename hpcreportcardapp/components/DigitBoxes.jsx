import React, { useRef, useState, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../context/GlobalContext";

export default function DigitBoxes({ length, value = "", onValueChange }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(Array(length).fill(""));

  useEffect(() => {
    // Sync external value
    const newDigits = Array(length).fill("");
    for (let i = 0; i < Math.min(value.length, length); i++) {
        newDigits[i] = value[i];
    }
    if (newDigits.join("") !== digits.join("")) {
        setDigits(newDigits);
    }
  }, [value, length]);

  const handleChange = (text, index) => {
    // If pasted string
    if (text.length > 1) {
       let pasted = text.replace(/[^0-9]/g, "").slice(0, length - index);
       const updated = [...digits];
       for (let i = 0; i < pasted.length; i++) {
           updated[index + i] = pasted[i];
       }
       setDigits(updated);
       onValueChange(updated.join(""));
       
       const focusIndex = Math.min(index + pasted.length, length - 1);
       inputsRef.current[focusIndex]?.focus();
       return;
    }

    const newChar = text.replace(/[^0-9]/g, ""); // strip non-numeric
    const updated = [...digits];
    updated[index] = newChar;
    setDigits(updated);
    onValueChange(updated.join(""));

    // Advance focus
    if (newChar && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
        if (!digits[index] && index > 0) {
            // Current box empty, completely erase the prior box implicitly
            const updated = [...digits];
            updated[index - 1] = "";
            setDigits(updated);
            onValueChange(updated.join(""));
            inputsRef.current[index - 1]?.focus();
        }
    }
  };

  // Divide into two equal-ish rows if length >= 8
  const wrapThreshold = 8;
  const splitIndex = length >= wrapThreshold ? Math.ceil(length / 2) : length;

  const firstRow = digits.slice(0, splitIndex);
  const secondRow = digits.slice(splitIndex);

  const renderBoxes = (rowDigits, rowOffset) => {
    return (
      <View style={styles.row}>
        {rowDigits.map((char, i) => {
          const actualIndex = rowOffset + i;
          return (
            <TextInput
              key={actualIndex}
              style={[styles.box, char ? styles.boxFilled : null]}
              keyboardType="number-pad"
              maxLength={1} // Strict 1 character
              value={char}
              onChangeText={(t) => handleChange(t, actualIndex)}
              onKeyPress={(e) => handleKeyPress(e, actualIndex)}
              ref={(ref) => (inputsRef.current[actualIndex] = ref)}
              selectionColor={theme.text}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderBoxes(firstRow, 0)}
      {secondRow.length > 0 && <View style={{ height: 10 }} />}
      {secondRow.length > 0 && renderBoxes(secondRow, splitIndex)}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  box: {
    width: 38,
    height: 44,
    marginHorizontal: 6,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 8,
    textAlign: "center",
    color: theme.text,
    fontSize: 18,
    fontWeight: "700",
  },
  boxFilled: {
    borderColor: theme.accent, // Highlight active/filled state accurately
    backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
  }
});
