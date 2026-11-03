import { Link } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { pageMetadata } from '@/lib/metadata';

export function generateMetadata() {
  return pageMetadata('Page not found', undefined, { index: false });
}

export default function NotFoundScreen() {
  return (
    <ScreenContainer edges={['bottom', 'left', 'right']}>
      <EmptyState
        title="Page not found."
        body="That page doesn't exist or may have moved."
        action={
          <Link href="/" replace asChild>
            <Button label="Go to home" />
          </Link>
        }
      />
    </ScreenContainer>
  );
}
