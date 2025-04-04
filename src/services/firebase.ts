import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, Group, Expense, Settlement } from '../types';

// Authentication Services
export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      displayName,
      createdAt: Date.now()
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// User Services
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
    
    // If there's a display name update, also update the Firebase Auth profile
    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }
    
    // If there's a photo URL update, also update the Firebase Auth profile
    if (data.photoURL && auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: data.photoURL });
    }
  } catch (error) {
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, uri: string) => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(uri);
    
    // Update user document with base64 image
    await updateUserProfile(userId, { photoURL: base64Image });
    
    return base64Image;
  } catch (error) {
    throw error;
  }
};

// Group Services
export const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt'>) => {
  try {
    const groupRef = collection(db, 'groups');
    const newGroup = {
      ...groupData,
      createdAt: Date.now()
    };
    
    const docRef = await addDoc(groupRef, newGroup);
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return { id: docRef.id, ...newGroup };
  } catch (error) {
    throw error;
  }
};

export const getGroup = async (groupId: string) => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      return groupDoc.data() as Group;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getUserGroups = async (userId: string) => {
  try {
    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const groupsSnapshot = await getDocs(groupsQuery);
    const groups: Group[] = [];
    
    groupsSnapshot.forEach((doc) => {
      groups.push(doc.data() as Group);
    });
    
    return groups;
  } catch (error) {
    throw error;
  }
};

export const updateGroup = async (groupId: string, data: Partial<Group>) => {
  try {
    await updateDoc(doc(db, 'groups', groupId), data);
  } catch (error) {
    throw error;
  }
};

export const deleteGroup = async (groupId: string) => {
  try {
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    throw error;
  }
};

export const uploadGroupPhoto = async (groupId: string, uri: string) => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(uri);
    
    // Update group document with base64 image
    await updateGroup(groupId, { photoURL: base64Image });
    
    return base64Image;
  } catch (error) {
    throw error;
  }
};

// Expense Services
export const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
  try {
    const expenseRef = collection(db, 'expenses');
    const newExpense = {
      ...expenseData,
      createdAt: Date.now()
    };
    
    const docRef = await addDoc(expenseRef, newExpense);
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return { id: docRef.id, ...newExpense };
  } catch (error) {
    throw error;
  }
};

export const getGroupExpenses = async (groupId: string) => {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
      orderBy('date', 'desc')
    );
    
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses: Expense[] = [];
    
    expensesSnapshot.forEach((doc) => {
      expenses.push(doc.data() as Expense);
    });
    
    return expenses;
  } catch (error) {
    throw error;
  }
};

export const getUserExpenses = async (userId: string) => {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('paidBy', '==', userId),
      orderBy('date', 'desc')
    );
    
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses: Expense[] = [];
    
    expensesSnapshot.forEach((doc) => {
      expenses.push(doc.data() as Expense);
    });
    
    return expenses;
  } catch (error) {
    throw error;
  }
};

export const updateExpense = async (expenseId: string, data: Partial<Expense>) => {
  try {
    await updateDoc(doc(db, 'expenses', expenseId), data);
  } catch (error) {
    throw error;
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    throw error;
  }
};

export const uploadReceiptImage = async (expenseId: string, uri: string) => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(uri);
    
    // Update expense document with base64 image
    await updateExpense(expenseId, { receipt: base64Image });
    
    return base64Image;
  } catch (error) {
    throw error;
  }
};

// Settlement Services
export const createSettlement = async (settlementData: Omit<Settlement, 'id' | 'createdAt'>) => {
  try {
    const settlementRef = collection(db, 'settlements');
    const newSettlement = {
      ...settlementData,
      createdAt: Date.now()
    };
    
    const docRef = await addDoc(settlementRef, newSettlement);
    
    // Update the document with its ID
    await updateDoc(docRef, { id: docRef.id });
    
    return { id: docRef.id, ...newSettlement };
  } catch (error) {
    throw error;
  }
};

export const getGroupSettlements = async (groupId: string) => {
  try {
    const settlementsQuery = query(
      collection(db, 'settlements'),
      where('groupId', '==', groupId),
      orderBy('date', 'desc')
    );
    
    const settlementsSnapshot = await getDocs(settlementsQuery);
    const settlements: Settlement[] = [];
    
    settlementsSnapshot.forEach((doc) => {
      settlements.push(doc.data() as Settlement);
    });
    
    return settlements;
  } catch (error) {
    throw error;
  }
};

export const getUserSettlements = async (userId: string) => {
  try {
    const fromUserQuery = query(
      collection(db, 'settlements'),
      where('fromUserId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const toUserQuery = query(
      collection(db, 'settlements'),
      where('toUserId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const fromUserSnapshot = await getDocs(fromUserQuery);
    const toUserSnapshot = await getDocs(toUserQuery);
    
    const settlements: Settlement[] = [];
    
    fromUserSnapshot.forEach((doc) => {
      settlements.push(doc.data() as Settlement);
    });
    
    toUserSnapshot.forEach((doc) => {
      settlements.push(doc.data() as Settlement);
    });
    
    // Sort by date (newest first)
    settlements.sort((a, b) => b.date - a.date);
    
    return settlements;
  } catch (error) {
    throw error;
  }
};

export const updateSettlement = async (settlementId: string, data: Partial<Settlement>) => {
  try {
    await updateDoc(doc(db, 'settlements', settlementId), data);
  } catch (error) {
    throw error;
  }
};

// Helper function to convert image URI to base64
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};
