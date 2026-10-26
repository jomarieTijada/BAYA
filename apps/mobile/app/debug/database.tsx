/**
 * app/debug/database.tsx
 *
 * Debug-only route for the BAYA SQLite Database Inspector.
 * Protected by EXPO_PUBLIC_ENABLE_DB_INSPECTOR feature flag.
 */
import { Text, View, StyleSheet } from 'react-native';
import DatabaseInspector from '../../components/debug/DatabaseInspector';

export default function DebugDatabaseRoute() {
  // Expo inlines static dot notation. Missing/invalid values keep the tool disabled.
  const DB_INSPECTOR_ENABLED = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR === 'true';

  if (!DB_INSPECTOR_ENABLED) {
    return (
      <View style={styles.disabled}>
        <Text style={styles.disabledTitle}>Database Inspector Disabled</Text>
        <Text style={styles.disabledText}>
          Set EXPO_PUBLIC_ENABLE_DB_INSPECTOR=true in your environment to enable this tool.
        </Text>
      </View>
    );
  }

  return <DatabaseInspector />;
}

const styles = StyleSheet.create({
  disabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: 24,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#cdd6f4',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  disabledText: {
    fontSize: 13,
    color: '#7f849c',
    textAlign: 'center',
    fontFamily: 'monospace',
    maxWidth: 400,
  },
});
