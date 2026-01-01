import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { checkHealth } from '../src/services/api';
import { isSetupComplete } from '../src/services/storage';
import { colors } from '../src/constants/theme';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkInitialState() {
      // Check if setup was previously completed
      const setupDone = await isSetupComplete();

      if (setupDone) {
        // Check if backend is running
        const healthResult = await checkHealth();

        if (healthResult.success && healthResult.data?.healthy) {
          // Backend running, go to main app
          router.replace('/(main)/chat');
        } else {
          // Backend not running, show start-api step
          router.replace('/(setup)/start-api');
        }
      } else {
        // First time, start setup
        router.replace('/(setup)/welcome');
      }

      setChecking(false);
    }

    checkInitialState();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
