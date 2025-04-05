import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../config/firebase';
import { getGroup, getGroupExpenses, getUserData } from '../services/firebase';
import { Group, Expense, User, Balance } from '../types';
import { formatCurrency, formatDate, calculateBalances, simplifyDebts } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

const GroupDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { groupId } = route.params;
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Record<string, User>>({});
  const [balances, setBalances] = useState<Balance[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<any[]>([]);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      // Get group details
      const groupData = await getGroup(groupId);
      if (!groupData) {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
        return;
      }
      setGroup(groupData);

      // Get group expenses
      const groupExpenses = await getGroupExpenses(groupId);
      setExpenses(groupExpenses);

      // Get member details
      const membersData: Record<string, User> = {};
      for (const memberId of groupData.members) {
        const userData = await getUserData(memberId);
        if (userData) {
          membersData[memberId] = userData;
        }
      }
      setMembers(membersData);

      // Calculate balances
      const calculatedBalances = calculateBalances(groupExpenses, groupData.members);
      setBalances(calculatedBalances);

      // Calculate simplified debts
      const debts = simplifyDebts(calculatedBalances);
      setSimplifiedDebts(debts);
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const paidByUser = members[item.paidBy];
    const paidByName = paidByUser ? paidByUser.displayName : 'Unknown';
    const isCurrentUserPayer = item.paidBy === auth.currentUser?.uid;

    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
        onPress={() => navigation.navigate('ExpenseDetails' as never, { expenseId: item.id } as never)}
      >
        <View style={[styles.expenseIconContainer, { backgroundColor: `${theme.primary}20` }]}>
          <Icon name="receipt" size={24} color={theme.primary} />
        </View>
        <View style={styles.expenseContent}>
          <Text style={[styles.expenseTitle, { color: theme.text }]}>{item.description}</Text>
          <Text style={[styles.expenseSubtitle, { color: theme.secondaryText }]}>
            {isCurrentUserPayer ? 'You paid' : `${paidByName} paid`} • {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color: theme.text }]}>
            {formatCurrency(item.amount, item.currency)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBalanceItem = ({ item }: { item: Balance }) => {
    const user = members[item.userId];
    const userName = user ? user.displayName : 'Unknown';
    const isCurrentUser = item.userId === auth.currentUser?.uid;
    const isPositive = item.amount > 0;
    const isNeutral = Math.abs(item.amount) < 0.01;

    return (
      <View style={[styles.balanceItem, { backgroundColor: theme.card , shadowColor: theme.shadow }]}>
        <View style={styles.balanceUserInfo}>
          <View style={[styles.balanceAvatar, { backgroundColor: isCurrentUser ? '#5E72E4' : '#E53E3E' }]}>
            <Text style={styles.balanceAvatarText}>
              {userName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.balanceUserName}>
            {isCurrentUser ? 'You' : userName}
          </Text>
        </View>
        <Text
          style={[
            styles.balanceAmount,
            {
              color: isNeutral
                ? '#718096'
                : isPositive
                  ? '#4CAF50'
                  : '#F44336'
            }
          ]}
        >
          {isNeutral
            ? 'Settled up'
            : isPositive
              ? `Gets back ${formatCurrency(Math.abs(item.amount))}`
              : `Owes ${formatCurrency(Math.abs(item.amount))}`}
        </Text>
      </View>
    );
  };

  const renderDebtItem = ({ item }: { item: any }) => {
    const fromUser = members[item.from];
    const toUser = members[item.to];
    const fromUserName = fromUser ? fromUser.displayName : 'Unknown';
    const toUserName = toUser ? toUser.displayName : 'Unknown';
    const isCurrentUserPayer = item.from === auth.currentUser?.uid;
    const isCurrentUserReceiver = item.to === auth.currentUser?.uid;

    return (
      <View style={styles.debtItem}>
        <View style={styles.debtUsers}>
          <Text style={styles.debtText}>
            {isCurrentUserPayer
              ? 'You'
              : fromUserName}{' '}
            <Text style={styles.debtAction}>should pay</Text>{' '}
            {isCurrentUserReceiver
              ? 'you'
              : toUserName}
          </Text>
        </View>
        <Text style={styles.debtAmount}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Icon name="error" size={64} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.text }]}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View style={styles.groupInfo}>
          <View style={[styles.groupIconContainer, { backgroundColor: theme.primary }]}>
            <Text style={styles.groupIconText}>
              {group.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.groupDetails}>
            <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
            {group.description && (
              <Text style={[styles.groupDescription, { color: theme.secondaryText }]}>{group.description}</Text>
            )}
            <Text style={[styles.groupMembers, { color: theme.tertiaryText }]}>
              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Balances</Text>
              </View>

              {balances.length > 0 && (
                <View style={[styles.balancesContainer]}>
                  <FlatList
                    data={balances}
                    renderItem={renderBalanceItem}
                    keyExtractor={(item) => item.userId}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.balancesList}
                  />
                </View>
              )}

              {simplifiedDebts.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Settle Up</Text>
                  </View>
                  <View style={[styles.debtsContainer, { backgroundColor: theme.background, shadowColor: theme.shadow }]}>
                    <FlatList
                      data={simplifiedDebts}
                      renderItem={renderDebtItem}
                      keyExtractor={(item, index) => `debt-${index}`}
                      scrollEnabled={false}
                    />
                  </View>
                </>
              )}

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Expenses</Text>
              </View>

              {expenses.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Icon name="receipt-long" size={64} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No expenses yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
                    Add an expense to start tracking who owes what
                  </Text>
                </View>
              )}
            </>
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        />
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
        onPress={() => navigation.navigate('AddExpense' as never, { groupId: group.id } as never)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5E72E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#525f7f',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: '#8898aa',
  },
  tabContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Add extra padding for FAB
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
  },
  balancesContainer: {
    marginBottom: 16,
  },
  balancesList: {
    paddingRight: 16,
  },
  balanceItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  balanceUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5E72E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  balanceAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#32325d',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  debtsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  debtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  debtUsers: {
    flex: 1,
  },
  debtText: {
    fontSize: 14,
    color: '#32325d',
  },
  debtAction: {
    color: '#8898aa',
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: '#8898aa',
  },
  expenseAmount: {
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8898aa',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5E72E4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default GroupDetailsScreen;
