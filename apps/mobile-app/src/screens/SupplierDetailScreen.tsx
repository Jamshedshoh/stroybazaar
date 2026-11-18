import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchProducts, fetchReviews, fetchSupplier } from '@/api/client';
import ProductCard from '@/components/ProductCard';
import { Badge, Card, LoadingState, SectionHeader, StarRating, VerifiedBadge } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { formatDate, localize } from '@/utils/format';

export default function SupplierDetailScreen({ navigation, route }: RootProps<'SupplierDetail'>) {
  useScreenTitle(navigation, 'suppliers.title');
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const { supplierId } = route.params;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => fetchSupplier(supplierId),
  });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });
  const { data: reviews } = useQuery({
    queryKey: ['reviews', supplierId],
    queryFn: () => fetchReviews(supplierId),
  });

  if (isLoading || !supplier) return <LoadingState />;

  const ownProducts = products?.filter((p) => p.supplierId === supplier.id) ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.headRow}>
          <View style={styles.avatar}>
            <Ionicons name="storefront-outline" size={32} color={colors.primaryDark} />
          </View>
          <View style={styles.headInfo}>
            <Text style={styles.name}>{supplier.name}</Text>
            <StarRating value={supplier.rating} count={supplier.reviewCount} />
            {supplier.verified ? <VerifiedBadge /> : <Badge label={t('suppliers.verified')} tone="neutral" />}
          </View>
        </View>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={13} color={colors.muted} /> {localize(supplier.location)}
        </Text>
        <Text style={styles.member}>
          {t('supplierDetail.memberSince', { year: supplier.joinedAt.slice(0, 4) })}
        </Text>
        <Text style={styles.languages}>
          {t('supplierDetail.languages')}: {supplier.languages.join(' · ').toUpperCase()}
        </Text>
      </Card>

      <SectionHeader title={t('supplierDetail.contact')} />
      <Card>
        {supplier.phones.map((phone) => (
          <Text
            key={phone}
            style={styles.phone}
            onPress={() => void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)}
          >
            <Ionicons name="call-outline" size={15} color={colors.primaryDark} /> {phone}
          </Text>
        ))}
      </Card>

      <SectionHeader title={t('supplierDetail.products')} />
      <View style={styles.grid}>
        {ownProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            width={cardWidth}
            onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
          />
        ))}
      </View>

      <SectionHeader title={t('supplierDetail.reviews')} />
      {reviews && reviews.length > 0 ? (
        reviews.map((review) => (
          <Card key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <StarRating value={review.rating} />
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.noReviews}>{t('supplierDetail.noReviews')}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  headRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headInfo: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  location: { fontSize: 13, color: colors.muted, marginTop: spacing.md },
  member: { fontSize: 12, color: colors.muted, marginTop: 6 },
  languages: { fontSize: 12, color: colors.muted, marginTop: 4 },
  phone: { fontSize: 14, color: colors.primaryDark, fontWeight: '600', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  reviewCard: { marginBottom: spacing.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: colors.ink },
  reviewComment: { fontSize: 13, color: colors.ink, marginTop: 8, lineHeight: 19 },
  reviewDate: { fontSize: 11, color: colors.muted, marginTop: 8 },
  noReviews: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
});
