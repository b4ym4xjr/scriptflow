import { LogoMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark className="animate-pulse" />
            <div className="skeleton h-5 w-28" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-8 w-8" />
            <div className="skeleton h-8 w-8" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className="skeleton h-5 w-44 rounded-full" />
          <div className="skeleton h-10 w-80 max-w-full" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-56 rounded-2xl"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
