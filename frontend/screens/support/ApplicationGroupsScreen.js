import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../api';

const STATUS_COLOR = {
  pending: '#f39c12',
  approved: '#27ae60',
  completed: '#2e86de',
  rejected: '#e74c3c'
};

const ApplicationGroupsScreen = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [oppLoading, setOppLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [applications, setApplications] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createGroupLoading, setCreateGroupLoading] = useState(false);

  const [moveAppModal, setMoveAppModal] = useState(null);
  const [bulkLoading, setBulkLoading] = useState({});

  useEffect(() => {
    const fetchOpps = async () => {
      try {
        const res = await api.get('/api/opportunities/my');
        setOpportunities(res.data);
      } catch {
        toast.error('Error', 'Failed to load opportunities');
      } finally {
        setOppLoading(false);
      }
    };
    fetchOpps();
  }, []);

  const fetchGroupsAndApps = async (oppId) => {
    setGroupsLoading(true);
    try {
      const [groupRes, appRes] = await Promise.all([
        api.get(`/api/application-groups/opportunity/${oppId}`),
        api.get(`/api/applications/opportunity/${oppId}`)
      ]);
      setGroups(groupRes.data);
      setApplications(appRes.data);
    } catch {
      toast.error('Error', 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
      setRefreshing(false);
    }
  };

  const selectOpportunity = (opp) => {
    setSelectedOpp(opp);
    fetchGroupsAndApps(opp._id);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroupsAndApps(selectedOpp._id);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.warning('Required', 'Please enter a group name'); return; }
    setCreateGroupLoading(true);
    try {
      const res = await api.post('/api/application-groups', {
        opportunityId: selectedOpp._id, name: newGroupName.trim(), description: newGroupDesc.trim()
      });
      setGroups(prev => [...prev, { ...res.data, applications: [] }]);
      setCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      toast.success('Created', `Group "${res.data.name}" created`);
    } catch {
      toast.error('Error', 'Failed to create group');
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const handleDeleteGroup = (group) => {
    confirm.show({
      title: 'Delete Group',
      message: `Delete "${group.name}"? Applications will return to ungrouped.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/api/application-groups/${group._id}`);
          setGroups(prev => prev.filter(g => g._id !== group._id));
          toast.success('Deleted', 'Group deleted');
        } catch {
          toast.error('Error', 'Failed to delete group');
        }
      }
    });
  };

  const handleMoveToGroup = async (groupId, appId) => {
    try {
      const res = await api.post(`/api/application-groups/${groupId}/assign`, { applicationId: appId });
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) return res.data;
        return { ...g, applications: g.applications.filter(a => a._id !== appId) };
      }));
      setMoveAppModal(null);
      toast.success('Moved', 'Application added to group');
    } catch {
      toast.error('Error', 'Failed to move application');
    }
  };

  const handleRemoveFromGroup = async (groupId, appId) => {
    try {
      await api.delete(`/api/application-groups/${groupId}/remove/${appId}`);
      setGroups(prev => prev.map(g => g._id === groupId
        ? { ...g, applications: g.applications.filter(a => a._id !== appId) }
        : g
      ));
      toast.success('Removed', 'Removed from group');
    } catch {
      toast.error('Error', 'Failed to remove from group');
    }
  };

  const handleBulkStatus = (group, newStatus) => {
    const pendingCount = group.applications.filter(a => a.status === 'pending').length;
    if (!pendingCount) { toast.info('Nothing to do', 'No pending applications in this group'); return; }
    const isAccept = newStatus === 'approved';
    confirm.show({
      title: isAccept ? 'Accept All' : 'Reject All',
      message: `${isAccept ? 'Accept' : 'Reject'} all ${pendingCount} pending application(s) in "${group.name}"?`,
      confirmText: isAccept ? 'Accept All' : 'Reject All',
      destructive: !isAccept,
      onConfirm: async () => {
        const key = group._id + newStatus;
        setBulkLoading(prev => ({ ...prev, [key]: true }));
        try {
          const endpoint = isAccept ? 'accept-all' : 'reject-all';
          await api.post(`/api/application-groups/${group._id}/${endpoint}`);
          setGroups(prev => prev.map(g => g._id === group._id
            ? { ...g, applications: g.applications.map(a => a.status === 'pending' ? { ...a, status: newStatus } : a) }
            : g
          ));
          toast.success('Done', `${pendingCount} application(s) ${isAccept ? 'accepted' : 'rejected'}`);
        } catch {
          toast.error('Error', `Failed to ${isAccept ? 'accept' : 'reject'} all`);
        } finally {
          setBulkLoading(prev => ({ ...prev, [key]: false }));
        }
      }
    });
  };

  const groupedAppIds = new Set(groups.flatMap(g => g.applications.map(a => a._id)));
  const ungroupedApps = applications.filter(a => !groupedAppIds.has(a._id));

  const renderAppRow = (app, inGroup = false, groupId = null) => (
    <View key={app._id} style={[styles.row, { borderLeftColor: STATUS_COLOR[app.status] || '#ddd' }]}>
      <View style={[styles.rowAvatar, { backgroundColor: STATUS_COLOR[app.status] || '#ddd' }]}>
        <Text style={styles.rowAvatarText}>{app.volunteer?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{app.volunteer?.name}</Text>
        <Text style={styles.rowEmail} numberOfLines={1}>{app.volunteer?.email}</Text>
      </View>
      {inGroup ? (
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleRemoveFromGroup(groupId, app._id)}>
          <Ionicons name="folder-open-outline" size={14} color="#888" />
        </TouchableOpacity>
      ) : groups.length > 0 ? (
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#e8f0fb', borderColor: '#2e86de' }]} onPress={() => setMoveAppModal(app)}>
          <Ionicons name="folder-outline" size={14} color="#2e86de" />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderGroup = (group) => (
    <View key={group._id} style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderLeft}>
          <Ionicons name="folder" size={17} color="#2e86de" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description ? <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text> : null}
          </View>
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{group.applications.length}</Text>
          </View>
        </View>
        <View style={styles.groupActions}>
          <TouchableOpacity
            style={[styles.groupActionBtn, { backgroundColor: '#fde8e8' }]}
            onPress={() => handleBulkStatus(group, 'rejected')}
            disabled={!!bulkLoading[group._id + 'rejected']}
          >
            {bulkLoading[group._id + 'rejected']
              ? <ActivityIndicator size="small" color="#e74c3c" />
              : <><Ionicons name="close-circle" size={12} color="#e74c3c" /><Text style={[styles.groupActionText, { color: '#e74c3c' }]}> Reject</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.groupDeleteBtn} onPress={() => handleDeleteGroup(group)}>
            <Ionicons name="trash-outline" size={14} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      {group.applications.length === 0 ? (
        <Text style={styles.groupEmpty}>No applications in this group</Text>
      ) : (
        <View style={{ paddingTop: 6 }}>
          {group.applications.map(app => renderAppRow(app, true, group._id))}
        </View>
      )}
    </View>
  );

  // Opportunity picker view
  if (!selectedOpp) {
    if (oppLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2e86de" /></View>;
    return (
      <View style={styles.container}>
        <Text style={styles.pickerHeading}>Select an Opportunity</Text>
        <Text style={styles.pickerSubheading}>Choose which opportunity's groups to manage</Text>
        <FlatList
          data={opportunities}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.oppCard} onPress={() => selectOpportunity(item)}>
              <View style={styles.oppCardIcon}>
                <Ionicons name="folder-open-outline" size={20} color="#2e86de" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.oppTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.oppMeta}>📍 {item.location}</Text>
                <Text style={styles.oppMeta}>👥 {item.spotsAvailable} spots</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="briefcase-outline" size={50} color="#ddd" />
              <Text style={styles.emptyText}>No opportunities created yet</Text>
            </View>
          }
          contentContainerStyle={{ padding: 15, paddingTop: 0 }}
        />
      </View>
    );
  }

  // Groups management view
  if (groupsLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2e86de" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backRow} onPress={() => setSelectedOpp(null)}>
        <Ionicons name="arrow-back" size={18} color="#2e86de" />
        <Text style={styles.backText}>Back to opportunities</Text>
      </TouchableOpacity>
      <Text style={styles.selectedOppTitle} numberOfLines={2}>{selectedOpp.title}</Text>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Groups ({groups.length})</Text>
          <TouchableOpacity style={styles.newGroupBtn} onPress={() => setCreateGroupModal(true)}>
            <Ionicons name="add" size={13} color="#fff" />
            <Text style={styles.newGroupBtnText}> New Group</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <Text style={styles.noGroupsText}>No groups yet. Create one to organise applications.</Text>
        ) : (
          groups.map(g => renderGroup(g))
        )}

        <View style={[styles.sectionRow, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Ungrouped ({ungroupedApps.length})</Text>
        </View>

        {ungroupedApps.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>All applications are grouped</Text>
          </View>
        ) : (
          ungroupedApps.map(app => renderAppRow(app, false, null))
        )}
      </ScrollView>

      {/* Create Group Model */}
      <Modal visible={createGroupModal} transparent animationType="slide" onRequestClose={() => setCreateGroupModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCreateGroupModal(false)}>
            <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>New Group</Text>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning Shift"
                placeholderTextColor="#aaa"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              <Text style={styles.inputLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, { minHeight: 65, textAlignVertical: 'top' }]}
                placeholder="Brief description..."
                placeholderTextColor="#aaa"
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
                multiline
              />
              <TouchableOpacity style={styles.sheetBtn} onPress={handleCreateGroup} disabled={createGroupLoading}>
                {createGroupLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Create Group</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setCreateGroupModal(false)}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Move to Group Model */}
      <Modal visible={!!moveAppModal} transparent animationType="slide" onRequestClose={() => setMoveAppModal(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMoveAppModal(null)}>
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Move to Group</Text>
            {moveAppModal && <Text style={styles.sheetSubtitle}>{moveAppModal.volunteer?.name}</Text>}
            {groups.map(g => (
              <TouchableOpacity key={g._id} style={styles.groupPickerItem} onPress={() => handleMoveToGroup(g._id, moveAppModal._id)}>
                <Ionicons name="folder-outline" size={18} color="#2e86de" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.groupPickerName}>{g.name}</Text>
                  {g.description ? <Text style={styles.groupPickerDesc}>{g.description}</Text> : null}
                </View>
                <Text style={styles.groupPickerCount}>{g.applications.length} apps</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setMoveAppModal(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pickerHeading: { fontSize: 20, fontWeight: 'bold', color: '#333', padding: 15, paddingBottom: 4 },
  pickerSubheading: { fontSize: 13, color: '#888', paddingHorizontal: 15, marginBottom: 12 },

  oppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, gap: 12 },
  oppCardIcon: { width: 40, height: 40, backgroundColor: '#e8f0fb', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  oppTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  oppMeta: { fontSize: 12, color: '#666' },

  backRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 6 },
  backText: { color: '#2e86de', fontWeight: '600', fontSize: 14 },
  selectedOppTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 12, marginBottom: 4 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.4 },
  newGroupBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2e86de', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  newGroupBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  noGroupsText: { color: '#aaa', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },

  groupCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: '#e8eef5' },
  groupHeader: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f4f8', backgroundColor: '#f8fafd' },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  groupName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  groupDesc: { fontSize: 11, color: '#888', marginTop: 1 },
  groupBadge: { backgroundColor: '#2e86de', borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 6 },
  groupBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  groupActions: { flexDirection: 'row', gap: 6 },
  groupActionBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  groupActionText: { fontSize: 11, fontWeight: 'bold' },
  groupDeleteBtn: { backgroundColor: '#fde8e8', borderRadius: 10, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
  groupEmpty: { color: '#bbb', fontSize: 12, padding: 12, textAlign: 'center', fontStyle: 'italic' },

  row: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, padding: 10, gap: 8, marginHorizontal: 2 },
  rowAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  rowEmail: { fontSize: 10, color: '#888', marginTop: 1 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8', borderWidth: 1, borderColor: '#ccc' },

  empty: { alignItems: 'center', paddingTop: 30, gap: 8 },
  emptyCenter: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: '#aaa', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sheetSubtitle: { fontSize: 13, color: '#888', marginTop: -10, marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 4 },
  optional: { fontWeight: 'normal', color: '#aaa', fontSize: 11 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#ddd', color: '#333', marginBottom: 8 },
  sheetBtn: { backgroundColor: '#2e86de', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  sheetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sheetCancelBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { color: '#888', fontSize: 14 },
  groupPickerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8fafd', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e8eef5' },
  groupPickerName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  groupPickerDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  groupPickerCount: { fontSize: 11, color: '#888', fontWeight: '600' },
});

export default ApplicationGroupsScreen;
