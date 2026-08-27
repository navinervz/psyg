import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** هاله‌ی سبز دور کارت */
  glow?: boolean;
  /**
   * نوار نئونی چرخان هنگام هاور یا لمس.
   *
   * عمداً انتخابی است و پیش‌فرض خاموش. اگر همه‌ی کارت‌های صفحه این را
   * داشتند، حرکت دیگر چیزی را برجسته نمی‌کرد — و کارتی که فقط ظرف
   * چیدمان است (مثل قاب هیرو) بی‌دلیل زیر موس روشن می‌شد.
   *
   * فقط کارت‌هایی بگیرند که کاربر واقعاً رویشان کلیک می‌کند.
   */
  neon?: boolean;
  as?: "div" | "section" | "article" | "aside";
};

export function Card({
  className,
  glow = false,
  neon = false,
  as: Tag = "div",
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "card-surface relative overflow-hidden",
        glow && "glow-ring",
        neon && "neon-edge",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 px-5 pt-5", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-bold text-hi", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
