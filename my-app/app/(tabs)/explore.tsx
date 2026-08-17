import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, RefreshControl, ActivityIndicator, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { AlertCircle, FileText, RefreshCw } from 'lucide-react-native';
import { useExploreMeetings } from '@/hooks/useExploreMeetings';

import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ExploreSearchBar } from '@/components/explore/ExploreSearchBar';
import { MeetingCard } from '@/components/explore/MeetingCard';

export default function ExploreMoMScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { meetings, isLoading, isRefreshing, error, onRefresh, refetch } = useExploreMeetings();

  // Auto-refresh when user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredMeetings = meetings.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FAFAFA"
      />

      {/* Header Bar */}
      <ExploreHeader />

      {/* Search Bar */}
      <ExploreSearchBar
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
      />

      {/* Error Banner */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={() => refetch()}>
            <RefreshCw size={14} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading recordings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeetings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MeetingCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Meetings Found</Text>

              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No recordings match your search query.'
                  : 'Recorded sessions will appear here once submitted.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    marginHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});