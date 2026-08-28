'use client';

import { useEffect, useState } from 'react';
import { getSignedAvatarUrl } from '@/lib/avatar';

import Image from 'next/image';

type Props = {
  path?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
};

export default function Avatar({ path, name, className = '', textClassName = '' }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // eslint-disable react-hooks/set-state-in-effect -- resetting state on prop change
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedAvatarUrl(path).then(u => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);
  // eslint-enable react-hooks/set-state-in-effect

  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (url && !failed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={url}
          alt={name}
          fill
          sizes="64px"
          onError={() => setFailed(true)}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center font-bold ${className} ${textClassName}`}>
      {initial}
    </div>
  );
}
