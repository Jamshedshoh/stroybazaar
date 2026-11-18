import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createOrder, fetchProducts } from '@/api/client';
import { Button, Card, LoadingState, SectionHeader } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { useStore } from '@/store/useStore';
import { colors, radius, spacing } from '@/theme';
import type { OrderLine, PaymentMethod } from '@/types';
import { formatMoney, getUnitPrice, localize } from '@/utils/format';

export default function CheckoutScreen({ navigation }: RootProps<'Checkout'>) {
  useScreenTitle(navigation, 'checkout.title');
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const items = useStore((state) => state.items);
  const clearCart = useStore((state) => state.clearCart);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cod');

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });
  const lines: OrderLine[] = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice: getUnitPrice(product, item.quantity),
      };
    })
    .filter((line): line is OrderLine => Boolean(line));
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({ lines, total, paymentMethod: payment, deliveryAddress: address.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      clearCart();
      Alert.alert(t('checkout.success'), t('checkout.successText'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Tabs', { screen: 'Orders' }) },
      ]);
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader title={t('checkout.deliveryAddress')} />
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder={t('checkout.addressPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
        style={styles.addressInput}
      />

      <SectionHeader title={t('checkout.paymentMethod')} />
      <PressableCard
        selected={payment === 'cod'}
        title={t('checkout.cod')}
        subtitle={t('checkout.codHint')}
        icon="cash-outline"
        onPress={() => setPayment('cod')}
      />
      <PressableCard
        selected={payment === 'bank_transfer'}
        title={t('checkout.bankTransfer')}
        subtitle={t('checkout.bankHint')}
        icon="card-outline"
        onPress={() => setPayment('bank_transfer')}
      />

      <SectionHeader title={t('checkout.orderSummary')} />
      <Card>
        {lines.map((line, index) => (
          <View style={styles.summaryRow} key={`${line.productId}-${index}`}>
            <Text style={styles.summaryName} numberOfLines={1}>
              {localize(line.productName)} × {line.quantity}
            </Text>
            <Text style={styles.summaryPrice}>{formatMoney(line.unitPrice * line.quantity)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('common.total')}</Text>
          <Text style={styles.totalValue}>{formatMoney(total)}</Text>
        </View>
      </Card>

      <Button
        label={t('checkout.placeOrder')}
        icon="checkmark-circle-outline"
        disabled={placeOrder.isPending || lines.length === 0}
        onPress={() => {
          if (!address.trim()) {
            Alert.alert(t('checkout.addressRequired'));
            return;
          }
          placeOrder.mutate();
        }}
        style={styles.placeButton}
      />
    </ScrollView>
  );
}

function PressableCard({
  selected,
  title,
  subtitle,
  icon,
  onPress,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.paymentCard,
        selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
      ]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.line}
      />
      <Ionicons name={icon as never} size={22} color={colors.ink} />
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  addressInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 84,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  paymentSubtitle: { fontSize: 11, color: colors.muted, marginTop: 3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  summaryName: { fontSize: 13, color: colors.ink, flexShrink: 1 },
  summaryPrice: { fontSize: 13, fontWeight: '700', color: colors.ink },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  placeButton: { marginTop: spacing.xl },
});
