import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchProduct, fetchSupplier } from '@/api/client';
import { categoryIcon } from '@/components/ProductCard';
import { Badge, Button, Card, LoadingState, SectionHeader, StarRating, Stepper, VerifiedBadge } from '@/components/ui';
import { useStore } from '@/store/useStore';
import type { RootProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { formatMoney, getUnitPrice, getWholesaleTier, localize } from '@/utils/format';

export default function ProductDetailScreen({ navigation, route }: RootProps<'ProductDetail'>) {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [quantity, setQuantity] = useState(1);
  const addItem = useStore((state) => state.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  });
  const { data: supplier } = useQuery({
    queryKey: ['supplier', product?.supplierId],
    queryFn: () => fetchSupplier(product!.supplierId),
    enabled: Boolean(product),
  });

  useEffect(() => {
    if (product) navigation.setOptions({ title: localize(product.name) });
  }, [product, navigation]);

  if (isLoading || !product) return <LoadingState />;

  const tier = getWholesaleTier(product, quantity);
  const unitPrice = getUnitPrice(product, quantity);

  const addToCart = () => {
    addItem(product.id, quantity);
    Alert.alert(t('product.added'), localize(product.name));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name={categoryIcon(product.categoryId) as never} size={84} color={colors.primaryDark} />
        {product.wholesaleTiers.length > 0 ? (
          <View style={styles.heroBadge}>
            <Badge label={t('common.wholesale')} tone="primary" />
          </View>
        ) : null}
      </View>

      <Text style={styles.name}>{localize(product.name)}</Text>
      <Text style={styles.attributes}>{localize(product.attributes)}</Text>

      <Card style={styles.priceCard}>
        <View>
          <Text style={styles.price}>{formatMoney(unitPrice)}</Text>
          <Text style={styles.unit}>/ {localize(product.unit)}</Text>
          {tier ? (
            <Text style={styles.wholesaleNote}>
              {t('cart.wholesaleApplied')} · {t('product.minQty', { count: tier.minQty, unit: localize(product.unit) })}
            </Text>
          ) : null}
        </View>
        <Badge label={product.stock > 0 ? t('product.inStock') : t('product.outOfStock')} tone={product.stock > 0 ? 'success' : 'neutral'} />
      </Card>

      {product.wholesaleTiers.length > 0 ? (
        <>
          <SectionHeader title={t('product.wholesalePricing')} />
          <Card>
            <View style={styles.tierRow}>
              <Text style={styles.tierHead}>{t('product.retailPrice')}</Text>
              <Text style={styles.tierValue}>{formatMoney(product.price)}</Text>
            </View>
            {product.wholesaleTiers.map((item) => (
              <View style={styles.tierRow} key={item.minQty}>
                <Text style={styles.tierHead}>
                  {t('product.minQty', { count: item.minQty, unit: localize(product.unit) })}
                </Text>
                <Text style={[styles.tierValue, styles.tierHighlight]}>{formatMoney(item.pricePerUnit)}</Text>
              </View>
            ))}
            <Text style={styles.hint}>{t('product.wholesaleHint')}</Text>
          </Card>
        </>
      ) : null}

      {supplier ? (
        <>
          <SectionHeader title={t('product.supplier')} />
          <Card>
            <View style={styles.supplierRow}>
              <View style={styles.supplierAvatar}>
                <Ionicons name="storefront-outline" size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <StarRating value={supplier.rating} count={supplier.reviewCount} />
                {supplier.verified ? <VerifiedBadge compact /> : null}
              </View>
            </View>
            <Text style={styles.deliveryNote}>
              <Ionicons name="car-sport-outline" size={13} color={colors.muted} /> {t('product.deliveryBySupplier')}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('product.details')} />
      <Card>
        <Text style={styles.detailText}>{localize(product.attributes)}</Text>
        <Text style={styles.stockText}>{t('product.stock', { count: product.stock })}</Text>
      </Card>

      <View style={styles.purchaseBar}>
        <View style={styles.qtyWrap}>
          <Text style={styles.qtyLabel}>{t('common.qty')}</Text>
          <Stepper value={quantity} onChange={setQuantity} min={1} />
        </View>
        <View style={styles.purchaseButtons}>
          <Button label={t('product.addToCart')} onPress={addToCart} variant="outline" icon="cart-outline" small style={{ flex: 1 }} />
          <Button
            label={t('product.buyNow')}
            onPress={() => {
              addToCart();
              navigation.navigate('Cart');
            }}
            small
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  hero: {
    height: 200,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroBadge: { position: 'absolute', top: 12, right: 12 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  attributes: { fontSize: 14, color: colors.muted, marginTop: 6 },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  price: { fontSize: 26, fontWeight: '800', color: colors.primaryDark },
  unit: { fontSize: 12, color: colors.muted },
  wholesaleNote: { fontSize: 11, color: colors.success, marginTop: 6, fontWeight: '600' },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  tierHead: { fontSize: 13, color: colors.muted },
  tierValue: { fontSize: 14, fontWeight: '700', color: colors.ink },
  tierHighlight: { color: colors.primaryDark },
  hint: { fontSize: 11, color: colors.muted, marginTop: 8, fontStyle: 'italic' },
  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  supplierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInfo: { flex: 1, gap: 3 },
  supplierName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  deliveryNote: { fontSize: 12, color: colors.muted, marginTop: spacing.md },
  detailText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  stockText: { fontSize: 12, color: colors.muted, marginTop: 8 },
  purchaseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    ...shadowCard(),
  },
  qtyWrap: { gap: 6 },
  qtyLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  purchaseButtons: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});

function shadowCard() {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  };
}
