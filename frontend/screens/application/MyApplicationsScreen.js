import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../api';

const MyApplicationsScreen = ({ navigation }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchApplications = async () => {
    try {
      const url = filter === 'all' ? '/api/applications/my' : `/api/applications/my?status=${filter}`;
      const response = await api.get(url);
      setApplications(response.data);
    } catch {
      toast.error('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [filter]);

  const onRefresh = () => { setRefreshing(true); fetchApplications(); };

  const handleLeave = (applicationId) => {
    confirm.show({
      title: 'Leave Opportunity',
      message: 'Are you sure you want to leave this opportunity? This cannot be undone.',
      confirmText: 'Leave',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/applications/${applicationId}`);
          fetchApplications();
        } catch (error) {
          toast.error('Error', error.response?.data?.message || 'Failed to leave');
        }
      }
    });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'completed': return '#2e86de';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Joined';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.opportunity?.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
          <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      {item.opportunity?.organization ? (
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color="#888" style={styles.detailIcon} />
          <Text style={styles.cardDetail}>{item.opportunity.organization}</Text>
        </View>
      ) : null}

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={14} color="#888" style={styles.detailIcon} />
        <Text style={styles.cardDetail}>{item.opportunity?.location}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={14} color="#888" style={styles.detailIcon} />
        <Text style={styles.cardDetail}>
          {item.opportunity?.startDate
            ? `${new Date(item.opportunity.startDate).toDateString()} — ${new Date(item.opportunity.endDate).toDateString()}`
            : item.opportunity?.date
              ? new Date(item.opportunity.date).toDateString()
              : 'Date not set'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={14} color="#888" style={styles.detailIcon} />
        <Text style={styles.cardDetail}>Applied: {new Date(item.appliedAt).toDateString()}</Text>
      </View>

      {item.phone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color="#888" style={styles.detailIcon} />
          <Text style={styles.cardDetail}>{item.phone}</Text>
        </View>
      ) : null}

      {item.expectedHours ? (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#888" style={styles.detailIcon} />
          <Text style={styles.cardDetail}>Expected {item.expectedHours} hr{item.expectedHours !== 1 ? 's' : ''}</Text>
        </View>
      ) : null}

      {item.coverLetter ? (
        <View style={styles.textBlock}>
          <Text style={styles.textBlockLabel}>Cover Letter</Text>
          <Text style={styles.textBlockBody}>{item.coverLetter}</Text>
        </View>
      ) : null}

      {item.motivation ? (
        <View style={styles.textBlock}>
          <Text style={styles.textBlockLabel}>Motivation</Text>
          <Text style={styles.textBlockBody}>{item.motivation}</Text>
        </View>
      ) : null}

      {item.hopingToGain ? (
        <View style={styles.textBlock}>
          <Text style={styles.textBlockLabel}>Hoping to Gain</Text>
          <Text style={styles.textBlockBody}>{item.hopingToGain}</Text>
        </View>
      ) : null}

      {item.status === 'approved' && (
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('Apply', {
              opportunity: item.opportunity,
              applicationId: item._id,
              existingApplication: item
            })}
          >
            <Ionicons name="pencil-outline" size={14} color="#2e86de" style={{ marginRight: 4 }} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.withdrawButton} onPress={() => handleLeave(item._id)}>
            <Ionicons name="exit-outline" size={14} color="#e74c3c" style={{ marginRight: 4 }} />
            <Text style={styles.withdrawButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2e86de" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Applications</Text>

      <View style={styles.filterContainer}>
        {['all', 'approved', 'completed', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'approved' ? 'Joined' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No applications found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  filterContainer: { flexDirection: 'row', marginBottom: 15, gap: 6, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#2e86de' },
  filterTabActive: { backgroundColor: '#2e86de' },
  filterTabText: { color: '#2e86de', fontSize: 12, fontWeight: 'bold' },
  filterTabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailIcon: { marginRight: 6 },
  cardDetail: { color: '#555', fontSize: 13, flex: 1 },
  textBlock: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginTop: 8 },
  textBlockLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  textBlockBody: { fontSize: 13, color: '#444', lineHeight: 19 },
  pendingActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2e86de', borderRadius: 8, padding: 9 },
  editButtonText: { color: '#2e86de', fontWeight: 'bold', fontSize: 13 },
  withdrawButton: { flex: 1, backgroundColor: '#ffe8e8', borderRadius: 8, padding: 9, alignItems: 'center' },
  withdrawButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
  resignButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e74c3c', borderRadius: 8, padding: 9, marginTop: 8 },
  resignButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50, fontSize: 16 }
});

export default MyApplicationsScreen;
