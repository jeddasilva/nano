import clsx from 'clsx';

export default function OpenCart({
  className,
  quantity
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className={clsx('relative text-sm tracking-wide', className)}>
      Cart
      {quantity ? (
        <span className="ml-1 tabular-nums text-mute">({quantity})</span>
      ) : null}
    </div>
  );
}
