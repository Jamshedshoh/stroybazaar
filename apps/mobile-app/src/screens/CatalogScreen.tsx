import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchProducts } from '@/api/client';
import ProductCard from '@/components/ProductCard';
import { Chip, EmptyState, LoadingState } from '@/components/ui';
import { categories } from '@/data/mockData';
import type { TabProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import type { CategoryId } from '@/types';
import { localize } from '@/utils/format';
import { selectCartCount, useStore } from '@/store/useStore';

type Sort = 'default' | 'asc' | 'desc';

export default function CatalogScreen({ navigation, route }: TabProps<'Catalog'>) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>(route.params?.categoryId);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('default');
  const count = useStore(selectCartCount);

  useEffect(() => {
    setCategoryId(route.params?.categoryId);
  }, [route.params?.categoryId]);

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((p) =>
        Object.values(p.name).concat(Object.values(p.attributes)).join(' ').toLowerCase().includes(query),
      );
    }
    if (sort === 'asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, categoryId, search, sort]);

  const sortLabel = sort === 'asc' ? t('catalog.priceLow') : sort === 'desc' ? t('catalog.priceHigh') : t('catalog.sortLabel');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('catalog.title')}</Text>
        <Pressable onPress={() => navigation.navigate('Cart')} hitSlop={8} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color={colors.ink} />
          {count > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('catalog.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={styles.sortButton}
          onPress={() => setSort((s) => (s === 'default' ? 'asc' : s === 'asc' ? 'desc' : 'default'))}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.primaryDark} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Chip label={t('catalog.allCategories')} selected={!categoryId} onPress={() => setCategoryId(undefined)} />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={localize(category.name)}
            selected={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.resultCount}>{t('catalog.found', { count: filtered.length })}</Text>
        {sort !== 'default' ? <Text style={styles.sortLabel}>{sortLabel}</Text> : null}
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search-outline" title={t('catalog.empty')} />
        ) : (
          <View style={styles.grid}>
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                width={cardWidth}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  cartButton: { position: 'relative', padding: 4 },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  searchRow: { flexDirection: 'row', gap: 8, padding: spacing.lg, paddingBottom: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  resultCount: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  sortLabel: { fontSize: 12, color: colors.primaryDark, fontWeight: '600', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
