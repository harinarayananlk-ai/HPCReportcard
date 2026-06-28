import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function RubricPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/part_b_s2/SelectionPage');
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
            <ActivityIndicator size="large" color="#00D4FF" />
        </View>
    );
}
