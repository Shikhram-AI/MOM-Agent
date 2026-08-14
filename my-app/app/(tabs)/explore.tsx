import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
} from 'lucide-react-native';

export type MoMStatus = 'completed' | 'processing' | 'failed';

export interface MoMItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  status: MoMStatus;
  summaryPreview?: string;
  actionItemsCount?: number;
}

const DEFAULT_MOMS: MoMItem[] = [
  {
    id: '1',
    title: 'Design System & Token Architecture',
    date: 'Aug 14, 2026',
    duration: '24m 12s',
    status: 'completed',
    summaryPreview: 'Approved semantic color palette. Garv to update the Figma component library.',
    actionItemsCount: 4,
  },
  {
    id: '2',
    title: 'Sprint 14 Retrospective & Planning',
    date: 'Aug 13, 2026',
    duration: '45m 00s',
    status: 'completed',
    summaryPreview: 'Addressed Lambda cold starts; shifted priority to mobile auth tokens.',
    actionItemsCount: 6,
  },
];

interface ExploreMoMScreenProps {
  moms?: MoMItem[];
  onNewRecord?: () => void;
}

export default function ExploreMoMScreen({
  moms = DEFAULT_MOMS,
  onNewRecord,
}: ExploreMoMScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Safe fallback to empty array if moms is undefined/null
  const safeMomsList = moms ?? DEFAULT_MOMS;

  const filteredMoms = safeMomsList.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRecordPress = () => {
    if (onNewRecord) {
      onNewRecord();
    } else {
      // In Expo Router tab layout, navigate to the record/index tab
      router.push('/' as any);
    }
  };

  const renderStatusBadge = (status: MoMStatus) => {
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.badgeContainer, styles.badgeCompleted]}>
            <CheckCircle2 size={12} color="#059669" />
            <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Transcribed</Text>
          </View>
        );
      case 'processing':
        return (
          <View style={[styles.badgeContainer, styles.badgeProcessing]}>
            <Loader2 size={12} color="#D97706" />
            <Text style={[styles.badgeText, styles.badgeTextProcessing]}>Analyzing</Text>
          </View>
        );
      case 'failed':
        return (
          <View style={[styles.badgeContainer, styles.badgeFailed]}>
            <AlertCircle size={12} color="#DC2626" />
            <Text style={[styles.badgeText, styles.badgeTextFailed]}>Failed</Text>
          </View>
        );
    }
  };

  const renderMoMCard = ({ item }: { item: MoMItem }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.meetingTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={13} color="#94A3B8" />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={13} color="#94A3B8" />
          <Text style={styles.metaText}>{item.duration}</Text>
        </View>
      </View>

      {item.summaryPreview && (
        <Text style={styles.summaryText} numberOfLines={2}>
          {item.summaryPreview}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.actionItemsText}>
          {item.actionItemsCount ?? 0} Action Items extracted
        </Text>
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
          <Text style={styles.screenSubheading}>All structured notes & summaries</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.newRecordBtn}
          onPress={handleRecordPress}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newRecordText}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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

      {/* Feed */}
      <FlatList
        data={filteredMoms}
        keyExtractor={(item) => item.id}
        renderItem={renderMoMCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Meeting Minutes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the record button to capture your first session.
            </Text>
          </View>
        }
      />
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
  },
  screenSubheading: {
    fontSize: 13,
    color: '#64748B',
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
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionItemsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
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