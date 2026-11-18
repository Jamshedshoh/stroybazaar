import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme';
import type { TabParamList, RootStackParamList } from './types';

import HomeScreen from '@/screens/HomeScreen';
import CatalogScreen from '@/screens/CatalogScreen';
import RFQScreen from '@/screens/RFQScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ProductDetailScreen from '@/screens/ProductDetailScreen';
import CartScreen from '@/screens/CartScreen';
import CheckoutScreen from '@/screens/CheckoutScreen';
import CreateRFQScreen from '@/screens/CreateRFQScreen';
import RFQDetailScreen from '@/screens/RFQDetailScreen';
import SuppliersScreen from '@/screens/SuppliersScreen';
import SupplierDetailScreen from '@/screens/SupplierDetailScreen';
import ReviewsScreen from '@/screens/ReviewsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcons: Record<keyof TabParamList, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Catalog: { active: 'grid', inactive: 'grid-outline' },
  RFQ: { active: 'clipboard', inactive: 'clipboard-outline' },
  Orders: { active: 'receipt', inactive: 'receipt-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.line, height: 62, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = tabIcons[route.name];
          return (
            <Ionicons
              name={(focused ? icons.active : icons.inactive) as never}
              size={size ?? 22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ title: t('tabs.catalog') }} />
      <Tab.Screen name="RFQ" component={RFQScreen} options={{ title: t('tabs.rfq') }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: t('tabs.orders') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="CreateRFQ" component={CreateRFQScreen} />
      <Stack.Screen name="RFQDetail" component={RFQDetailScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
}
