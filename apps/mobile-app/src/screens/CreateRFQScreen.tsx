import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createRFQ, fetchProducts } from '@/api/client';
import { Button, Card, LoadingState } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import type { RFQItem } from '@/types';
import { localize } from '@/utils/format';

interface DraftItem {
  productId: string;
  quantity: string;
}

const defaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

export default function CreateRFQScreen({ navigation }: RootProps<'CreateRFQ'>) {
  useScreenTitle(navigation, 'createRfq.title');
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts() });

  const [items, setItems] = useState<DraftItem[]>([{ productId: '', quantity: '' }]);
  const [location, setLocation] = useState('');
  const [neededBy, setNeededBy] = useState(defaultDate());
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { items: RFQItem[]; deliveryLocation: string; neededBy: string }) => createRFQ(input),
    onSuccess: async (rfq) => {
      await queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      navigation.replace('RFQDetail', { rfqId: rfq.id });
    },
  });

  const setItemField = (index: number, field: keyof DraftItem, value: string) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const selectProduct = (productId: string) => {
    if (modalIndex === null) return;
    setItemField(modalIndex, 'productId', productId);
    setModalIndex(null);
  };

  const submit = () => {
    const valid = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (valid.length === 0) {
      Alert.alert(t('createRfq.atLeastOne'));
      return;
    }
    if (!location.trim()) {
      Alert.alert(t('createRfq.locationRequired'));
      return;
    }
    const rfqItems: RFQItem[] = valid.map((item) => {
      const product = products!.find((p) => p.id === item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: Number(item.quantity),
      };
    });
    mutation.mutate({ items: rfqItems, deliveryLocation: location.trim(), neededBy });
  };

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>{t('createRfq.hint')}</Text>

      {items.map((item, index) => {
        const product = products?.find((p) => p.id === item.productId);
        return (
          <Card key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemLabel}>{t('createRfq.selectProduct')}</Text>
              {items.length > 1 ? (
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                  onPress={() => setItems((current) => current.filter((_, i) => i !== index))}
                />
              ) : null}
            </View>
            <Pressable style={styles.selectButton} onPress={() => setModalIndex(index)}>
              <Ionicons name="cube-outline" size={18} color={colors.primaryDark} />
              <Text style={[styles.selectText, !product && styles.selectPlaceholder]}>
                {product ? localize(product.name) : t('createRfq.selectProduct')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
            <Text style={[styles.itemLabel, styles.qtyLabel]}>{t('createRfq.quantity')}</Text>
            <TextInput
              value={item.quantity}
              onChangeText={(value) => setItemField(index, 'quantity', value.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
            {product ? <Text style={styles.unitHint}>/ {localize(product.unit)}</Text> : null}
          </Card>
        );
      })}

      <Button
        label={t('createRfq.addItem')}
        variant="outline"
        icon="add-outline"
        onPress={() => setItems((current) => [...current, { productId: '', quantity: '' }])}
      />

      <Text style={[styles.itemLabel, styles.fieldLabel]}>{t('createRfq.deliveryLocation')}</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder={t('checkout.addressPlaceholder')}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <Text style={[styles.itemLabel, styles.fieldLabel]}>{t('createRfq.neededBy')}</Text>
      <TextInput
        value={neededBy}
        onChangeText={setNeededBy}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <Button
        label={t('createRfq.submit')}
        icon="send-outline"
        disabled={mutation.isPending}
        onPress={submit}
        style={styles.submitButton}
      />

      <Modal visible={modalIndex !== null} animationType="slide" transparent={false}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('createRfq.selectProduct')}</Text>
            <Ionicons name="close-outline" size={26} color={colors.ink} onPress={() => setModalIndex(null)} />
          </View>
          <ScrollView>
            {products?.map((product) => (
              <Pressable
                key={product.id}
                style={styles.modalRow}
                onPress={() => selectProduct(product.id)}
              >
                <Ionicons name="cube-outline" size={20} color={colors.primaryDark} />
                <View style={styles.modalRowInfo}>
                  <Text style={styles.modalRowName}>{localize(product.name)}</Text>
                  <Text style={styles.modalRowMeta}>/ {localize(product.unit)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.muted, marginBottom: spacing.lg },
  itemCard: { marginBottom: spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  qtyLabel: { marginTop: spacing.md, marginBottom: 6 },
  fieldLabel: { marginTop: spacing.lg, marginBottom: 6 },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 8,
  },
  selectText: { flex: 1, fontSize: 14, color: colors.ink },
  selectPlaceholder: { color: colors.muted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    height: 44,
    color: colors.ink,
  },
  unitHint: { fontSize: 11, color: colors.muted, marginTop: 4 },
  submitButton: { marginTop: spacing.xl },
  modal: { flex: 1, backgroundColor: colors.background, paddingTop: 48 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    borderRadius: radius.sm,
  },
  modalRowInfo: { flex: 1 },
  modalRowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  modalRowMeta: { fontSize: 12, color: colors.muted },
});
