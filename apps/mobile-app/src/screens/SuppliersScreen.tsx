import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchSuppliers } from '@/api/client';
import SupplierCard from '@/components/SupplierCard';
import { LoadingState } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';

export default function SuppliersScreen({ navigation }: RootProps<'Suppliers'>) {
  useScreenTitle(navigation, 'suppliers.title');
  const { t } = useTranslation();
  const { data: suppliers, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t('suppliers.subtitle')}</Text>
      {isLoading ? (
        <LoadingState />
      ) : (
        suppliers?.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            onPress={() => navigation.navigate('SupplierDetail', { supplierId: supplier.id })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.lg },
});
