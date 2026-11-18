import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchRFQs } from '@/api/client';
import RFQCard from '@/components/RFQCard';
import { Button, LoadingState } from '@/components/ui';
import type { TabProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';

export default function RFQScreen({ navigation }: TabProps<'RFQ'>) {
  const { t } = useTranslation();
  const { data: rfqs, isLoading, refetch } = useQuery({ queryKey: ['rfqs'], queryFn: fetchRFQs });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('rfq.title')}</Text>
          <Text style={styles.subtitle}>{t('rfq.subtitle')}</Text>
        </View>
        <Ionicons name="clipboard" size={26} color={colors.primaryDark} />
      </View>

      <Button
        label={t('rfq.create')}
        icon="add-outline"
        onPress={() => navigation.navigate('CreateRFQ')}
        style={styles.createButton}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <LoadingState />
        ) : rfqs && rfqs.length > 0 ? (
          rfqs.map((rfq) => (
            <RFQCard
              key={rfq.id}
              rfq={rfq}
              onPress={() => navigation.navigate('RFQDetail', { rfqId: rfq.id })}
            />
          ))
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="clipboard-outline" size={42} color={colors.primaryDark} />
            <Text style={styles.emptyTitle}>{t('rfq.empty')}</Text>
            <Text style={styles.emptySubtitle}>{t('rfq.emptySubtitle')}</Text>
            <Button label={t('rfq.create')} onPress={() => navigation.navigate('CreateRFQ')} />
          </View>
        )}
      </ScrollView>

      {/* pull-to-refresh is available via refetch on focus */}
      {rfqs && rfqs.length > 0 ? (
        <View style={styles.refreshRow}>
          <Button label={t('common.retry')} variant="outline" small onPress={() => void refetch()} />
        </View>
      ) : null}
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
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 4, maxWidth: 280 },
  createButton: { margin: spacing.lg, marginBottom: spacing.sm },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 80 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 12 },
  refreshRow: { position: 'absolute', bottom: 12, right: 16 },
});
