import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import API_URL from '../../api';

const CreatorOpportunityDetailsScreen = ({ route, navigation }) => {
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

  const handleDelete = async () => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete this opportunity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${API_URL}/opportunities/${id}`);
            navigation.goBack();
          } catch (error) {
            console.error(error);
          }
        }},
      ]
    );
  };

  const toggleStatus = async () => {
    const newStatus = opportunity.status === 'open' ? 'closed' : 'open';
    try {
      const response = await axios.patch(`${API_URL}/opportunities/${id}/status`, { status: newStatus });
      setOpportunity(response.data.opportunity);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!opportunity) return <View style={styles.container}><Text>Opportunity not found.</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{opportunity.title} (Creator View)</Text>
      <Text style={styles.status}>Current Status: {opportunity.status}</Text>
      <Text style={styles.description}>{opportunity.description}</Text>
      
      <View style={styles.actions}>
        <Button title={opportunity.status === 'open' ? 'Close Applications' : 'Re-open Applications'} onPress={toggleStatus} />
        <View style={{ height: 10 }} />
        <Button title="Edit Opportunity" onPress={() => {/* Edit logic */}} />
        <View style={{ height: 10 }} />
        <Button title="Delete Opportunity" color="red" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  status: { fontSize: 16, fontWeight: 'bold', color: 'blue', marginBottom: 20 },
  description: { fontSize: 16, marginBottom: 30 },
  actions: { marginTop: 20 },
});

export default CreatorOpportunityDetailsScreen;
