import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/Toast';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BASE_URL = 'https://volunteer-management-system-myg0.onrender.com';

const OpportunityListScreen = ({ navigation }) => {
  const toast = useToast();
  const t = useTheme();
  const isAdmin = useContext(AuthContext).user?.role === 'admin';
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useContext(AuthContext);

  const applyLocalFilter = useCallback((all, searchTerm) => {
    if (!searchTerm) return all;
    const lower = searchTerm.toLowerCase();
    return all.filter(o =>
      o.title?.toLowerCase().includes(lower) ||
      o.organization?.toLowerCase().includes(lower) ||
      o.createdBy?.name?.toLowerCase().includes(lower) ||
      o.description?.toLowerCase().includes(lower) ||
      o.location?.toLowerCase().includes(lower)
    );
  }, []);

  const fetchOpportunities = useCallback(async (searchTerm = '') => {
    try {
      const response = await api.get('/api/opportunities');
      setAllOpportunities(response.data);
      setOpportunities(applyLocalFilter(response.data, searchTerm));
    } catch {
      toast.error('Error', 'Failed to load opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyLocalFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOpportunities(search);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/notifications');
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchOpportunities(search);
      fetchUnreadCount();
    }, [])
  );

  const handleSearch = (text) => {
    setSearch(text);
    setOpportunities(applyLocalFilter(allOpportunities, text));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities(search);
  };

  const s = makeStyles(t);

  const renderItem = ({ item }) => {
    const isOwn = item.createdBy?._id === user?.id || item.createdBy?.id === user?.id;
    const hasFundraisers = item.fundraisers?.length > 0;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('OpportunityDetail', { opportunityId: item._id })}
        activeOpacity={0.8}
      >
        {item.bannerImage ? (
          <Image source={{ uri: `${BASE_URL}/${item.bannerImage}` }} style={s.cardImage} resizeMode="cover" />
        ) : (
          <View style={s.cardImagePlaceholder}><Ionicons name="globe-outline" size={28} color={t.textMuted} /></View>
        )}

        <View style={s.cardHeader}>
          <View style={s.cardHeaderLeft}>
            <View style={s.categoryBadge}><Text style={s.categoryText}>{item.category}</Text></View>
            {item.status === 'closed' && (
              <View style={s.closedBadge}><Text style={s.closedBadgeText}>Closed</Text></View>
            )}
          </View>
          {isOwn && <View style={s.ownBadge}><Text style={s.ownBadgeText}>Your Post</Text></View>}
        </View>

        <Text style={s.cardTitle}>{item.title}</Text>
        {item.createdBy && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); navigation.navigate('PublisherProfile', { publisherId: item.createdBy._id }); }}
            style={s.publisherRow}
          >
            {item.createdBy.profileImage ? (
              <Image source={{ uri: `${BASE_URL}/${item.createdBy.profileImage}` }} style={s.publisherThumb} />
            ) : (
              <View style={s.publisherThumbPlaceholder}>
                <Text style={s.publisherThumbText}>{item.createdBy.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.publisherName}>{item.createdBy.name}</Text>
          </TouchableOpacity>
        )}
        {item.organization ? (
          <View style={s.cardDetailRow}>
            <Ionicons name="business-outline" size={13} color={t.textMuted} style={{ marginRight: 4 }} />
            <Text style={s.cardDetail}>{item.organization}</Text>
          </View>
        ) : null}
        <View style={s.cardDetailRow}>
          <Ionicons name="location-outline" size={13} color={t.textMuted} style={{ marginRight: 4 }} />
          <Text style={s.cardDetail}>{item.location}</Text>
        </View>
        <View style={s.cardDetailRow}>
          <Ionicons name="calendar-outline" size={13} color={t.textMuted} style={{ marginRight: 4 }} />
          <Text style={s.cardDetail}>
            {item.startDate
              ? `${new Date(item.startDate).toDateString()} — ${new Date(item.endDate).toDateString()}`
              : 'Date not set'}
          </Text>
        </View>

        {hasFundraisers && item.fundraisers.map(fr => {
          const pct = fr.targetAmount > 0 ? Math.min(100, Math.round((fr.collectedAmount / fr.targetAmount) * 100)) : 0;
          return (
            <View key={fr._id} style={s.fundraiserMini}>
              <View style={s.fundraiserMiniRow}>
                <Text style={s.fundraiserMiniName}>{fr.name}</Text>
                {fr.status === 'completed' && <Text style={s.fundraiserMiniDone}>✓ Done</Text>}
              </View>
              <View style={s.fundraiserMiniBarBg}>
                <View style={[s.fundraiserMiniBarFill, { width: `${pct}%`, backgroundColor: fr.status === 'completed' ? '#888' : t.success }]} />
              </View>
              <Text style={s.fundraiserMiniPct}>{pct}% · LKR {fr.collectedAmount.toLocaleString()} / {fr.targetAmount.toLocaleString()}</Text>
            </View>
          );
        })}

        <View style={s.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="people-outline" size={14} color={t.success} style={{ marginRight: 4 }} />
            <Text style={s.cardSpots}>{item.spotsAvailable} spots</Text>
          </View>
          <View style={[s.applyBadge, (isOwn || item.status === 'closed') && s.applyBadgeOwn]}>
            <Text style={s.applyBadgeText}>
              {isOwn || isAdmin ? 'View' : item.status === 'closed' ? 'Closed' : 'View & Apply'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = () => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>Opportunities</Text>
      <Text style={s.sectionCount}>{opportunities.length} found</Text>
    </View>
  );

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={t.accent} /></View>;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.welcomeText}>Hello, {user?.name}! {isAdmin ? '🛡️' : '👋'}</Text>
          <Text style={s.headerSubtitle}>{isAdmin ? 'Admin Dashboard' : 'Find your next volunteer opportunity'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={s.bellButton}>
          <Ionicons name="notifications-outline" size={24} color={t.textSub} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={s.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={t.danger} />
        </TouchableOpacity>
      </View>

      {/* Admin panel — 2 quick-action cards */}
      {isAdmin && (
        <View style={s.adminPanel}>
          <TouchableOpacity style={[s.adminCard, { borderLeftColor: t.accent }]} onPress={() => navigation.navigate('AdminAnalysis')}>
            <View style={[s.adminCardIcon, { backgroundColor: t.accentBg }]}>
              <Ionicons name="bar-chart-outline" size={22} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.adminCardTitle}>Platform Analytics</Text>
              <Text style={s.adminCardSub}>Users, opportunities & points</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.adminCard, { borderLeftColor: t.warning }]} onPress={() => navigation.navigate('AdminFeedback')}>
            <View style={[s.adminCardIcon, { backgroundColor: t.warningBg }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={t.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.adminCardTitle}>Feedbacks & Queries</Text>
              <Text style={s.adminCardSub}>View and reply to user feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search bar */}
      <View style={s.searchContainer}>
        <Ionicons name="search-outline" size={20} color={t.textMuted} style={s.searchIcon} />
        <TextInput style={s.searchInput} placeholderTextColor={t.textMuted} placeholder="Search opportunities..." value={search} onChangeText={handleSearch} />
      </View>

      {!isAdmin && (
        <TouchableOpacity style={s.createButton} onPress={() => navigation.navigate('CreateOpportunity')}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.createButtonText}>Post New Opportunity</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={opportunities}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={t.border} />
            <Text style={s.emptyText}>No opportunities found</Text>
            <Text style={s.emptySubText}>Be the first to post one!</Text>
          </View>
        }
      />
    </View>
  );
};

