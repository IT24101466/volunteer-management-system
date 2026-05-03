import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../../components/Toast';
import AutoHeightImage from '../../components/AutoHeightImage';
import api from '../../api';

const ListFormModal = ({ visible, title, name, description, photo, onChangeName, onChangeDescription, onPickPhoto, onRemovePhoto, onSubmit, onCancel, submitting }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.modalCenteredWrapper} pointerEvents="box-none">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>List Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Environmental Causes" placeholderTextColor="#aaa" value={name} onChangeText={onChangeName} autoFocus />
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput style={styles.textArea} placeholder="What kind of opportunities?" placeholderTextColor="#aaa" value={description} onChangeText={onChangeDescription} multiline numberOfLines={3} />
            <Text style={styles.label}>Banner Image (optional)</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={onPickPhoto}>
              <Ionicons name="image-outline" size={18} color="#e74c3c" style={{ marginRight: 8 }} />
              <Text style={styles.imagePickerText}>{photo ? 'Replace banner image' : 'Add a banner image'}</Text>
            </TouchableOpacity>
            {photo ? (
              <View style={{ position: 'relative', marginBottom: 10 }}>
                <AutoHeightImage uri={photo} borderRadius={10} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemovePhoto}>
                  <Ionicons name="close-circle" size={26} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{title}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const FavouritesScreen = ({ navigation }) => {
  const toast = useToast();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createPhoto, setCreatePhoto] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchLists = async () => {
    try {
      const res = await api.get('/api/favourites');
      setLists(res.data);
    } catch {
      toast.error('Error', 'Failed to load favourites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchLists(); }, []));

  const handlePickCreatePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setCreatePhoto(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!createName.trim()) { toast.warning('Required', 'Please enter a list name'); return; }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', createName.trim());
      formData.append('description', createDesc.trim());
      if (createPhoto) {
        formData.append('photo', { uri: createPhoto, type: 'image/jpeg', name: 'banner.jpg' });
      }
      await api.post('/api/favourites', formData);
      setShowCreate(false); setCreateName(''); setCreateDesc(''); setCreatePhoto(null);
      fetchLists();
    } catch { toast.error('Error', 'Failed to create list'); }
    finally { setCreating(false); }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#e74c3c" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLists(); }} />}
        ListHeaderComponent={
          <View style={styles.listsHeader}>
            <Text style={styles.listsTitle}>My Lists</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
              <Text style={styles.createButtonText}>+ New List</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FavouriteDetail', { list: item })} activeOpacity={0.8}>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>❤️</Text></View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text> : null}
              <Text style={styles.cardCount}>{item.opportunities?.length || 0} saved</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyText}>No favourites lists yet</Text>
            <Text style={styles.emptySubText}>Create a list to save opportunities!</Text>
            <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyCreateBtnText}>Create My First List</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ListFormModal
        visible={showCreate} title="Create New List"
        name={createName} description={createDesc} photo={createPhoto}
        onChangeName={setCreateName} onChangeDescription={setCreateDesc}
        onPickPhoto={handlePickCreatePhoto} onRemovePhoto={() => setCreatePhoto(null)}
        onSubmit={handleCreate} onCancel={() => { setShowCreate(false); setCreateName(''); setCreateDesc(''); setCreatePhoto(null); }}
        submitting={creating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listsTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  createButton: { backgroundColor: '#e74c3c', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  createButtonText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 3, flexDirection: 'row', alignItems: 'center', padding: 14 },
  cardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffe0e0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardIconText: { fontSize: 22 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 3 },
  cardDescription: { fontSize: 13, color: '#666', marginBottom: 3 },
  cardCount: { fontSize: 12, color: '#e74c3c', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 30 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  emptySubText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  emptyCreateBtn: { backgroundColor: '#e74c3c', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyCreateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCenteredWrapper: { width: '88%', maxHeight: '80%', zIndex: 10 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd', color: '#333' },
  textArea: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd', minHeight: 80, textAlignVertical: 'top', color: '#333' },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffe0e0', borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10, padding: 12, marginBottom: 10 },
  imagePickerText: { fontSize: 13, color: '#e74c3c', flex: 1 },
  removePhotoBtn: { position: 'absolute', top: 6, right: 6 },
  submitButton: { backgroundColor: '#e74c3c', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelButtonText: { color: '#999', fontWeight: 'bold', fontSize: 15 }
});

export default FavouritesScreen;
