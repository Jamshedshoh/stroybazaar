import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing } from '@/theme';
import type { RFQ } from '@/types';
import { formatDate, localize } from '@/utils/format';
import { Badge } from './ui';

export default function RFQCard({ rfq, onPress }: { rfq: RFQ; onPress: () => void }) {
  const { t } = useTranslation();
  const tone = rfq.status === 'awarded' ? 'success' : rfq.status === 'quoted' ? 'info' : 'primary';
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('rfq.title')}</Text>
        <Badge label={t(`rfq.status.${rfq.status}`)} tone={tone} />
      </View>
      <Text style={styles.items} numberOfLines={2}>
        {rfq.items.map((i) => `${localize(i.productName)} × ${i.quantity}`).join(' · ')}
      </Text>
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {t('rfq.deliveryTo')}: {rfq.deliveryLocation}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {t('rfq.neededBy')}: {formatDate(rfq.neededBy)}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('rfq.items', { count: rfq.items.length })}</Text>
        <Text style={styles.footerText}>{t('rfq.quotes', { count: rfq.quotes.length })}</Text>
        <Text style={styles.footerDate}>{formatDate(rfq.createdAt)}</Text>
      </View>
    </Pressable>
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
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  items: { fontSize: 13, color: colors.muted, marginTop: 10 },
  meta: { marginTop: 12, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.ink },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 12,
    paddingTop: 10,
  },
  footerText: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },
  footerDate: { fontSize: 11, color: colors.muted, marginLeft: 'auto' },
});
