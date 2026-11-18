import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchProducts } from '@/api/client';
import { Button, Card, EmptyState, LoadingState, Stepper } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { useStore } from '@/store/useStore';
import { colors, radius, spacing } from '@/theme';
import type { Product } from '@/types';
import { formatMoney, getUnitPrice, localize } from '@/utils/format';

export default function CartScreen({ navigation }: RootProps<'Cart'>) {
  useScreenTitle(navigation, 'cart.title');
  const { t } = useTranslation();
  const items = useStore((state) => state.items);
  const setQuantity = useStore((state) => state.setQuantity);
  const removeItem = useStore((state) => state.removeItem);
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });

  const lines = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((line): line is { product: Product; quantity: number } => Boolean(line));

  const subtotal = lines.reduce(
    (sum, line) => sum + getUnitPrice(line.product, line.quantity) * line.quantity,
    0,
  );

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {lines.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title={t('cart.empty')}
            subtitle={t('cart.emptySubtitle')}
            actionLabel={t('cart.continueShopping')}
            onAction={() => navigation.goBack()}
          />
        ) : (
          <>
            {lines.map(({ product, quantity }) => {
              const unitPrice = getUnitPrice(product, quantity);
              return (
                <Card key={product.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="cube-outline" size={22} color={colors.primaryDark} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {localize(product.name)}
                      </Text>
                      <Text style={styles.itemUnit}>/ {localize(product.unit)}</Text>
                    </View>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => removeItem(product.id)} />
                  </View>
                  <View style={styles.itemFooter}>
                    <Stepper value={quantity} onChange={(q) => setQuantity(product.id, q)} />
                    <View style={styles.itemPrice}>
                      {unitPrice < product.price ? (
                        <Text style={styles.oldPrice}>{formatMoney(product.price * quantity)}</Text>
                      ) : null}
                      <Text style={styles.price}>{formatMoney(unitPrice * quantity)}</Text>
                      {unitPrice < product.price ? (
                        <Text style={styles.wholesale}>{t('cart.wholesaleApplied')}</Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {lines.length > 0 ? (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.subtotalLabel}>{t('cart.subtotal')}</Text>
            <Text style={styles.subtotalValue}>{formatMoney(subtotal)}</Text>
          </View>
          <Button label={t('cart.checkout')} onPress={() => navigation.navigate('Checkout')} icon="arrow-forward-outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  itemCard: { marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  itemUnit: { fontSize: 12, color: colors.muted, marginTop: 2 },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  itemPrice: { alignItems: 'flex-end' },
  oldPrice: { fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' },
  price: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  wholesale: { fontSize: 10, color: colors.success, fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  subtotalLabel: { fontSize: 12, color: colors.muted },
  subtotalValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
});
