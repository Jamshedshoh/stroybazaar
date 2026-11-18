import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CategoryId } from '@/types';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  CreateRFQ: undefined;
  RFQDetail: { rfqId: string };
  Suppliers: undefined;
  SupplierDetail: { supplierId: string };
  Reviews: { supplierId: string; orderId?: string };
};

export type TabParamList = {
  Home: undefined;
  Catalog: { categoryId?: CategoryId } | undefined;
  RFQ: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootProps<K extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  K
>;

export type TabProps<K extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, K>,
  NativeStackScreenProps<RootStackParamList>
>;
