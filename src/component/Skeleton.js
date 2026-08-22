export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-gray-200 rounded-full" />
        <div className="h-3 w-1/3 bg-gray-100 rounded-full" />
        <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
        <div className="flex justify-between pt-3">
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-12 bg-gray-100 rounded-full" />
        </div>
        <div className="h-11 w-full bg-gray-200 rounded-xl mt-3" />
      </div>
    </div>
  );
}

export default function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
