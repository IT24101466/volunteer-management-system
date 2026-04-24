import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import API_URL from '../../api';

const OpportunityDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunity();
  }, []);

  const fetchOpportunity = async () => {
    try {
      const response = await axios.get(`${API_URL}/opportunities/${id}`);
      setOpportunity(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    // Application logic would go here
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
        <Text>{new Date(opportunity.startDate).toLocaleDateString()} - {new Date(opportunity.endDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Spots Left:</Text>
        <Text>{opportunity.spotsLeft}</Text>
      </View>
      <Button title="Apply Now" onPress={handleApply} disabled={opportunity.status !== 'open'} />
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
});

export default OpportunityDetailsScreen;
