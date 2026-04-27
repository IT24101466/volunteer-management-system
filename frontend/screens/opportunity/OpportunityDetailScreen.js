import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator, Alert, TextInput } from 'react-native';
import api from '../../api';

const toast = {
  success: (title, msg) => Alert.alert(title, msg),
  error: (title, msg) => Alert.alert(title, msg),
  warning: (title, msg) => Alert.alert(title, msg)
};

const confirm = {
  show: ({ title, message, onConfirm }) => Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: onConfirm, style: 'destructive' }
  ])
};

const OpportunityDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const opportunityId = id;
  
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSpots, setEditSpots] = useState('');
  const [editResponsibleName, setEditResponsibleName] = useState('');
  const [editResponsibleEmail, setEditResponsibleEmail] = useState('');
  const [editResponsiblePhone, setEditResponsiblePhone] = useState('');
  const [editBannerImage, setEditBannerImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oppRes, appRes, frRes] = await Promise.all([
        api.get(`/api/opportunities/${opportunityId}`),
        api.get(`/api/applications/opportunity/${opportunityId}`),
        api.get(`/api/fundraisers/opportunity/${opportunityId}`)
      ]);
  
      setOpportunity(oppRes.data);
      setApplications(appRes.data);
      setFundraisers(frRes.data);
  
    } catch {
      toast.error('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  const openEdit = () => {
    if (!opportunity) return;
  
    setEditTitle(opportunity.title || '');
    setEditDescription(opportunity.description || '');
    setEditOrganization(opportunity.organization || '');
    setEditLocation(opportunity.location || '');
    setEditStartDate(opportunity.startDate ? opportunity.startDate.substring(0, 10) : null);
    setEditEndDate(opportunity.endDate ? opportunity.endDate.substring(0, 10) : null);
    setEditSpots(String(opportunity.spotsAvailable || ''));
    setEditResponsibleName(opportunity.responsibleName || '');
    setEditResponsibleEmail(opportunity.responsibleEmail || '');
    setEditResponsiblePhone(opportunity.responsiblePhone || '');
    setEditBannerImage(null);
  
    setShowEdit(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editTitle || !editDescription || !editLocation || !editStartDate || !editEndDate || !editSpots) {
      toast.warning('Missing Fields', 'Please fill in all required fields');
      return;
    }
  
    if (new Date(editStartDate) >= new Date(editEndDate)) {
      toast.warning('Invalid Dates', 'End date must be after start date');
      return;
    }
  
    setEditLoading(true);
  
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        organization: editOrganization,
        location: editLocation,
        startDate: editStartDate,
        endDate: editEndDate,
        spotsAvailable: editSpots,
        responsibleName: editResponsibleName,
        responsibleEmail: editResponsibleEmail,
        responsiblePhone: editResponsiblePhone
      };
  
      if (editBannerImage) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
  
        const filename = editBannerImage.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
  
        formData.append('bannerImage', {
          uri: editBannerImage.uri,
          name: filename,
          type: match ? `image/${match[1]}` : 'image/jpeg'
        });
  
        await api.put(`/api/opportunities/${opportunityId}`, formData);
      } else {
        await api.put(`/api/opportunities/${opportunityId}`, payload);
      }
  
      toast.success('Success', 'Opportunity updated!');
      setShowEdit(false);
      fetchData();
  
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Failed to update');
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleToggleStatus = () => {
    const current = opportunity?.status || 'open';
    const next = current === 'open' ? 'closed' : 'open';
  
    confirm.show({
      title: next === 'closed' ? 'Close Opportunity' : 'Open Opportunity',
      message: next === 'closed'
        ? 'Prevent new applications from being submitted?'
        : 'Allow new applications again?',
      confirmText: 'Confirm',
      destructive: next === 'closed',
      onConfirm: async () => {
        try {
          await api.patch(`/api/opportunities/${opportunityId}/status`, { status: next });
          fetchData();
        } catch {
          toast.error('Error', 'Failed to update status');
        }
      }
    });
  };
  
  const handleDelete = () => {
    confirm.show({
      title: 'Delete Opportunity',
      message: 'This will permanently delete the opportunity and all its data. This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/opportunities/${opportunityId}`);
          navigation.goBack();
        } catch {
          toast.error('Error', 'Failed to delete');
        }
      }
    });
  };

  const handleApply = async () => {
    Alert.alert('Info', 'Application feature coming soon!');
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!opportunity) return <View style={styles.container}><Text>Opportunity not found.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{opportunity.title}</Text>
      <Text style={styles.org}>{opportunity.organization}</Text>
      <Text style={styles.description}>{opportunity.description}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Location:</Text>
        <Text>{opportunity.location}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Date:</Text>
        <Text>{opportunity.startDate ? new Date(opportunity.startDate).toLocaleDateString() : ''} - {opportunity.endDate ? new Date(opportunity.endDate).toLocaleDateString() : ''}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Spots Left:</Text>
        <Text>{opportunity.spotsAvailable || opportunity.spotsLeft}</Text>
      </View>
      
      <Button title="Apply Now" onPress={handleApply} disabled={opportunity.status !== 'open'} />

      <View style={styles.adminActions}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        <Button title="Edit" onPress={openEdit} />
        <View style={{height: 10}} />
        <Button title={opportunity.status === 'open' ? 'Close Opportunity' : 'Open Opportunity'} onPress={handleToggleStatus} />
        <View style={{height: 10}} />
        <Button title="Delete" color="red" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  org: { fontSize: 18, color: '#666', marginBottom: 20 },
  description: { fontSize: 16, marginBottom: 20, lineHeight: 24 },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  label: { fontWeight: 'bold', width: 100 },
  adminActions: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
});

export default OpportunityDetailsScreen;
