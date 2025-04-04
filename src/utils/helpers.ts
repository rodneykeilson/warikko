import { Expense, Balance, User, SplitDetail } from '../types';

/**
 * Calculate balances for a group based on expenses
 * @param expenses List of expenses in the group
 * @param members List of user IDs in the group
 * @returns Array of balances for each user
 */
export const calculateBalances = (expenses: Expense[], members: string[]): Balance[] => {
  // Initialize balances for all members
  const balances: Record<string, number> = {};
  members.forEach(memberId => {
    balances[memberId] = 0;
  });

  // Calculate balances based on expenses
  expenses.forEach(expense => {
    // Add the full amount to the payer's balance (positive means they are owed money)
    balances[expense.paidBy] += expense.amount;

    // Subtract each person's share from their balance
    expense.paidFor.forEach(split => {
      balances[split.userId] -= split.amount;
    });
  });

  // Convert the record to an array of Balance objects
  return Object.entries(balances).map(([userId, amount]) => ({
    userId,
    amount
  }));
};

/**
 * Calculate simplified debts to minimize the number of transactions
 * @param balances Array of balances for each user
 * @returns Array of simplified transactions
 */
export const simplifyDebts = (balances: Balance[]) => {
  // Separate positive (creditors) and negative (debtors) balances
  const creditors = balances.filter(balance => balance.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter(balance => balance.amount < 0)
    .sort((a, b) => a.amount - b.amount);

  const transactions: { from: string; to: string; amount: number }[] = [];

  // Match debtors with creditors to minimize transactions
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    // Calculate the transaction amount (minimum of debt and credit)
    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

    // Add the transaction
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount
    });

    // Update balances
    debtor.amount += amount;
    creditor.amount -= amount;

    // Remove users with zero balance
    if (Math.abs(debtor.amount) < 0.01) {
      debtors.shift();
    }
    if (Math.abs(creditor.amount) < 0.01) {
      creditors.shift();
    }
  }

  return transactions;
};

/**
 * Format currency amount with the appropriate symbol
 * @param amount Amount to format
 * @param currencyCode Currency code (e.g., 'USD', 'EUR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
};

/**
 * Format a date in a user-friendly way
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Generate equal splits for an expense
 * @param amount Total amount
 * @param userIds Array of user IDs to split between
 * @returns Array of split details
 */
export const generateEqualSplits = (amount: number, userIds: string[]): SplitDetail[] => {
  const splitAmount = amount / userIds.length;
  
  return userIds.map(userId => ({
    userId,
    amount: splitAmount
  }));
};

/**
 * Generate percentage splits for an expense
 * @param amount Total amount
 * @param splits Object mapping user IDs to percentages
 * @returns Array of split details
 */
export const generatePercentageSplits = (
  amount: number, 
  splits: Record<string, number>
): SplitDetail[] => {
  return Object.entries(splits).map(([userId, percentage]) => ({
    userId,
    amount: (amount * percentage) / 100
  }));
};

/**
 * Get user's full name or display name
 * @param user User object
 * @returns User's display name
 */
export const getUserDisplayName = (user: User): string => {
  return user.displayName || user.email.split('@')[0];
};

/**
 * Get user's initials for avatar
 * @param displayName User's display name
 * @returns User's initials (up to 2 characters)
 */
export const getUserInitials = (displayName: string): string => {
  if (!displayName) return '?';
  
  const names = displayName.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate a random color for user avatars
 * @param userId User ID to generate color for
 * @returns Hex color code
 */
export const generateAvatarColor = (userId: string): string => {
  // Generate a deterministic color based on the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

/**
 * Compress base64 image to reduce storage size
 * @param base64Image Original base64 image string
 * @param maxWidth Maximum width of the compressed image
 * @param quality Compression quality (0-1)
 * @returns Compressed base64 image string
 */
export const compressBase64Image = (
  base64Image: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Image}`;
    
    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Get compressed base64 string
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
  });
};
