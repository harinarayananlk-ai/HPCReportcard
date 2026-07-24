import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';

export default function AutoResizingInput({
  style,
  minHeight = 44,
  maxHeight = 200,
  placeholder,
  value,
  onChangeText,
  editable = true,
  ...props
}) {
  const { theme } = useTheme();
  const [height, setHeight] = useState(minHeight);
  const [isFocused, setIsFocused] = useState(false);

  const handleContentSizeChange = (event) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    // Calculate new height clamping between minHeight and maxHeight
    const newHeight = Math.max(minHeight, Math.min(maxHeight, contentHeight));
    setHeight(newHeight);
  };

  return (
    <TextInput
      multiline
      editable={editable}
      selectionColor="#0055FF"
      style={[
        styles.input,
        {
          minHeight,
          height,
          color: theme.text,
          borderColor: isFocused ? '#0055FF' : theme.border,
          borderBottomColor: isFocused ? '#0055FF' : theme.border,
          borderWidth: isFocused ? 1.5 : 1,
          borderBottomWidth: isFocused ? 2.5 : 1.2,
          shadowColor: isFocused ? '#0055FF' : 'transparent',
          shadowOpacity: isFocused ? 0.25 : 0,
          shadowRadius: isFocused ? 6 : 0,
          shadowOffset: { width: 0, height: 2 },
          backgroundColor: 'transparent',
        },
        style,
      ]}
      placeholder={placeholder}
      placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
      value={value}
      onChangeText={onChangeText}
      onContentSizeChange={handleContentSizeChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
});
