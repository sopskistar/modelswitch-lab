import Image from 'next/image';

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/modelswitch-icon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="brand-mark"
      unoptimized
      priority
    />
  );
}
