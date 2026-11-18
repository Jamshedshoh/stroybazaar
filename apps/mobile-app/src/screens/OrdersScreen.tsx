import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { advanceOrderStatus, confirmReceipt, fetchOrders } from '@/api/client';
import OrderCard from '@/components/OrderCard';
import { LoadingState } from '@/components/ui';
import type { TabProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';

export default function OrdersScreen({ navigation }: TabProps<'Orders'>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['orders'] });
  const confirm = useMutation({ mutationFn: (id: string) => confirmReceipt(id), onSuccess: refresh });
  const advance = useMutation({ mutationFn: (id: string) => advanceOrderStatus(id), onSuccess: refresh });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('orders.title')}</Text>
        <Ionicons name="receipt-outline" size={24} color={colors.primaryDark} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <LoadingState />
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onConfirm={() => confirm.mutate(order.id)}
              onAdvance={() => advance.mutate(order.id)}
              onReview={() => navigation.navigate('Reviews', { supplierId: order.supplierId, orderId: order.id })}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={42} color={colors.primaryDark} />
            <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
            <Text style={styles.emptySubtitle}>{t('orders.emptySubtitle')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  content: { padding: spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
