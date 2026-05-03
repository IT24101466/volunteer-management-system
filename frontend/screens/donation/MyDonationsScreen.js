import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, Image
} from 'react-native';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../api';

const BASE_URL = 'https://volunteer-management-system-myg0.onrender.com';

const MyDonationsScreen = ({ navigation }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const fetchDonations = async () => {
    try {
      const response = await api.get('/api/donations/my');
      setDonations(response.data.donations);
      setConfirmedTotal(response.data.confirmedTotal || 0);
    } catch (error) {
      toast.error('Error', 'Failed to load donations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchDonations(); };

  const handleDelete = (donationId) => {
    confirm.show({
      title: 'Delete Donation',
      message: 'Are you sure you want to delete this donation?',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/donations/${donationId}`);
          toast.success('Deleted', 'Donation deleted successfully');
          fetchDonations();
        } catch (error) {
          toast.error('Error', error.response?.data?.message || 'Failed to delete donation');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Donated';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.fundraiser?.name || 'Donation'}</Text>
          <Text style={styles.cardOpp} numberOfLines={1}>{item.opportunity?.title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.amount}>LKR {Number(item.amount).toLocaleString()}</Text>
      {item.donorName ? <Text style={styles.cardDetail}>Name: {item.donorName}</Text> : null}
      {item.donorPhone ? <Text style={styles.cardDetail}>Phone: {item.donorPhone}</Text> : null}
      {item.message ? <Text style={styles.cardDetail}>"{item.message}"</Text> : null}
      {item.receiptImage ? (
        <Image
          source={{ uri: `${BASE_URL}/${item.receiptImage}` }}
          style={styles.receiptThumb}
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.cardDate}>{new Date(item.createdAt).toDateString()}</Text>

      {item.status === 'confirmed' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#27ae60" /></View>;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Confirmed Donations</Text>
        <Text style={styles.summaryAmount}>LKR {confirmedTotal.toLocaleString()}</Text>
        <Text style={styles.summaryCount}>{donations.length} submission{donations.length !== 1 ? 's' : ''} made</Text>
      </View>

      {/* Find Opportunity Button */}
      <TouchableOpacity
        style={styles.findButton}
        onPress={() => navigation.navigate('FundraiserList')}
      >
        <Text style={styles.findButtonText}>Find an Opportunity to Support</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Donations</Text>

      <FlatList
        data={donations}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No donations yet</Text>
            <Text style={styles.emptySubText}>Find an opportunity and make your first donation!</Text>
          </View>
        }
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { backgroundColor: '#27ae60', padding: 20, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 4 },
  summaryAmount: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  summaryCount: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  findButton: { margin: 15, backgroundColor: '#2e86de', borderRadius: 10, padding: 14, alignItems: 'center' },
  findButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 15, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginHorizontal: 15, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardOpp: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 22, fontWeight: 'bold', color: '#27ae60', marginBottom: 6 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardDetail: { color: '#666', fontSize: 14, marginBottom: 3 },
  receiptThumb: { width: '100%', height: 140, borderRadius: 8, marginVertical: 8 },
  cardDate: { color: '#aaa', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  deleteButton: { flex: 1, backgroundColor: '#e74c3c', borderRadius: 8, padding: 10, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center' }
});

export default MyDonationsScreen;
