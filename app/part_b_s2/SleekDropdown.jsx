import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../context/GlobalContext';

const getDropdownTheme = (baseColor, theme) => {
    // Default to the silver gem color #8697bc
    const primaryColor = baseColor || '#8697bc';
    const isDark = theme?.isDark;
    
    return {
        overlay: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
        card: isDark ? '#2A2A2A' : '#FFFFFF',
        border: primaryColor + '40', // 25% opacity
        accent: primaryColor,
        text: isDark ? '#CCCCCC' : '#333333',
        muted: isDark ? '#888888' : '#777777',
    };
};

export default function SleekDropdown({ label, options, selectedValue, onSelect, multiple = false, color }) {
    const { theme } = useTheme();
    const dropdownTheme = getDropdownTheme(color, theme);
    const [modalVisible, setModalVisible] = useState(false);

    const toggleSelection = (item) => {
        if (multiple) {
            let currentSelection = Array.isArray(selectedValue) ? selectedValue : [];
            if (currentSelection.includes(item)) {
                onSelect(currentSelection.filter(i => i !== item));
            } else {
                onSelect([...currentSelection, item]);
            }
        } else {
            onSelect(item);
            setModalVisible(false);
        }
    };

    const isSelected = (item) => {
        if (multiple) {
            return Array.isArray(selectedValue) && selectedValue.includes(item);
        }
        return selectedValue === item;
    };

    const getDisplayText = () => {
        if (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) {
            return `${selectedValue.length} options selected`;
        }
        return selectedValue && !multiple ? selectedValue : 'Select option';
    };

    return (
        <View style={styles.container}>
            {label ? <Text style={[styles.label, { color: dropdownTheme.muted }]}>{label}</Text> : null}
            <TouchableOpacity
                style={[styles.dropdownHeader, { borderColor: dropdownTheme.border, backgroundColor: dropdownTheme.card }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={[styles.headerText, { color: getDisplayText() !== 'Select option' ? dropdownTheme.text : dropdownTheme.muted }]}>
                    {getDisplayText()}
                </Text>
                <ChevronDown size={20} color={dropdownTheme.text} />
            </TouchableOpacity>
 
            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
                    <View style={[styles.modalContent, { backgroundColor: dropdownTheme.card, borderColor: dropdownTheme.border }]}>
                        <FlatList
                            data={options}
                            keyExtractor={(item, index) => (item ? item.toString() : `o-${index}`)}
                            renderItem={({ item }) => {
                                if (!item) return null;
                                return (
                                    <TouchableOpacity
                                        style={[styles.item, { borderBottomColor: dropdownTheme.border, backgroundColor: isSelected(item) ? dropdownTheme.border : 'transparent' }]}
                                        onPress={() => toggleSelection(item)}
                                    >
                                        <Text style={[styles.itemText, { color: dropdownTheme.text, fontFamily: isSelected(item) ? 'Outfit_600SemiBold' : 'Inter_400Regular' }]}>{item}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        {/* Done button for multi-select */}
                        {multiple && (
                            <TouchableOpacity style={[styles.doneButton, { borderTopColor: dropdownTheme.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.doneText, { color: dropdownTheme.accent }]}>DONE</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 5,
        zIndex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Outfit_600SemiBold',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 14,
    },
    headerText: {
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        maxHeight: '70%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 15,
    },
    doneButton: {
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    doneText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1,
    }
});
