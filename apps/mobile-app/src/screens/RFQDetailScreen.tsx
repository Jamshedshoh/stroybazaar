import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { awardQuote, fetchRFQ, fetchSuppliers, simulateSupplierQuotes } from '@/api/client';
import { Badge, Button, Card, LoadingState, SectionHeader } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { formatDate, formatMoney, localize } from '@/utils/format';

export default function RFQDetailScreen({ navigation, route }: RootProps<'RFQDetail'>) {
  useScreenTitle(navigation, 'rfqDetail.title');
  const { t } = useTranslation();
  const { rfqId } = route.params;
  const queryClient = useQueryClient();

  const { data: rfq, isLoading, refetch } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => fetchRFQ(rfqId),
  });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    void refetch();
  };

  const simulate = useMutation({
    mutationFn: () => simulateSupplierQuotes(rfqId),
    onSuccess: refresh,
  });
  const award = useMutation({
    mutationFn: (quoteId: string) => awardQuote(rfqId, quoteId),
    onSuccess: () => {
      refresh();
      Alert.alert(t('rfq.awarded'));
    },
  });

  if (isLoading || !rfq) return <LoadingState />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{t('rfq.title')}</Text>
          <Badge label={t(`rfq.status.${rfq.status}`)} tone={rfq.status === 'awarded' ? 'success' : 'primary'} />
        </View>
        <Text style={styles.date}>{t('rfq.createdOn', { date: formatDate(rfq.createdAt) })}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <Text style={styles.metaText}>
            {t('rfq.deliveryTo')}: {rfq.deliveryLocation}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.muted} />
          <Text style={styles.metaText}>
            {t('rfq.neededBy')}: {formatDate(rfq.neededBy)}
          </Text>
        </View>

        <View style={styles.divider} />
        {rfq.items.map((item, index) => (
          <View style={styles.line} key={`${item.productId}-${index}`}>
            <Text style={styles.lineName} numberOfLines={1}>
              {localize(item.productName)}
            </Text>
            <Text style={styles.lineQty}>
              {item.quantity} {localize(item.unit)}
            </Text>
          </View>
        ))}
      </Card>

      <SectionHeader
        title={t('rfqDetail.title')}
        actionLabel={t('common.retry')}
        onAction={refresh}
      />
      <Text style={styles.quotesMeta}>{t('rfqDetail.quotesFrom', { count: rfq.quotes.length })}</Text>

      {rfq.quotes.length === 0 ? (
        <Card>
          <Text style={styles.emptyQuotes}>{t('rfqDetail.empty')}</Text>
          <Button
            label={t('rfqDetail.simulate')}
            variant="outline"
            icon="refresh-outline"
            disabled={simulate.isPending}
            onPress={() => simulate.mutate()}
            style={styles.simulateButton}
          />
        </Card>
      ) : (
        rfq.quotes.map((quote) => {
          const supplier = suppliers?.find((s) => s.id === quote.supplierId);
          const accepted = rfq.awardedQuoteId === quote.id;
          return (
            <Card key={quote.id} style={accepted && styles.acceptedCard}>
              <View style={styles.quoteHeader}>
                <View>
                  <Text style={styles.supplierName}>{supplier?.name ?? quote.supplierId}</Text>
                  <Text style={styles.delivery}>
                    {t('rfqDetail.deliveryIn', { count: quote.deliveryDays })}
                  </Text>
                </View>
                {accepted ? <Badge label={t('rfqDetail.accepted')} tone="success" /> : null}
              </View>
              <Text style={styles.note}>{localize(quote.note)}</Text>
              <View style={styles.quoteFooter}>
                <View>
                  <Text style={styles.totalLabel}>{t('rfqDetail.totalLabel')}</Text>
                  <Text style={styles.totalValue}>{formatMoney(quote.total)}</Text>
                </View>
                {!accepted && rfq.status !== 'awarded' ? (
                  <Button
                    label={t('rfqDetail.acceptQuote')}
                    small
                    disabled={award.isPending}
                    onPress={() => award.mutate(quote.id)}
                  />
                ) : null}
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 17, fontWeight: '800', color: colors.ink },
  date: { fontSize: 11, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { fontSize: 13, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  lineName: { fontSize: 13, color: colors.ink, flexShrink: 1 },
  lineQty: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  quotesMeta: { fontSize: 12, color: colors.muted, marginBottom: spacing.md },
  emptyQuotes: { fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 12 },
  simulateButton: { marginTop: spacing.sm },
  acceptedCard: { borderWidth: 2, borderColor: colors.success },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  supplierName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  delivery: { fontSize: 12, color: colors.muted, marginTop: 3 },
  note: { fontSize: 13, color: colors.ink, marginTop: spacing.md, lineHeight: 19 },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  totalLabel: { fontSize: 11, color: colors.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
});
