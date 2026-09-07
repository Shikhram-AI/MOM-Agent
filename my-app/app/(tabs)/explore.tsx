import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { AlertCircle, FileText, RefreshCw, MailCheck } from 'lucide-react-native';
import { useExploreMeetings } from '@/hooks/useExploreMeetings';
import { storage } from '@/hooks/storage';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ExploreSearchBar } from '@/components/explore/ExploreSearchBar';
import { MeetingCard } from '@/components/explore/MeetingCard';

export default function ExploreMoMScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Read the saved verified email from local storage
  const loadUserEmail = async () => {
    const email = await storage.getUserEmail();
    setUserEmail(email);
  };

  useEffect(() => {
    loadUserEmail();
  }, []);

  // Pass userEmail to hook for backend filtering
  const { meetings, isLoading, isRefreshing, error, onRefresh, refetch } =
    useExploreMeetings(userEmail);

  // Re-check email and refetch whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadUserEmail();
      refetch();
    }, [refetch])
  );

  const filteredMeetings = (meetings || []).filter((item) =>
    (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

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
          <Text style={styles.errorText} numberOfLines={1}>
            {error}
          </Text>

          <TouchableOpacity onPress={() => refetch()} hitSlop={8}>
            <RefreshCw size={14} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your meetings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeetings}
          keyExtractor={(item, index) =>
            item?.id ? String(item.id) : `meeting-${index}`
          }
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
              <View style={styles.emptyIconCircle}>
                <FileText size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Results Found' : 'No Meetings Recorded'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No meetings match your search query.'
                  : userEmail
                    ? `Meetings recorded under ${userEmail} will appear here.`
                    : 'Verify your email and record a meeting to see minutes here.'}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingVertical: 70,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
});