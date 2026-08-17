import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

interface ExploreSearchBarProps {
    searchQuery: string;
    onChangeSearchQuery: (text: string) => void;
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
    searchQuery,
    onChangeSearchQuery,
}) => {
    return (
        <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" />
            
            <TextInput
                style={styles.searchInput}
                placeholder="Search by meeting title..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={onChangeSearchQuery}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        padding: 0,
    },
});