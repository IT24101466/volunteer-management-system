import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image,
  Modal, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../api';

const BASE_URL = 'https://volunteer-management-system-myg0.onrender.com';

const STATUS_COLOR = {
  pending: '#f39c12',
  approved: '#27ae60',
  completed: '#2e86de',
  rejected: '#e74c3c'
};

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Joined',
  completed: 'Completed',
  rejected: 'Rejected'
};

const FILTERS = ['all', 'approved', 'completed', 'rejected'];

const ManageApplicationsScreen = ({ route, navigation }) => {
  const { opportunityId } = route.params;
  const toast = useToast();
  const confirm = useConfirm();
  const insets = useSafeAreaInsets();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  const [detailApp, setDetailApp] = useState(null);

  const fetchData = async () => {
    try {
      const appRes = await api.get(`/api/applications/opportunity/${opportunityId}`);
      setApplications(appRes.data);
    } catch {
      toast.error('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const updateStatus = async (appId, status) => {
    setActionLoading(prev => ({ ...prev, [appId + status]: true }));
    try {
      await api.put(`/api/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      if (detailApp?._id === appId) setDetailApp(prev => ({ ...prev, status }));
      toast.success('Updated', `Applicant marked as ${STATUS_LABEL[status]}`);
    } catch {
      toast.error('Error', 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [appId + status]: false }));
    }
  };

  const handleRemove = (app) => {
    confirm.show({
      title: 'Remove Volunteer',
      message: `Remove ${app.volunteer?.name} from this opportunity?`,
      confirmText: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.put(`/api/applications/${app._id}/revoke`);
          setApplications(prev => prev.map(a => a._id === app._id ? { ...a, status: 'rejected' } : a));
          if (detailApp?._id === app._id) setDetailApp(null);
          toast.success('Removed', 'Volunteer removed');
        } catch {
          toast.error('Error', 'Failed to remove volunteer');
        }
      }
    });
  };

  const isLoading = (appId, action) => !!actionLoading[appId + action];

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? applications.length : applications.filter(a => a.status === f).length;
    return acc;
  }, {});

  const allFiltered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const renderInlineActions = (app) => {
    const busy = Object.keys(actionLoading).some(k => k.startsWith(app._id) && actionLoading[k]);
    return (
      <View style={styles.inlineActions}>
        {app.status === 'approved' && (
          <>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnCompletion]} onPress={() => updateStatus(app._id, 'completed')} disabled={busy}>
              {isLoading(app._id, 'completed') ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="trophy-outline" size={14} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnRemovePerson]} onPress={() => handleRemove(app)} disabled={busy}>
              <Ionicons name="person-remove-outline" size={14} color="#e74c3c" />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderAppRow = (item) => (
    <View key={item._id} style={[styles.row, { borderLeftColor: STATUS_COLOR[item.status] }]}>
      <TouchableOpacity style={styles.rowLeft} onPress={() => setDetailApp(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: STATUS_COLOR[item.status] }]}>
          <Text style={styles.avatarText}>{item.volunteer?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.volunteer?.name}</Text>
          <Text style={styles.rowEmail} numberOfLines={1}>{item.volunteer?.email}</Text>
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[styles.statusPillText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.rowRight}>
        {renderInlineActions(item)}
      </View>
    </View>
  );

  const renderDetail = () => {
    if (!detailApp) return null;
    const app = detailApp;
    const busy = Object.keys(actionLoading).some(k => k.startsWith(app._id) && actionLoading[k]);
    return (
      <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
        <View style={styles.detailTopBar}>
          <TouchableOpacity onPress={() => setDetailApp(null)} style={styles.detailClose}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
          <Text style={styles.detailTopTitle}>Applicant Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.detailProfile}>
            <View style={[styles.detailAvatar, { backgroundColor: STATUS_COLOR[app.status] }]}>
              <Text style={styles.detailAvatarText}>{app.volunteer?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.detailName}>{app.volunteer?.name}</Text>
            <View style={[styles.detailStatusPill, { backgroundColor: STATUS_COLOR[app.status] }]}>
              <Text style={styles.detailStatusText}>{STATUS_LABEL[app.status]}</Text>
            </View>
          </View>
          {app.photo ? (
            <Image source={{ uri: `${BASE_URL}/${app.photo}` }} style={styles.detailPhoto} resizeMode="cover" />
          ) : null}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Contact</Text>
            <View style={styles.detailField}>
              <Ionicons name="mail-outline" size={15} color="#888" style={{ width: 22 }} />
              <Text style={styles.detailFieldText}>{app.volunteer?.email || '—'}</Text>
            </View>
            {(app.phone || app.volunteer?.phone) ? (
              <View style={styles.detailField}>
                <Ionicons name="call-outline" size={15} color="#888" style={{ width: 22 }} />
                <Text style={styles.detailFieldText}>{app.phone || app.volunteer?.phone}</Text>
              </View>
            ) : null}
            {app.expectedHours ? (
              <View style={styles.detailField}>
                <Ionicons name="time-outline" size={15} color="#888" style={{ width: 22 }} />
                <Text style={styles.detailFieldText}>Expected {app.expectedHours} hr{app.expectedHours !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            <View style={styles.detailField}>
              <Ionicons name="calendar-outline" size={15} color="#888" style={{ width: 22 }} />
              <Text style={styles.detailFieldText}>Applied {new Date(app.appliedAt).toDateString()}</Text>
            </View>
          </View>
          {(app.coverLetter || app.motivation || app.hopingToGain) && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Application</Text>
              {app.coverLetter ? (<><Text style={styles.detailSubLabel}>Cover Letter</Text><Text style={styles.detailCardText}>{app.coverLetter}</Text></>) : null}
              {app.motivation ? (<><Text style={styles.detailSubLabel}>Motivation</Text><Text style={styles.detailCardText}>{app.motivation}</Text></>) : null}
              {app.hopingToGain ? (<><Text style={styles.detailSubLabel}>Hoping to Gain</Text><Text style={styles.detailCardText}>{app.hopingToGain}</Text></>) : null}
            </View>
          )}
          <View style={styles.detailActions}>
            {app.status === 'approved' && (
              <>
                <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#2e86de' }]} onPress={() => updateStatus(app._id, 'completed')} disabled={busy}>
                  {isLoading(app._id, 'completed') ? <ActivityIndicator color="#fff" /> : <><Ionicons name="trophy-outline" size={16} color="#fff" /><Text style={styles.detailBtnText}> Mark Completion</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.detailBtn, { borderWidth: 1.5, borderColor: '#e74c3c', backgroundColor: '#fff' }]} onPress={() => handleRemove(app)} disabled={busy}>
                  <Ionicons name="person-remove-outline" size={16} color="#e74c3c" />
                  <Text style={[styles.detailBtnText, { color: '#e74c3c' }]}> Remove</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2e86de" /></View>;

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', count: counts.all, color: '#2e86de' },
          { label: 'Joined', count: counts.approved, color: '#27ae60' },
          { label: 'Done', count: counts.completed, color: '#9b59b6' },
          { label: 'Removed', count: counts.rejected, color: '#e74c3c' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: STATUS_COLOR[f] || '#2e86de', borderColor: STATUS_COLOR[f] || '#2e86de' }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && { color: '#fff' }]}>
              {f === 'all' ? 'All' : STATUS_LABEL[f]}{counts[f] > 0 ? ` (${counts[f]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Applications ({allFiltered.length})</Text>
        </View>

        {allFiltered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              No {filter !== 'all' ? (STATUS_LABEL[filter]?.toLowerCase() + ' ') : ''}applicants
            </Text>
          </View>
        ) : (
          allFiltered.map(app => renderAppRow(app))
        )}
      </ScrollView>

      {/* Applicant Detail Model */}
      <Modal visible={!!detailApp} animationType="slide" onRequestClose={() => setDetailApp(null)}>
        {renderDetail()}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', gap: 6 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 1 },

  filterScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', maxHeight: 44 },
  filterContent: { paddingHorizontal: 10, paddingVertical: 7, gap: 6, alignItems: 'center', paddingRight: 14 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: '#f0f4f8', borderWidth: 1, borderColor: '#ddd' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#555' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.4 },

  row: {
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 3, paddingRight: 8,
    marginHorizontal: 8
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, padding: 10, gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  rowEmail: { fontSize: 10, color: '#888', marginTop: 1, marginBottom: 3 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  statusPillText: { fontSize: 9, fontWeight: 'bold' },
  rowRight: { flexShrink: 0 },

  inlineActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  iconBtnAccept: { backgroundColor: '#27ae60' },
  iconBtnReject: { backgroundColor: '#fde8e8', borderWidth: 1, borderColor: '#e74c3c' },
  iconBtnCompletion: { backgroundColor: '#2e86de' },
  iconBtnContrib: { backgroundColor: '#f3eeff', borderWidth: 1, borderColor: '#9b59b6' },
  iconBtnRemovePerson: { backgroundColor: '#fde8e8', borderWidth: 1, borderColor: '#e74c3c' },

  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { color: '#aaa', fontSize: 13 },

  detailContainer: { flex: 1, backgroundColor: '#f0f4f8' },
  detailTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 },
  detailClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center' },
  detailTopTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  detailScroll: { flex: 1 },
  detailProfile: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginBottom: 10 },
  detailAvatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  detailName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  detailStatusPill: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 },
  detailStatusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  detailPhoto: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 10, borderWidth: 2, borderColor: '#ddd' },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 12, marginBottom: 10, elevation: 1 },
  detailCardTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  detailField: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailFieldText: { fontSize: 14, color: '#444', flex: 1 },
  detailSubLabel: { fontSize: 11, fontWeight: '700', color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  detailCardText: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 4 },
  detailActions: { marginHorizontal: 12, marginBottom: 30, gap: 10 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, elevation: 1 },
  detailBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sheetCancelBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { color: '#888', fontSize: 14 },
});

export default ManageApplicationsScreen;
