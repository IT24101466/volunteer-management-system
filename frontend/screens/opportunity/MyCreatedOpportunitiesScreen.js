import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_URL from '../../api';

const MyCreatedOpportunitiesScreen = ({ navigation }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOpportunities();
  }, []);

  const fetchMyOpportunities = async () => {
    try {
      const response = await axios.get(`${API_URL}/opportunities/my`);
      setOpportunities(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('CreatorOpportunityDetails', { id: item._id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Opportunities</Text>
      <FlatList
        data={opportunities}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No opportunities created yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600' },
  status: { color: '#666', marginTop: 5 },
});

export default MyCreatedOpportunitiesScreen;
