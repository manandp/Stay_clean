import Ionicons from '@expo/vector-icons/Ionicons';
import { ADDICTIONS, COPING_TOOLS, type Resource } from '@stay-clean/shared';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Gap, Screen, Text, usePalette } from '@/components/ui';
import { useAppState } from '@/lib/app-state';
import { getSetting, setSetting } from '@/lib/db';
import { callNumber, openWeb, textNumber } from '@/lib/links';
import { radius } from '@/lib/theme';

function formatPhone(digits: string): string {
  if (digits.length === 11 && digits.startsWith('1')) return `1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return digits;
}

function ResourceRow({ r, last }: { r: Resource; last: boolean }) {
  const p = usePalette();
  const action = r.phone ? 'call' : r.sms ? 'text' : 'open';
  const onPress = () => {
    if (r.phone) void callNumber(r.phone);
    else if (r.sms) void textNumber(r.sms.to, r.sms.body);
    else if (r.url) void openWeb(r.url);
  };
  return (
    <Pressable
      accessibilityRole={action === 'open' ? 'link' : 'button'}
      accessibilityLabel={`${r.name}. ${r.description}${r.phone ? `. Call ${formatPhone(r.phone)}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.resource, !last && { borderBottomWidth: 1, borderBottomColor: p.border }, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{r.name}</Text>
        <Text variant="bodySmall" tone="textMuted">
          {r.description}
        </Text>
      </View>
      <Ionicons name={action === 'call' ? 'call-outline' : action === 'text' ? 'chatbubble-outline' : 'open-outline'} size={20} color={p.accent} />
    </Pressable>
  );
}

export default function Resources() {
  const p = usePalette();
  const { profile } = useAppState();
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    void getSetting('nextSteps').then((v) => setDone(v ? (JSON.parse(v) as number[]) : []));
  }, []);

  if (!profile) return null;
  const content = ADDICTIONS[profile.addiction];
  const title = profile.addiction === 'other' && profile.otherLabel ? profile.otherLabel : content.label;

  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((d) => d !== i) : [...done, i];
    setDone(next);
    void setSetting('nextSteps', JSON.stringify(next));
  };

  return (
    <Screen>
      <Text variant="title">For {title.toLowerCase()}</Text>
      <Gap size="sm" />
      <Text tone="textMuted">{content.overview}</Text>
      <Gap />

      {content.safetyWarning ? (
        <>
          <View style={styles.warning} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={20} color="#4A3407" />
            <Text variant="bodySmall" style={{ color: '#4A3407', flex: 1 }}>
              {content.safetyWarning}
            </Text>
          </View>
          <Gap />
        </>
      ) : null}

      <Card>
        <View style={styles.between}>
          <Text variant="heading">Your next steps</Text>
          <Text variant="bodySmall" tone="accent" style={{ fontWeight: '700' }}>
            {done.length} of {content.nextSteps.length} done
          </Text>
        </View>
        <Gap size="sm" />
        {content.nextSteps.map((step, i) => {
          const checked = done.includes(i);
          return (
            <Pressable
              key={step}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={step}
              onPress={() => toggle(i)}
              style={styles.step}
            >
              <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={p.primary} />
              <Text tone={checked ? 'textMuted' : 'text'} style={[{ flex: 1 }, checked && { textDecorationLine: 'line-through' }]}>
                {step}
              </Text>
            </Pressable>
          );
        })}
      </Card>

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        GET SUPPORT
      </Text>
      <Gap size="sm" />
      <Card style={{ paddingVertical: 4 }}>
        {content.resources.map((r, i) => (
          <ResourceRow key={r.name} r={r} last={i === content.resources.length - 1} />
        ))}
      </Card>

      <Gap size="xl" />
      <Text variant="caption" tone="textMuted">
        FOR HARD MOMENTS
      </Text>
      <Gap size="sm" />
      {COPING_TOOLS.map((tool) => (
        <View key={tool.id} style={{ marginBottom: 10 }}>
          <Card>
            <Text variant="label">{tool.title}</Text>
            <Gap size="xs" />
            <Text variant="bodySmall" tone="textSecondary">
              {tool.steps}
            </Text>
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#FDF1D8',
    borderWidth: 1,
    borderColor: '#EBCB86',
  },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  step: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  resource: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
