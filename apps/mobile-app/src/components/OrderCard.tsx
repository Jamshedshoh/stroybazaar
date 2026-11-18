import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Order } from '@/types';
import { formatDate, formatMoney, localize } from '@/utils/format';
import { Badge, Button } from './ui';

export default function OrderCard({
  order,
  onConfirm,
  onReview,
  onAdvance,
}: {
  order: Order;
  onConfirm: () => void;
  onReview: () => void;
  onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const tone = order.status === 'confirmed_receipt' ? 'success' : order.status === 'delivered' ? 'info' : 'primary';
  const paymentLabel = order.paymentMethod === 'cod' ? t('checkout.cod') : t('checkout.bankTransfer');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.id}>{t('orders.orderNumber', { id: order.id })}</Text>
        <Badge label={t(`orders.status.${order.status}`)} tone={tone} />
      </View>
      <Text style={styles.date}>{t('orders.placedOn', { date: formatDate(order.createdAt) })}</Text>

      <View style={styles.lines}>
        {order.lines.map((line, index) => (
          <View style={styles.line} key={`${line.productId}-${index}`}>
            <Text style={styles.lineName} numberOfLines={1}>
              {localize(line.productName)}
            </Text>
            <Text style={styles.lineQty}>
              {line.quantity} {localize(line.unit)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.total}>
          {t('common.total')}: {formatMoney(order.total)}
        </Text>
        <Text style={styles.payment}>
          {t('orders.payment')}: {paymentLabel}
        </Text>
      </View>

      <View style={styles.actions}>
        {order.status === 'delivered' ? (
          <Button label={t('orders.confirmReceipt')} onPress={onConfirm} small icon="checkmark-circle-outline" />
        ) : null}
        {order.status === 'confirmed_receipt' && !order.hasReview ? (
          <Button label={t('orders.reviewSupplier')} onPress={onReview} small variant="outline" icon="star-outline" />
        ) : null}
        {['placed', 'confirmed', 'out_for_delivery'].includes(order.status) ? (
          <Button label={t('orders.status.delivered')} onPress={onAdvance} small variant="outline" icon="arrow-forward-outline" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  id: { fontSize: 15, fontWeight: '700', color: colors.ink },
  date: { fontSize: 12, color: colors.muted, marginTop: 4 },
  lines: { marginTop: spacing.md, gap: 6 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineName: { fontSize: 13, color: colors.ink, flexShrink: 1 },
  lineQty: { fontSize: 13, color: colors.muted },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  total: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  payment: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.md, flexWrap: 'wrap' },
});
