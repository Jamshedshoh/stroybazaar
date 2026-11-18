import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useScreenTitle(
  navigation: { setOptions: (options: { title?: string }) => void },
  key: string,
) {
  const { t } = useTranslation();
  useEffect(() => {
    navigation.setOptions({ title: t(key) });
  }, [navigation, t, key]);
}
