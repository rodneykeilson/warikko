import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../config/firebase';
import { Expense, Settlement, User } from '../types';
import { formatCurrency, formatDate, getUserDisplayName } from '../utils/helpers';
import { getUserData, getUserExpenses, getUserSettlements } from '../services/firebase';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }

      // Get user data
      const userData = await getUserData(currentUser.uid);
      if (userData) {
        setUserData(userData);
      }

      // Get user expenses
      const userExpenses = await getUserExpenses(currentUser.uid);
      
      // Get recent settlements
      const userSettlements = await getUserSettlements(currentUser.uid);

      // Calculate total balance
      let balance = 0;
      
      // Add expenses where user paid
      userExpenses.forEach((expense) => {
        if (expense.paidBy === currentUser.uid) {
          balance += expense.amount;
        }
      });
      
      // Subtract expenses where user owes
      userExpenses.forEach((expense) => {
        const userSplit = expense.paidFor.find(split => split.userId === currentUser.uid);
        if (userSplit) {
          balance -= userSplit.amount;
        }
      });
      
      // Add settlements where user is receiving money
      userSettlements.forEach((settlement) => {
        if (settlement.toUserId === currentUser.uid && settlement.status === 'completed') {
          balance += settlement.amount;
        } else if (settlement.fromUserId === currentUser.uid && settlement.status === 'completed') {
          balance -= settlement.amount;
        }
      });
      
      setTotalBalance(balance);

      // Combine and sort activities
      const activities = [
        ...userExpenses.map(expense => ({
          ...expense,
          type: 'expense'
        })),
        ...userSettlements.map(settlement => ({
          ...settlement,
          type: 'settlement'
        }))
      ];
      
      activities.sort((a, b) => b.date - a.date);
      
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderActivityItem = ({ item }) => {
    if (item.type === 'expense') {
      return (
        <TouchableOpacity
          style={styles.activityItem}
          onPress={() => navigation.navigate('ExpenseDetails', { expenseId: item.id })}
        >
          <View style={styles.activityIconContainer}>
            <Icon name="receipt" size={24} color="#5E72E4" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{item.description}</Text>
            <Text style={styles.activitySubtitle}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.activityAmount}>
            <Text
              style={[
                styles.amountText,
                { color: item.paidBy === auth.currentUser?.uid ? '#4CAF50' : '#F44336' }
              ]}
            >
              {item.paidBy === auth.currentUser?.uid
                ? `+${formatCurrency(item.amount, item.currency)}`
                : `-${formatCurrency(
                    item.paidFor.find(split => split.userId === auth.currentUser?.uid)?.amount || 0,
                    item.currency
                  )}`
              }
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.activityItem}
          onPress={() => navigation.navigate('SettlementDetails', { settlementId: item.id })}
        >
          <View style={styles.activityIconContainer}>
            <Icon name="payment" size={24} color="#5E72E4" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>
              {item.fromUserId === auth.currentUser?.uid ? 'You paid ' : 'You received '}
              {formatCurrency(item.amount, item.currency)}
            </Text>
            <Text style={styles.activitySubtitle}>
              {formatDate(item.date)} • {item.status}
            </Text>
          </View>
          <View style={styles.activityAmount}>
            <Text
              style={[
                styles.amountText,
                { color: item.toUserId === auth.currentUser?.uid ? '#4CAF50' : '#F44336' }
              ]}
            >
              {item.toUserId === auth.currentUser?.uid
                ? `+${formatCurrency(item.amount, item.currency)}`
                : `-${formatCurrency(item.amount, item.currency)}`
              }
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={[styles.balanceAmount, { color: totalBalance >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatCurrency(Math.abs(totalBalance))}
          </Text>
          <Text style={styles.balanceDescription}>
            {totalBalance > 0
              ? 'You are owed'
              : totalBalance < 0
              ? 'You owe'
              : 'You are all settled up'}
          </Text>
        </View>
      </View>

      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.length > 0 ? (
          <FlatList
            data={recentActivities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5E72E4']} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="receipt-long" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No recent activity</Text>
            <Text style={styles.emptySubtext}>
              Your recent expenses and settlements will appear here
            </Text>
          </View>
        )}
      </View>
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
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#525f7f',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#525f7f',
  },
  activityContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 16,
  },
  activityItem: {
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
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#8898aa',
  },
  activityAmount: {
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default DashboardScreen;
