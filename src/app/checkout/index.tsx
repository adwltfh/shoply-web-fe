import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CartLineRow } from '@/components/shop/CartLineRow';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { Stamp } from '@/components/shop/Stamp';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { borderWidth, colors, minTouchTarget, radii, spacing, typography } from '@/design-system';
import { pageMetadata } from '@/lib/metadata';
import { useCartHydrated, useCartStore } from '@/stores/cart';

export function generateMetadata() {
  return pageMetadata('Demo checkout', undefined, { index: false });
}

type Form = { name: string; email: string; address: string };

export default function CheckoutScreen() {
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const [form, setForm] = useState<Form>({ name: '', email: '', address: '' });
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: form.name.trim() ? undefined : 'Add your name.',
    email: /^\S+@\S+\.\S+$/.test(form.email.trim()) ? undefined : 'Add a valid email.',
    address: form.address.trim() ? undefined : 'Add a shipping address.',
  };
  const valid = !errors.name && !errors.email && !errors.address;

  const placeOrder = () => {
    setSubmitted(true);
    if (!valid) return;
    const order = `LT-${Math.floor(1000 + Math.random() * 9000)}`;
    clear();
    router.replace({ pathname: '/checkout/success', params: { order } });
  };

  if (!hydrated) {
    return <ScreenContainer edges={['bottom', 'left', 'right']}>{null}</ScreenContainer>;
  }

  if (lines.length === 0) {
    return (
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        <EmptyState
          title="Your bag is empty."
          body="Add something to your bag before starting the demo checkout."
          action={
            <Link href="/explore" asChild>
              <Button label="Browse the shop" />
            </Link>
          }
        />
      </ScreenContainer>
    );
  }

  const field = (key: keyof Form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm((f) => ({ ...f, [key]: v })),
    error: submitted ? errors[key] : undefined,
  });

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']} keyboardAware>
      <Card tone="brandSoft" style={styles.notice}>
        <Stamp label="Demo only" tone="highlight" />
        <Text variant="caption">
          This is a demo. No payment is taken and nothing ships. Any details you type stay on this
          device.
        </Text>
      </Card>

      <View style={styles.layout}>
        <View style={styles.form}>
          <Text variant="title">Ship to</Text>
          <Field label="Full name" autoComplete="name" textContentType="name" {...field('name')} />
          <Field
            label="Email"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            {...field('email')}
          />
          <Field
            label="Address"
            autoComplete="street-address"
            textContentType="fullStreetAddress"
            multiline
            {...field('address')}
          />
        </View>

        <View style={styles.side}>
          <View>
            {lines.map((line) => (
              <CartLineRow key={`${line.slug}:${line.size ?? ''}`} line={line} />
            ))}
          </View>
          <OrderSummary>
            <Button label="Place demo order" variant="ink" fullWidth onPress={placeOrder} />
            {submitted && !valid && (
              <Text variant="caption" color="error" role="alert">
                Fill in the highlighted fields to continue.
              </Text>
            )}
          </OrderSummary>
        </View>
      </View>
    </ScreenContainer>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string };

function Field({ label, error, multiline, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text variant="eyebrow">{label}</Text>
      <TextInput
        {...input}
        multiline={multiline}
        aria-label={label}
        aria-invalid={!!error}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      />
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: spacing.sm,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.xxl,
  },
  form: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    gap: spacing.lg,
  },
  side: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: minTouchTarget + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    outlineWidth: 0,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputFocused: {
    outlineColor: colors.focus,
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
});
