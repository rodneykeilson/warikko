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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettlementsStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Settlement, User } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

const SettlementsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SettlementsStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }

      // Get settlements where user is involved (either sending or receiving)
      const fromUserQuery = query(
        collection(db, 'settlements'),
        where('fromUserId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      
      const toUserQuery = query(
        collection(db, 'settlements'),
        where('toUserId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      
      const fromUserSnapshot = await getDocs(fromUserQuery);
      const toUserSnapshot = await getDocs(toUserQuery);
      
      const settlementsList: Settlement[] = [];
      const userIds = new Set<string>();
      
      fromUserSnapshot.forEach((doc) => {
        const settlement = { id: doc.id, ...doc.data() } as Settlement;
        settlementsList.push(settlement);
        userIds.add(settlement.toUserId);
      });
      
      toUserSnapshot.forEach((doc) => {
        const settlement = { id: doc.id, ...doc.data() } as Settlement;
        settlementsList.push(settlement);
        userIds.add(settlement.fromUserId);
      });

      // Sort settlements by date (newest first)
      settlementsList.sort((a, b) => b.date - a.date);
      
      setSettlements(settlementsList);

      // Get user data for all involved users
      const users: Record<string, User> = {};
      
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          users[userId] = userDoc.data() as User;
        }
      }
      
      setUserMap(users);
    } catch (error) {
      console.error('Error loading settlements:', error);
      Alert.alert('Error', 'Failed to load settlements. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettlements();
  };

  const renderSettlementItem = ({ item }: { item: Settlement }) => {
    const isReceiving = item.toUserId === auth.currentUser?.uid;
    const otherUserId = isReceiving ? item.fromUserId : item.toUserId;
    const otherUser = userMap[otherUserId];
    
    return (
      <TouchableOpacity
        style={styles.settlementItem}
        onPress={() => navigation.navigate('SettlementDetails', { settlementId: item.id })}
      >
        <View style={[
          styles.settlementIconContainer,
          { backgroundColor: getStatusColor(item.status, 0.1) }
        ]}>
          <Icon
            name={getStatusIcon(item.status)}
            size={24}
            color={getStatusColor(item.status, 1)}
          />
        </View>
        
        <View style={styles.settlementContent}>
          <Text style={styles.settlementTitle}>
            {isReceiving 
              ? `${otherUser?.displayName || 'Unknown user'} paid you`
              : `You paid ${otherUser?.displayName || 'Unknown user'}`
            }
          </Text>
          <Text style={styles.settlementSubtitle}>
            {formatDate(item.date)} • {getStatusLabel(item.status)}
          </Text>
        </View>
        
        <Text
          style={[
            styles.amountText,
            { 
              color: isReceiving ? '#4CAF50' : '#F44336',
            }
          ]}
        >
          {isReceiving ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
        </Text>
      </TouchableOpacity>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getStatusColor = (status: string, opacity: number) => {
    switch (status) {
      case 'completed':
        return `rgba(76, 175, 80, ${opacity})`;
      case 'pending':
        return `rgba(255, 152, 0, ${opacity})`;
      case 'cancelled':
        return `rgba(244, 67, 54, ${opacity})`;
      default:
        return `rgba(158, 158, 158, ${opacity})`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
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
        <Text style={styles.headerTitle}>Settlements</Text>
        <Text style={styles.headerSubtitle}>
          Track payments between you and your friends
        </Text>
      </View>

      {settlements.length > 0 ? (
        <FlatList
          data={settlements}
          renderItem={renderSettlementItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5E72E4']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="payment" size={64} color="#CBD5E0" />
          <Text style={styles.emptyText}>No settlements yet</Text>
          <Text style={styles.emptySubtext}>
            Settlements will appear here when you record payments between you and your friends
          </Text>
        </View>
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#525f7f',
  },
  listContainer: {
    padding: 16,
  },
  settlementItem: {
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
  settlementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settlementContent: {
    flex: 1,
  },
  settlementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32325d',
    marginBottom: 4,
  },
  settlementSubtitle: {
    fontSize: 14,
    color: '#8898aa',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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

export default SettlementsScreen;
