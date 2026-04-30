import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_URL from '../../api';

const OpportunityListScreen = ({ navigation }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [search]);

  const fetchOpportunities = async () => {
    try {
      const response = await axios.get(`${API_URL}/opportunities`, { params: { search } });
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
      onPress={() => navigation.navigate('OpportunityDetails', { id: item._id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.org}>{item.organization}</Text>
      <Text style={styles.location}>{item.location}</Text>
    </TouchableOpacity>
  );

  if (loading && !search) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Opportunities</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search opportunities..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={opportunities}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  searchBar: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 15 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '600' },
  org: { color: '#444' },
  location: { color: '#888', fontSize: 12 },
});

export default OpportunityListScreen;
