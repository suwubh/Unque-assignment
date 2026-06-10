import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// Field names depend on the form, so check the usual ones and fall back to
// whatever actually came through.
function pickName(fields) {
  return (
    fields.full_name ||
    fields.name ||
    [fields.first_name, fields.last_name].filter(Boolean).join(' ') ||
    'Unknown lead'
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LeadCard({ lead }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [anim]);

  const fresh = Date.now() - (lead.receivedAt || 0) < 4000;
  const name = pickName(lead.fields || {});
  const email = lead.fields?.email;
  const phone = lead.fields?.phone_number || lead.fields?.phone;

  // Anything else the form had, just list it.
  const shown = new Set(['full_name', 'name', 'first_name', 'last_name', 'email', 'phone_number', 'phone']);
  const extras = Object.entries(lead.fields || {}).filter(([k]) => !shown.has(k));

  return (
    <Animated.View
      style={[
        styles.card,
        fresh && styles.cardFresh,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        {fresh && <Text style={styles.badge}>NEW</Text>}
      </View>

      {email ? <Text style={styles.field}>✉️  {email}</Text> : null}
      {phone ? <Text style={styles.field}>📞  {phone}</Text> : null}

      {extras.map(([key, value]) => (
        <Text key={key} style={styles.field}>
          {key.replace(/_/g, ' ')}: {value}
        </Text>
      ))}

      <View style={styles.footer}>
        <Text style={styles.meta}>{formatTime(lead.createdTime)}</Text>
        <Text style={styles.meta}>#{String(lead.id).slice(-8)}</Text>
      </View>

      {lead.fetchError ? (
        <Text style={styles.warn}>Shown from webhook only (Graph lookup unavailable)</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ececf1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardFresh: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: '#1f2937', flexShrink: 1 },
  badge: {
    color: '#fff',
    backgroundColor: '#4f46e5',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  field: { fontSize: 14, color: '#374151', marginTop: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  meta: { fontSize: 12, color: '#9ca3af' },
  warn: { fontSize: 11, color: '#b45309', marginTop: 8, fontStyle: 'italic' },
});
