import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../config/firebase';
import { getUserGroups, createGroup } from '../services/firebase';
import { Group } from '../types';
import { formatDate } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

const GroupsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }

      const userGroups = await getUserGroups(currentUser.uid);
      setGroups(userGroups);
    } catch (error: any) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }

      const newGroup = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
      };

      await createGroup(newGroup);
      setModalVisible(false);
      setNewGroupName('');
      setNewGroupDescription('');
      loadGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    return (
      <TouchableOpacity
        style={[styles.groupItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
        onPress={() => {
          navigation.navigate('GroupDetails', { 
            groupId: item.id,
            groupName: item.name
          });
        }}
      >
        <View style={[styles.groupIconContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.groupIconText}>
            {item.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.groupContent}>
          <Text style={[styles.groupName, { color: theme.text }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.groupDescription, { color: theme.secondaryText }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <Text style={[styles.groupMembers, { color: theme.tertiaryText }]}>
            {item.members.length} {item.members.length === 1 ? 'member' : 'members'} • Created {formatDate(item.createdAt)}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5E72E4']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="group" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>
              Create a group to start splitting expenses with friends
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoCapitalize="words"
            />
            
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter group description"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Add extra padding for FAB
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  createButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen;
