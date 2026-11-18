import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import ProductCard, { categoryIcon } from '@/components/ProductCard';
import SupplierCard from '@/components/SupplierCard';
import { LoadingState, SectionHeader } from '@/components/ui';
import { fetchProducts, fetchSuppliers } from '@/api/client';
import { categories } from '@/data/mockData';
import type { TabProps } from '@/navigation/types';
import { colors, radius, shadow, spacing } from '@/theme';
import { localize } from '@/utils/format';

export default function HomeScreen({ navigation }: TabProps<'Home'>) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <Ionicons name="business-outline" size={22} color={colors.white} />
        </View>
        <View>
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>
      </View>

      <Text style={styles.greeting}>{t('home.greeting')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <View style={styles.flows}>
        <Pressable
          style={[styles.flowCard, styles.retailFlow]}
          onPress={() => navigation.navigate('Catalog')}
        >
          <Ionicons name="cart-outline" size={26} color={colors.white} />
          <Text style={styles.flowTitle}>{t('home.retailTitle')}</Text>
          <Text style={styles.flowText}>{t('home.retailText')}</Text>
        </Pressable>
        <Pressable
          style={[styles.flowCard, styles.wholesaleFlow]}
          onPress={() => navigation.navigate('CreateRFQ')}
        >
          <Ionicons name="clipboard-outline" size={26} color={colors.white} />
          <Text style={styles.flowTitle}>{t('home.wholesaleTitle')}</Text>
          <Text style={styles.flowText}>{t('home.wholesaleText')}</Text>
        </Pressable>
      </View>

      <SectionHeader
        title={t('home.shopByCategory')}
        actionLabel={t('home.viewAll')}
        onAction={() => navigation.navigate('Catalog')}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Catalog', { categoryId: category.id })}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={category.icon as never} size={24} color={colors.primaryDark} />
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>
              {localize(category.name)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader
        title={t('home.featuredProducts')}
        actionLabel={t('home.viewAll')}
        onAction={() => navigation.navigate('Catalog')}
      />
      {isLoading ? (
        <LoadingState />
      ) : (
        <View style={styles.productGrid}>
          {products?.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              width={cardWidth}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            />
          ))}
        </View>
      )}

      <SectionHeader
        title={t('home.trustedSuppliers')}
        actionLabel={t('home.browseSuppliers')}
        onAction={() => navigation.navigate('Suppliers')}
      />
      {suppliers?.slice(0, 3).map((supplier) => (
        <SupplierCard
          key={supplier.id}
          supplier={supplier}
          onPress={() => navigation.navigate('SupplierDetail', { supplierId: supplier.id })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.xl },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 19, fontWeight: '800', color: colors.ink },
  tagline: { fontSize: 11, color: colors.muted },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 20 },
  flows: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  flowCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 128, ...shadow.card },
  retailFlow: { backgroundColor: '#0EA5E9' },
  wholesaleFlow: { backgroundColor: colors.primaryDark },
  flowTitle: { color: colors.white, fontWeight: '800', fontSize: 15, marginTop: 10 },
  flowText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 4, lineHeight: 16 },
  categories: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  categoryCard: {
    width: 96,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.md,
    ...shadow.card,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontSize: 11, fontWeight: '700', color: colors.ink, textAlign: 'center', marginTop: 8 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
