import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Info, X } from 'lucide-react-native';

const FOREST = {
    overlay:  'rgba(10, 30, 15, 0.72)',
    card:     'rgba(15, 45, 20, 0.95)',
    border:   'rgba(100, 220, 120, 0.3)',
    accent:   '#7CFC00',
    text:     '#E8F5E2',
    muted:    '#A8C8A0',
};

export default function InfoModal({ title, items }) {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconButton}>
                <Info size={15} color={FOREST.accent} />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: FOREST.card, borderColor: FOREST.border }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: FOREST.border }]}>
                            <Text style={[styles.title, { color: FOREST.text }]}>{title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                <X size={20} color={FOREST.muted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.scroll}>
                            {items.map((item, idx) => (
                                <View key={idx} style={[styles.itemRow, { borderBottomColor: FOREST.border }]}>
                                    <Text style={[styles.itemTitle, { color: FOREST.text }]}>{item.id}: </Text>
                                    <Text style={[styles.itemText, { color: FOREST.muted }]}>{item.text}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginLeft: 4,
        justifyContent: 'center',
    },
    iconButton: {
        padding: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Outfit-Bold',
    },
    scroll: {
        padding: 20,
    },
    itemRow: {
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        marginBottom: 4,
    },
    itemText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'Outfit-Regular',
    }
});
