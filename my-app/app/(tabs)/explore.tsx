import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronRight,
  FileText,
  Users,
  RefreshCw,
} from 'lucide-react-native';
import { useExploreMeetings, MeetingRecord, MoMStatus } from '@/hooks/useExploreMeetings';

export default function ExploreMoMScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const renderStatusBadge = (status: MoMStatus) => {
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.badgeContainer, styles.badgeCompleted]}>
            <CheckCircle2 size={12} color="#059669" strokeWidth={2.2} />
            <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Transcribed</Text>
          </View>
        );
      case 'processing':
        return (
          <View style={[styles.badgeContainer, styles.badgeProcessing]}>
            <Loader2 size={12} color="#D97706" strokeWidth={2.2} />
            <Text style={[styles.badgeText, styles.badgeTextProcessing]}>Transcribing</Text>
          </View>
        );
      case 'failed':
        return (
          <View style={[styles.badgeContainer, styles.badgeFailed]}>
            <AlertCircle size={12} color="#DC2626" strokeWidth={2.2} />
            <Text style={[styles.badgeText, styles.badgeTextFailed]}>Failed</Text>
          </View>
        );
    }
  };

  const renderMeetingCard = ({ item }: { item: MeetingRecord }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      <Text style={styles.meetingTitle} numberOfLines={1}>
        {item.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={13} color="#64748B" />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color="#64748B" />
          <Text style={styles.metaText}>{item.duration}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.attendeesGroup}>
            <Users size={13} color="#64748B" strokeWidth={2} />
            <Text style={styles.attendeesText}>
              {item.attendeesCount} {item.attendeesCount === 1 ? 'attendee' : 'attendees'}
            </Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>
        <ChevronRight size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenHeading}>Meeting Minutes</Text>
          <Text style={styles.screenSubheading}>Recent recordings & transcripts</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.newRecordBtn}
          onPress={() => router.push('/' as any)}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newRecordText}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by meeting title..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
          renderItem={renderMeetingCard}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  newRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newRecordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendeesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  badgeProcessing: {
    backgroundColor: '#FEF3C7',
  },
  badgeFailed: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextCompleted: {
    color: '#059669',
  },
  badgeTextProcessing: {
    color: '#D97706',
  },
  badgeTextFailed: {
    color: '#DC2626',
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