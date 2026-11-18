import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { submitReview } from '@/api/client';
import { Button, Card } from '@/components/ui';
import { useScreenTitle } from '@/hooks/useScreenTitle';
import type { RootProps } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';

export default function ReviewsScreen({ navigation, route }: RootProps<'Reviews'>) {
  useScreenTitle(navigation, 'reviews.title');
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { supplierId, orderId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => submitReview({ supplierId, rating, comment: comment.trim(), orderId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reviews', supplierId] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert(t('reviews.success'), undefined, [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    },
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.subtitle}>{t('reviews.subtitle')}</Text>
        <Text style={styles.label}>{t('reviews.yourRating')}</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={38}
              color={star <= rating ? '#F59E0B' : colors.line}
              onPress={() => setRating(star)}
              style={styles.star}
            />
          ))}
        </View>
        <Text style={styles.label}>{t('reviews.comment')}</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={t('reviews.commentPlaceholder')}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
        />
        <Button
          label={t('reviews.submit')}
          icon="send-outline"
          disabled={mutation.isPending}
          onPress={() => mutation.mutate()}
          style={styles.submit}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  stars: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  star: { padding: 2 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  submit: {},
});