const makeStyles = (t) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg, paddingHorizontal: 15, paddingTop: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: t.text },
  headerSubtitle: { fontSize: 13, color: t.textMuted, marginTop: 2 },
  bellButton: { padding: 5, marginRight: 4, position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: t.danger, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  logoutButton: { padding: 5 },
  adminPanel: { marginBottom: 12, gap: 8 },
  adminCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: t.border, borderLeftWidth: 4, gap: 12 },
  adminCardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  adminCardTitle: { fontSize: 14, fontWeight: 'bold', color: t.text },
  adminCardSub: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgCard, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: t.border, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, padding: 12, fontSize: 16, color: t.text },
  categoryScroll: { marginBottom: 10 },
  categoryScrollContent: { paddingRight: 10, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bgCard, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: t.border, gap: 5, elevation: 1 },
  categoryChipActive: { backgroundColor: t.accent, borderColor: t.accent },
  categoryChipIcon: { fontSize: 16 },
  categoryChipLabel: { fontSize: 13, color: t.textSub, fontWeight: '600' },
  categoryChipLabelActive: { color: '#fff' },
  createButton: { backgroundColor: t.accent, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: t.text },
  sectionCount: { fontSize: 13, color: t.textMuted },
  publisherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  publisherThumb: { width: 22, height: 22, borderRadius: 11 },
  publisherThumbPlaceholder: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.bgCardAlt, justifyContent: 'center', alignItems: 'center' },
  publisherThumbText: { fontSize: 11, fontWeight: 'bold', color: t.textSub },
  publisherName: { fontSize: 12, color: t.accent, fontWeight: '600' },
  card: { backgroundColor: t.bgCard, borderRadius: 12, padding: 15, marginBottom: 12, elevation: 3, borderLeftWidth: 4, borderLeftColor: t.accent, borderWidth: 1, borderColor: t.border },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  cardImagePlaceholder: { width: '100%', height: 90, borderRadius: 8, marginBottom: 10, backgroundColor: t.accentBg, justifyContent: 'center', alignItems: 'center' },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  categoryBadge: { backgroundColor: t.accentBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { color: t.accent, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
  closedBadge: { backgroundColor: '#fde8e8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  closedBadgeText: { color: '#e74c3c', fontSize: 11, fontWeight: 'bold' },
  ownBadge: { backgroundColor: t.accentBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  ownBadgeText: { color: t.accent, fontSize: 11, fontWeight: 'bold' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: t.text, marginBottom: 7 },
  cardDetail: { color: t.textSub, marginBottom: 3, fontSize: 13 },
  fundraiserMini: { backgroundColor: t.successBg, borderRadius: 6, padding: 8, marginTop: 6, marginBottom: 2 },
  fundraiserMiniRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fundraiserMiniName: { fontSize: 11, fontWeight: 'bold', color: t.success },
  fundraiserMiniDone: { fontSize: 10, color: t.textMuted, fontWeight: 'bold' },
  fundraiserMiniBarBg: { height: 5, backgroundColor: t.border, borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  fundraiserMiniBarFill: { height: '100%', borderRadius: 3 },
  fundraiserMiniPct: { fontSize: 10, color: t.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardSpots: { color: t.success, fontWeight: 'bold', fontSize: 13 },
  applyBadge: { backgroundColor: t.accent, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  applyBadgeOwn: { backgroundColor: t.textMuted },
  applyBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: t.text, marginTop: 15 },
  emptySubText: { fontSize: 14, color: t.textMuted, marginTop: 5 },
});

export default OpportunityListScreen;
