import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettlementsStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Settlement, User, Group } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

// This type is now defined in types/navigation.ts

const SettlementDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SettlementsStackParamList>>();
  const route = useRoute<RouteProp<SettlementsStackParamList, 'SettlementDetails'>>();
  const { settlementId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [fromUser, setFromUser] = useState<User | null>(null);
  const [toUser, setToUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettlementData();
  }, [settlementId]);

  const loadSettlementData = async () => {
    try {
      setLoading(true);
      
      // Get settlement details
      const settlementDoc = await getDoc(doc(db, 'settlements', settlementId));
      if (!settlementDoc.exists()) {
        Alert.alert('Error', 'Settlement not found');
        navigation.goBack();
        return;
      }
      
      const settlementData = { id: settlementDoc.id, ...settlementDoc.data() } as Settlement;
      setSettlement(settlementData);

      // Get from user details
      const fromUserDoc = await getDoc(doc(db, 'users', settlementData.fromUserId));
      if (fromUserDoc.exists()) {
        setFromUser(fromUserDoc.data() as User);
      }

      // Get to user details
      const toUserDoc = await getDoc(doc(db, 'users', settlementData.toUserId));
      if (toUserDoc.exists()) {
        setToUser(toUserDoc.data() as User);
      }

      // Get group details if applicable
      if (settlementData.groupId) {
        const groupDoc = await getDoc(doc(db, 'groups', settlementData.groupId));
        if (groupDoc.exists()) {
          setGroup(groupDoc.data() as Group);
        }
      }
    } catch (error) {
      console.error('Error loading settlement data:', error);
      Alert.alert('Error', 'Failed to load settlement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'completed' | 'cancelled') => {
    try {
      setUpdating(true);
      
      await updateDoc(doc(db, 'settlements', settlementId), {
        status: newStatus,
      });
      
      setSettlement(prev => prev ? { ...prev, status: newStatus } : null);
      setConfirmModalVisible(false);
      
      Alert.alert(
        'Success', 
        `Settlement ${newStatus === 'completed' ? 'marked as completed' : 'cancelled'}`
      );
    } catch (error) {
      console.error('Error updating settlement:', error);
      Alert.alert('Error', 'Failed to update settlement. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  if (!settlement || !fromUser || !toUser) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#E53E3E" />
        <Text style={styles.errorText}>Settlement not found</Text>
      </View>
    );
  }

  const isCurrentUserPayer = settlement.fromUserId === auth.currentUser?.uid;
  const isCurrentUserReceiver = settlement.toUserId === auth.currentUser?.uid;
  const canUpdateStatus = settlement.status === 'pending' && (isCurrentUserPayer || isCurrentUserReceiver);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settlement.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(settlement.status) }]}>
                {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.date}>{formatDate(settlement.date)}</Text>
          </View>

          <Text style={styles.amount}>{formatCurrency(settlement.amount, settlement.currency)}</Text>

          <View style={styles.userContainer}>
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {fromUser.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>From</Text>
                <Text style={styles.userName}>{fromUser.displayName}</Text>
              </View>
            </View>

            <Icon name="arrow-downward" size={24} color="#8898aa" style={styles.arrowIcon} />

            <View style={styles.userRow}>
              <View style={[styles.userAvatar, { backgroundColor: '#5E72E4' }]}>
                <Text style={styles.userAvatarText}>
                  {toUser.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>To</Text>
                <Text style={styles.userName}>{toUser.displayName}</Text>
              </View>
            </View>
          </View>

          {group && (
            <>
              <View style={styles.divider} />
              <View style={styles.groupContainer}>
                <Icon name="group" size={20} color="#8898aa" />
                <Text style={styles.groupText}>{group.name}</Text>
              </View>
            </>
          )}

          {settlement.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notes}>{settlement.notes}</Text>
              </View>
            </>
          )}

          {canUpdateStatus && (
            <>
              <View style={styles.divider} />
              <View style={styles.actionsContainer}>
                {isCurrentUserReceiver && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => setConfirmModalVisible(true)}
                  >
                    <Icon name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleUpdateStatus('cancelled')}
                >
                  <Icon name="cancel" size={20} color="#F44336" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalText}>
              Are you sure you want to confirm this payment of {formatCurrency(settlement.amount, settlement.currency)}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={updating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => handleUpdateStatus('completed')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                )}
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
    backgroundColor: '#f9fafc',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#32325d',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#8898aa',
    fontSize: 14,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 24,
    textAlign: 'center',
  },
  userContainer: {
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#8898aa',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
  },
  arrowIcon: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupText: {
    fontSize: 16,
    color: '#32325d',
    marginLeft: 8,
  },
  notesContainer: {
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#32325d',
    marginBottom: 8,
  },
  notes: {
    fontSize: 16,
    color: '#525f7f',
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#32325d',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#525f7f',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f7fafc',
    marginRight: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  modalCancelButtonText: {
    color: '#525f7f',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettlementDetailsScreen;
