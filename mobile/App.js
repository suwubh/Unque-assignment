import { StatusBar } from 'expo-status-bar';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LeadCard from './src/LeadCard';
import { useLeads } from './src/useLeads';

export default function App() {
  const { leads, connected } = useLeads();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Leads</Text>
          <Text style={styles.subtitle}>Meta Lead Ads</Text>
        </View>
        <View style={styles.status}>
          <View style={[styles.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>{connected ? 'Connected' : 'Connecting…'}</Text>
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <LeadCard lead={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Waiting for leads…</Text>
            <Text style={styles.emptyText}>
              Submit a test lead from Meta's Lead Ads Testing Tool and it will
              appear here automatically.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  statusText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
