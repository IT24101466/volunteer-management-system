import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, SectionList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../../components/Toast';
import api from '../../api';

const BASE_URL = 'https://volunteer-management-system-myg0.onrender.com';

const statusColor = (s) => {
  if (s === 'active') return '#27ae60';
  if (s === 'completed') return '#888';
  if (s === 'stopped') return '#e74c3c';
  return '#f39c12';
};

const statusLabel = (s) => {
  if (s === 'active') return 'Active';
  if (s === 'completed') return 'Completed';
  if (s === 'stopped') return 'Stopped';
  return s;
};

const MyFundraisersScreen = ({ navigation }) => {
  const toast = useToast();
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFundraisers = async () => {
    try {
      const res = await api.get('/api/fundraisers/my');
      setFundraisers(res.data);
    } catch {
      toast.error('Error', 'Failed to load your fundraisers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchFundraisers();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchFundraisers();
  };

  // Build sections for fundraisers tab
  const standalone = fundraisers.filter(f => !f.opportunity);
  const fromOpportunities = fundraisers.filter(f => !!f.opportunity);
  const sections = [
    { title: 'Standalone Fundraisers', data: standalone },
    { title: 'From Volunteering Opportunities', data: fromOpportunities }
  ];

  const renderFundraiserCard = ({ item }) => {
    const pct = item.targetAmount > 0
      ? Math.min(100, Math.round((item.collectedAmount / item.targetAmount) * 100))
      : 0;
    const sColor = statusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ManageMyFundraiser', { fundraiserId: item._id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardIconCircle}>
            <Ionicons name="cash-outline" size={22} color="#27ae60" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            {item.opportunity?.title ? (
              <Text style={styles.cardOppTitle} numberOfLines={1}>{item.opportunity.title}</Text>
            ) : item.description ? (
              <Text style={styles.cardOppTitle} numberOfLines={1}>{item.description}</Text>
            ) : (
              <Text style={styles.cardOppTitle}>Standalone fundraiser</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sColor }]}>
            <Text style={styles.statusBadgeText}>{statusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {
            width: `${pct}%`,
            backgroundColor: item.status === 'completed' ? '#888' : '#27ae60'
          }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.collectedText}>LKR {(item.collectedAmount || 0).toLocaleString()}</Text>
          <Text style={styles.targetText}> / {item.targetAmount.toLocaleString()} ({pct}%)</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Ionicons name="people-outline" size={14} color="#888" style={{ marginRight: 4 }} />
            <Text style={styles.footerStatText}>{item.donorCount || 0} donor{item.donorCount !== 1 ? 's' : ''}</Text>
          </View>
          {item.pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={13} color="#f39c12" style={{ marginRight: 4 }} />
              <Text style={styles.pendingBadgeText}>{item.pendingCount} pending</Text>
            </View>
          )}
          <View style={styles.manageBtnRow}>
            <Text style={styles.manageBtnText}>Manage</Text>
            <Ionicons name="chevron-forward" size={15} color="#2e86de" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => {
    if (section.title === 'From Volunteering Opportunities') return null;
    return (
      <View style={styles.sectionHeader}>
        <Ionicons name="cash-outline" size={16} color="#555" style={{ marginRight: 6 }} />
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#27ae60" /></View>;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>My Fundraisers</Text>
          <Text style={styles.topBarSub}>{fundraisers.length} total</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateFundraiser')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>Create New</Text>
        </TouchableOpacity>
      </View>

      {fundraisers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No Fundraisers Yet</Text>
            <Text style={styles.emptySubtitle}>Create your first standalone fundraiser or add one to an opportunity you created.</Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => navigation.navigate('CreateFundraiser')}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCreateBtnText}>Create Fundraiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item._id}
            renderItem={renderFundraiserCard}
            renderSectionHeader={renderSectionHeader}
            renderSectionFooter={({ section }) => section.data.length === 0 ? (
              <View style={styles.sectionEmpty}>
                <Text style={styles.sectionEmptyText}>
                  {section.title === 'Standalone Fundraisers' ? 'No standalone fundraisers yet.' : 'No fundraisers linked to opportunities.'}
                </Text>
              </View>
            ) : null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 15, paddingTop: 10 }}
            stickySectionHeadersEnabled={false}
          />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  topBarTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  topBarSub: { fontSize: 12, color: '#999', marginTop: 2 },
  createBtn: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 5 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#27ae60' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#27ae60' },
  tabTextPending: { color: '#f39c12' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 10
  },
  sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#555', flex: 1 },
  sectionCount: {
    backgroundColor: '#e8f4fd', borderRadius: 12, paddingHorizontal: 8,
    paddingVertical: 2, fontSize: 12, color: '#2e86de', fontWeight: 'bold'
  },
  sectionEmpty: { paddingVertical: 12, alignItems: 'center' },
  sectionEmptyText: { color: '#bbb', fontSize: 13 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, elevation: 3
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#d5f5e3', justifyContent: 'center', alignItems: 'center'
  },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  cardOppTitle: { fontSize: 12, color: '#888' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  progressBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },

  statsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  collectedText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  targetText: { fontSize: 12, color: '#888' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerStat: { flexDirection: 'row', alignItems: 'center' },
  footerStatText: { fontSize: 12, color: '#888' },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff8e1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3
  },
  pendingBadgeText: { fontSize: 12, color: '#f39c12', fontWeight: '600' },
  manageBtnRow: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  manageBtnText: { fontSize: 13, color: '#2e86de', fontWeight: 'bold', marginRight: 2 },

  // Pending donations
  pendingCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, elevation: 2, borderLeftWidth: 3, borderLeftColor: '#f39c12'
  },
  pendingCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pendingDonorCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center'
  },
  pendingDonorName: { fontSize: 15, fontWeight: 'bold', color: '#2e86de' },
  pendingFundraiserName: { fontSize: 12, color: '#888', marginTop: 1 },
  pendingAmountBadge: { backgroundColor: '#d5f5e3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  pendingAmountText: { fontSize: 13, fontWeight: 'bold', color: '#27ae60' },
  pendingMessage: { fontSize: 12, color: '#777', fontStyle: 'italic', marginBottom: 4 },
  pendingDate: { fontSize: 11, color: '#bbb', marginBottom: 10 },
  pendingActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#27ae60', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8
  },
  acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fde8e8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#e74c3c'
  },
  rejectBtnText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
  detailsBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsBtnText: { color: '#2e86de', fontWeight: 'bold', fontSize: 13 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyCreateBtn: {
    backgroundColor: '#27ae60', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center'
  },
  emptyCreateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Detail Modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    width: '100%', maxHeight: '85%', elevation: 10
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  detailLabel: { fontSize: 13, color: '#888', width: 70 },
  detailValue: { flex: 1, fontSize: 14, color: '#333' },
  detailMsgBox: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginVertical: 10 },
  detailMsgLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 4 },
  detailMsgText: { fontSize: 14, color: '#444', fontStyle: 'italic' },
  receiptSection: { marginTop: 10, marginBottom: 10 },
  receiptLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  receiptImage: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#f0f0f0' },
  detailDate: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10, marginBottom: 4 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  detailAcceptBtn: {
    flex: 1, backgroundColor: '#27ae60', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  detailAcceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  detailRejectBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e74c3c', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  detailRejectBtnText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 14 }
});

export default MyFundraisersScreen;
