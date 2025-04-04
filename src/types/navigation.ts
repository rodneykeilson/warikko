import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  ExpenseDetails: { expenseId: string };
};

export type GroupsStackParamList = {
  Groups: undefined;
  GroupDetails: { groupId: string; groupName?: string };
  AddExpense: { groupId: string };
  ExpenseDetails: { expenseId: string };
};

export type SettlementsStackParamList = {
  Settlements: undefined;
  SettlementDetails: { settlementId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

export type TabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList>;
  SettlementsTab: NavigatorScreenParams<SettlementsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
