import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { categories } from '@/data/mockData';
import { colors, radius, shadow, spacing } from '@/theme';
import type { CategoryId, Product } from '@/types';
import { formatMoney, localize } from '@/utils/format';

export function categoryIcon(categoryId: CategoryId): string {
  return categories.find((c) => c.id === categoryId)?.icon ?? 'cube-outline';
}

export default function ProductCard({
  product,
  onPress,
  width,
}: {
  product: Product;
  onPress: () => void;
  width?: number;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      style={[styles.card, width ? { width } : undefined]}
      onPress={onPress}
      android_ripple={{ color: colors.line, borderless: false }}
    >
      <View style={styles.image}>
        <Ionicons name={categoryIcon(product.categoryId) as never} size={42} color={colors.primaryDark} />
        {product.wholesaleTiers.length > 0 ? (
          <View style={styles.wholesaleFlag}>
            <Text style={styles.wholesaleFlagText}>{t('common.wholesale')}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {localize(product.name)}
        </Text>
        <Text style={styles.attributes} numberOfLines={1}>
          {localize(product.attributes)}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            <Text style={styles.unit}>/ {localize(product.unit)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.card,
  },
  image: {
    height: 108,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wholesaleFlag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  wholesaleFlagText: { fontSize: 10, fontWeight: '700', color: colors.primaryDark },
  body: { padding: spacing.md },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink, minHeight: 36 },
  attributes: { fontSize: 12, color: colors.muted, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  price: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  unit: { fontSize: 11, color: colors.muted },
});
