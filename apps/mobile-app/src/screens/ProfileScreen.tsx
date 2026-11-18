import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Button, Card, SectionHeader } from '@/components/ui';
import { languageNames } from '@/i18n/translations';
import type { TabProps } from '@/navigation/types';
import { useStore } from '@/store/useStore';
import { colors, spacing } from '@/theme';
import type { Language } from '@/types';

export default function ProfileScreen({ navigation }: TabProps<'Profile'>) {
  const { t } = useTranslation();
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={30} color={colors.white} />
        </View>
        <View>
          <Text style={styles.name}>{t('profile.retail')}</Text>
          <Text style={styles.subtitle}>Khujand, Tajikistan</Text>
        </View>
      </View>

      <SectionHeader title={t('profile.language')} />
      <Text style={styles.hint}>{t('profile.languageSubtitle')}</Text>
      <Card>
        {(['tj', 'ru', 'en'] as Language[]).map((lang, index) => (
          <View
            key={lang}
            style={[styles.langRow, index > 0 && styles.langRowBorder]}
          >
            <Text style={styles.langName}>{languageNames[lang]}</Text>
            <Ionicons
              name={language === lang ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={language === lang ? colors.primary : colors.line}
              onPress={() => setLanguage(lang)}
            />
          </View>
        ))}
      </Card>

      <SectionHeader title={t('profile.supplierZone')} />
      <Card>
        <Text style={styles.hint}>{t('profile.supplierZoneSubtitle')}</Text>
        <Button
          label={t('profile.mySuppliers')}
          icon="storefront-outline"
          variant="outline"
          onPress={() => navigation.navigate('Suppliers')}
        />
      </Card>

      <SectionHeader title={t('profile.aboutApp')} />
      <Card>
        <Text style={styles.about}>{t('profile.aboutText')}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 3 },
  hint: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  langRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  langName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  about: { fontSize: 13, color: colors.ink, lineHeight: 20 },
});
