import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Supplier } from '@/types';
import { localize } from '@/utils/format';
import { StarRating } from './ui';

export default function SupplierCard({
  supplier,
  onPress,
}: {
  supplier: Supplier;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Ionicons name="storefront-outline" size={26} color={colors.primaryDark} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {supplier.name}
          </Text>
          {supplier.verified ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          ) : null}
        </View>
        <Text style={styles.location}>{localize(supplier.location)}</Text>
        <View style={styles.meta}>
          <StarRating value={supplier.rating} count={supplier.reviewCount} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  location: { fontSize: 12, color: colors.muted, marginTop: 3 },
  meta: { marginTop: 8 },
});
