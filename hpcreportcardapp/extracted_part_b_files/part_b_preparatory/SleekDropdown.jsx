import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

const FOREST = {
    overlay:  'rgba(10, 30, 15, 0.72)',
    card:     'rgba(15, 45, 20, 0.95)',
    border:   'rgba(100, 220, 120, 0.3)',
    accent:   '#7CFC00',
    text:     '#E8F5E2',
    muted:    '#A8C8A0',
};

export default function SleekDropdown({ label, options, selectedValue, onSelect, multiple = false }) {
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
            {label ? <Text style={[styles.label, { color: FOREST.muted }]}>{label}</Text> : null}
            <TouchableOpacity
                style={[styles.dropdownHeader, { borderColor: FOREST.border, backgroundColor: FOREST.card }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={[styles.headerText, { color: getDisplayText() !== 'Select option' ? FOREST.text : FOREST.muted }]}>
                    {getDisplayText()}
                </Text>
                <ChevronDown size={20} color={FOREST.text} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
                    <View style={[styles.modalContent, { backgroundColor: FOREST.card, borderColor: FOREST.border }]}>
                        <FlatList
                            data={options}
                            keyExtractor={(item, index) => (item ? item.toString() : `o-${index}`)}
                            renderItem={({ item }) => {
                                if (!item) return null;
                                return (
                                    <TouchableOpacity
                                        style={[styles.item, { borderBottomColor: FOREST.border, backgroundColor: isSelected(item) ? FOREST.border : 'transparent' }]}
                                        onPress={() => toggleSelection(item)}
                                    >
                                        <Text style={[styles.itemText, { color: FOREST.text, fontFamily: isSelected(item) ? 'Outfit-Bold' : 'Outfit-Regular' }]}>{item}</Text>
                                        {isSelected(item) && <Check size={18} color={FOREST.accent} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        {/* Done button for multi-select */}
                        {multiple && (
                            <TouchableOpacity style={[styles.doneButton, { borderTopColor: FOREST.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={[styles.doneText, { color: FOREST.accent }]}>DONE</Text>
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
        fontFamily: 'Outfit-Bold',
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
        fontFamily: 'Outfit-Regular',
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
        fontFamily: 'Outfit-Bold',
        letterSpacing: 1,
    }
});
