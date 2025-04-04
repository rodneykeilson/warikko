import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Expense, User } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

type ExpenseDetailsParams = {
  expenseId: string;
};

const ExpenseDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, ExpenseDetailsParams>, string>>();
  const { expenseId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [paidByUser, setPaidByUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Record<string, User>>({});
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadExpenseData();
  }, [expenseId]);

  const loadExpenseData = async () => {
    try {
      setLoading(true);
      
      // Get expense details
      const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
      if (!expenseDoc.exists()) {
        Alert.alert('Error', 'Expense not found');
        navigation.goBack();
        return;
      }
      
      const expenseData = expenseDoc.data() as Expense;
      setExpense(expenseData);

      // Get paid by user details
      const paidByUserDoc = await getDoc(doc(db, 'users', expenseData.paidBy));
      if (paidByUserDoc.exists()) {
        setPaidByUser(paidByUserDoc.data() as User);
      }

      // Get member details for all users in the paidFor array
      const membersData: Record<string, User> = {};
      for (const split of expenseData.paidFor) {
        const userDoc = await getDoc(doc(db, 'users', split.userId));
        if (userDoc.exists()) {
          membersData[split.userId] = userDoc.data() as User;
        }
      }
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading expense data:', error);
      Alert.alert('Error', 'Failed to load expense data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'expenses', expenseId));
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Expense deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  if (!expense || !paidByUser) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#E53E3E" />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  const isCurrentUserPayer = expense.paidBy === auth.currentUser?.uid;
  const currentUserSplit = expense.paidFor.find(split => split.userId === auth.currentUser?.uid);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{expense.category}</Text>
            </View>
            <Text style={styles.date}>{formatDate(expense.date)}</Text>
          </View>

          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount, expense.currency)}</Text>

          <View style={styles.paidByContainer}>
            <View style={styles.paidByAvatar}>
              <Text style={styles.paidByAvatarText}>
                {paidByUser.displayName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.paidByText}>
              <Text style={styles.paidByLabel}>Paid by </Text>
              {isCurrentUserPayer ? 'You' : paidByUser.displayName}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Split Details</Text>
          {expense.paidFor.map((split) => {
            const member = members[split.userId];
            const isCurrentUser = split.userId === auth.currentUser?.uid;
            
            return (
              <View key={split.userId} style={styles.splitItem}>
                <View style={styles.splitUser}>
                  <View style={styles.splitUserAvatar}>
                    <Text style={styles.splitUserAvatarText}>
                      {member?.displayName.substring(0, 2).toUpperCase() || '??'}
                    </Text>
                  </View>
                  <Text style={styles.splitUserName}>
                    {isCurrentUser ? 'You' : member?.displayName || 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.splitAmount}>
                  {formatCurrency(split.amount, expense.currency)}
                </Text>
              </View>
            );
          })}

          {expense.notes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{expense.notes}</Text>
            </>
          )}

          {expense.receipt && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Receipt</Text>
              <TouchableOpacity
                style={styles.receiptContainer}
                onPress={() => setReceiptModalVisible(true)}
              >
                <Image
                  source={{ uri: `data:image/jpeg;base64,${expense.receipt}` }}
                  style={styles.receiptThumbnail}
                  resizeMode="cover"
                />
                <Text style={styles.viewReceiptText}>Tap to view</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => setDeleteModalVisible(true)}
            >
              <Icon name="delete" size={20} color="#E53E3E" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setReceiptModalVisible(false)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: `data:image/jpeg;base64,${expense.receipt}` }}
            style={styles.fullReceiptImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Icon name="warning" size={48} color="#E53E3E" />
            <Text style={styles.confirmModalTitle}>Delete Expense?</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteExpense}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
    marginTop: 16,
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#EDF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    color: '#5E72E4',
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#8898aa',
    fontSize: 14,
  },
  description: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 16,
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5E72E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paidByAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  paidByText: {
    fontSize: 16,
    color: '#32325d',
  },
  paidByLabel: {
    color: '#8898aa',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 12,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  splitUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  splitUserAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  splitUserName: {
    fontSize: 16,
    color: '#32325d',
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
  },
  notes: {
    fontSize: 16,
    color: '#525f7f',
    lineHeight: 24,
  },
  receiptContainer: {
    alignItems: 'center',
  },
  receiptThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  viewReceiptText: {
    fontSize: 14,
    color: '#5E72E4',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  deleteButtonText: {
    color: '#E53E3E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullReceiptImage: {
    width: '90%',
    height: '80%',
  },
  confirmModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#32325d',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#525f7f',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f7fafc',
    marginRight: 8,
  },
  confirmDeleteButton: {
    backgroundColor: '#E53E3E',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#525f7f',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExpenseDetailsScreen;
