import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, launchCamera, MediaType, PhotoQuality } from 'react-native-image-picker';
import { auth } from '../config/firebase';
import { getGroup, getUserData, addExpense, imageToBase64 } from '../services/firebase';
import { Group, User, SplitDetail } from '../types';
import { GroupsStackParamList } from '../types/navigation';
import { generateEqualSplits, compressBase64Image } from '../utils/helpers';
import { useTheme, darkTheme } from '../context/ThemeContext';

const AddExpenseScreen = () => {
  const navigation = useNavigation<StackNavigationProp<GroupsStackParamList, 'AddExpense'>>();
  const route = useRoute<RouteProp<GroupsStackParamList, 'AddExpense'>>();
  const { groupId } = route.params;
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Record<string, User>>({});
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('General');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  
  const categories = [
    'Food & Drink', 
    'Groceries', 
    'Housing', 
    'Transportation', 
    'Entertainment', 
    'Shopping', 
    'Utilities', 
    'Travel', 
    'General'
  ];

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

      // Set the current user as the payer by default
      setPaidBy(currentUser.uid);

      // Get group details
      const groupData = await getGroup(groupId);
      if (!groupData) {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
        return;
      }
      setGroup(groupData);

      // Get member details
      const membersData: Record<string, User> = {};
      for (const memberId of groupData.members) {
        const userData = await getUserData(memberId);
        if (userData) {
          membersData[memberId] = userData;
        }
      }
      setMembers(membersData);

      // Initialize custom splits with zero values
      const initialSplits: Record<string, string> = {};
      groupData.members.forEach(memberId => {
        initialSplits[memberId] = '0';
      });
      setCustomSplits(initialSplits);
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setImagePickerVisible(false);
    
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.7 as PhotoQuality,
        maxWidth: 800,
        maxHeight: 800,
      };
      
      let result;
      if (source === 'camera') {
        result = await launchCamera(options);
      } else {
        result = await launchImageLibrary(options);
      }
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        throw new Error(result.errorMessage);
      }
      
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          // Convert image to base64
          const base64Data = await imageToBase64(asset.uri);
          
          // Compress the base64 image
          const compressedBase64 = await compressBase64Image(base64Data);
          
          setReceiptImage(compressedBase64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return false;
    }

    if (splitType === 'custom') {
      // Validate that custom splits add up to the total amount
      const total = Object.values(customSplits).reduce((sum, value) => {
        return sum + (parseFloat(value) || 0);
      }, 0);
      
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        Alert.alert('Error', `The sum of all splits (${total.toFixed(2)}) must equal the total amount (${parseFloat(amount).toFixed(2)})`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser || !group) {
        return;
      }

      // Calculate splits based on the selected split type
      let paidFor: SplitDetail[];
      if (splitType === 'equal') {
        paidFor = generateEqualSplits(parseFloat(amount), group.members);
      } else {
        // Custom splits
        paidFor = Object.entries(customSplits).map(([userId, amountStr]) => ({
          userId,
          amount: parseFloat(amountStr) || 0
        }));
      }

      // Create expense object
      const expenseData: any = {
        groupId,
        description,
        amount: parseFloat(amount),
        currency: 'USD', // Default currency
        paidBy,
        paidFor,
        date: date.getTime(),
        category
      };
      
      // Only add notes if it's not empty
      if (notes.trim()) {
        expenseData.notes = notes.trim();
      }
      
      // Only add receipt if it exists
      if (receiptImage) {
        expenseData.receipt = receiptImage;
      }

      // Add expense to Firestore
      await addExpense(expenseData);

      // Navigate back to group details
      Alert.alert('Success', 'Expense added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>Description</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            placeholder="What was this expense for?"
            placeholderTextColor={theme.tertiaryText}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.label, { color: theme.secondaryText }]}>Amount</Text>
          <View style={[styles.amountInputContainer, { 
            backgroundColor: theme.inputBackground, 
            borderColor: theme.border 
          }]}>
            <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.tertiaryText}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Date</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border 
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <Icon name="calendar-today" size={20} color={theme.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              themeVariant={theme === darkTheme ? 'dark' : 'light'}
            />
          )}

          <Text style={[styles.label, { color: theme.secondaryText }]}>Category</Text>
          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                    category === cat && [styles.categoryChipSelected, { backgroundColor: theme.primary, borderColor: theme.primary }]
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: theme.secondaryText },
                      category === cat && styles.categoryChipTextSelected
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Paid by</Text>
          <View style={styles.membersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {group?.members.map((memberId) => {
                const member = members[memberId];
                const isSelected = paidBy === memberId;
                const isCurrentUser = memberId === auth.currentUser?.uid;
                
                return (
                  <TouchableOpacity
                    key={memberId}
                    style={[
                      styles.memberChip,
                      { backgroundColor: theme.inputBackground, borderColor: theme.border },
                      isSelected && [styles.memberChipSelected, { backgroundColor: theme.primary, borderColor: theme.primary }]
                    ]}
                    onPress={() => setPaidBy(memberId)}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member?.displayName.substring(0, 2).toUpperCase() || '??'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.memberChipText,
                        { color: theme.secondaryText },
                        isSelected && styles.memberChipTextSelected
                      ]}
                    >
                      {isCurrentUser ? 'You' : member?.displayName || 'Unknown'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Split type</Text>
          <View style={styles.splitTypeContainer}>
            <TouchableOpacity
              style={[
                styles.splitTypeButton,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                splitType === 'equal' && [styles.splitTypeButtonSelected, { backgroundColor: theme.primary, borderColor: theme.primary }],
                { marginRight: 8 }
              ]}
              onPress={() => setSplitType('equal')}
            >
              <Text
                style={[
                  styles.splitTypeButtonText,
                  { color: theme.secondaryText },
                  splitType === 'equal' && styles.splitTypeButtonTextSelected
                ]}
              >
                Equal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.splitTypeButton,
                { backgroundColor: theme.inputBackground, borderColor: theme.border },
                splitType === 'custom' && [styles.splitTypeButtonSelected, { backgroundColor: theme.primary, borderColor: theme.primary }],
                { marginLeft: 8 }
              ]}
              onPress={() => setSplitType('custom')}
            >
              <Text
                style={[
                  styles.splitTypeButtonText,
                  { color: theme.secondaryText },
                  splitType === 'custom' && styles.splitTypeButtonTextSelected
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {splitType === 'custom' && (
            <View style={styles.customSplitsContainer}>
              {group?.members.map((memberId) => {
                const member = members[memberId];
                const isCurrentUser = memberId === auth.currentUser?.uid;
                
                return (
                  <View key={memberId} style={styles.customSplitItem}>
                    <View style={styles.customSplitUser}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member?.displayName.substring(0, 2).toUpperCase() || '??'}
                        </Text>
                      </View>
                      <Text style={[styles.customSplitUserName, { color: theme.text }]}>
                        {isCurrentUser ? 'You' : member?.displayName || 'Unknown'}
                      </Text>
                    </View>
                    <View style={[styles.customSplitAmountContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                      <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
                      <TextInput
                        style={[styles.customSplitAmountInput, { color: theme.text }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.tertiaryText}
                        value={customSplits[memberId]}
                        onChangeText={(value) => {
                          setCustomSplits({
                            ...customSplits,
                            [memberId]: value
                          });
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={[styles.label, { color: theme.secondaryText }]}>Add receipt (optional)</Text>
          <TouchableOpacity
            style={[styles.receiptButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            onPress={() => setImagePickerVisible(true)}
          >
            {receiptImage ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${receiptImage}` }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.receiptPlaceholder}>
                <Icon name="receipt" size={32} color={theme.border} />
                <Text style={[styles.receiptPlaceholderText, { color: theme.tertiaryText }]}>Add receipt image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.secondaryText }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            placeholder="Add any additional details"
            placeholderTextColor={theme.tertiaryText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={imagePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Receipt</Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { borderBottomColor: theme.border }]}
              onPress={() => pickImage('camera')}
            >
              <Icon name="camera-alt" size={24} color={theme.primary} style={styles.modalButtonIcon} />
              <Text style={[styles.modalButtonText, { color: theme.text }]}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { borderBottomColor: theme.border }]}
              onPress={() => pickImage('gallery')}
            >
              <Icon name="photo-library" size={24} color={theme.primary} style={styles.modalButtonIcon} />
              <Text style={[styles.modalButtonText, { color: theme.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525f7f',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#32325d',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#32325d',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#32325d',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#32325d',
  },
  categoriesContainer: {
    marginVertical: 8,
  },
  categoryChip: {
    backgroundColor: '#f7fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipSelected: {
    backgroundColor: '#5E72E4',
    borderColor: '#5E72E4',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#525f7f',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  membersContainer: {
    marginVertical: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  memberChipSelected: {
    backgroundColor: '#5E72E4',
    borderColor: '#5E72E4',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberChipText: {
    fontSize: 14,
    color: '#525f7f',
  },
  memberChipTextSelected: {
    color: '#fff',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  splitTypeButton: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingVertical: 12,
    alignItems: 'center',
  },
  splitTypeButtonSelected: {
    backgroundColor: '#5E72E4',
    borderColor: '#5E72E4',
  },
  splitTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#525f7f',
  },
  splitTypeButtonTextSelected: {
    color: '#fff',
  },
  customSplitsContainer: {
    marginTop: 16,
  },
  customSplitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  customSplitUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customSplitUserName: {
    fontSize: 16,
    color: '#32325d',
  },
  customSplitAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    width: 100,
  },
  customSplitAmountInput: {
    paddingVertical: 8,
    fontSize: 16,
    color: '#32325d',
    flex: 1,
  },
  receiptButton: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    height: 150,
  },
  receiptPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptPlaceholderText: {
    fontSize: 14,
    color: '#8898aa',
    marginTop: 8,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#5E72E4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalButtonIcon: {
    marginRight: 16,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#32325d',
  },
  cancelButton: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53E3E',
    textAlign: 'center',
  },
});

export default AddExpenseScreen;
