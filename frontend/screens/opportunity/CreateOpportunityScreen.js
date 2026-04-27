import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import API_URL from '../../api';

const CreateOpportunityScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    spotsAvailable: '',
    category: 'education',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
  });

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_URL}/opportunities`, formData);
      Alert.alert('Success', 'Opportunity created successfully');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create opportunity');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create Opportunity</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        multiline
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Organization"
        value={formData.organization}
        onChangeText={(text) => setFormData({ ...formData, organization: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={formData.location}
        onChangeText={(text) => setFormData({ ...formData, location: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={formData.startDate}
        onChangeText={(text) => setFormData({ ...formData, startDate: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={formData.endDate}
        onChangeText={(text) => setFormData({ ...formData, endDate: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Spots Available"
        keyboardType="numeric"
        value={formData.spotsAvailable}
        onChangeText={(text) => setFormData({ ...formData, spotsAvailable: text })}
      />
      <Button title="Create" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 15, padding: 10 },
});

export default CreateOpportunityScreen;
