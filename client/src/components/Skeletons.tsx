export const QuestionSkeleton = () => (
  <div className="card min-h-[400px] flex flex-col p-8 border border-white/10 shadow-2xl bg-cyber-dark/80 backdrop-blur-sm animate-pulse">
    <div className="flex-1 space-y-8">
      {/* Type Badge */}
      <div className="h-6 w-32 bg-white/10 rounded" />
      
      {/* Question Text */}
      <div className="space-y-3">
        <div className="h-8 bg-white/10 rounded w-full" />
        <div className="h-8 bg-white/10 rounded w-5/6" />
      </div>

      {/* Options */}
      <div className="grid gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg border-2 border-white/5" />
        ))}
      </div>
    </div>
  </div>
);

export const NoteSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="h-10 bg-white/10 rounded w-2/3" />
    
    {/* Content blocks */}
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <div className="h-6 bg-white/10 rounded w-1/4" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="h-4 bg-white/5 rounded w-4/5" />
      </div>
    ))}
  </div>
);

export const FlashcardSkeleton = () => (
  <div className="max-w-2xl mx-auto">
    <div className="aspect-[3/2] bg-cyber-dark/80 border-2 border-white/10 rounded-2xl p-8 flex items-center justify-center animate-pulse">
      <div className="text-center space-y-4 w-full">
        <div className="h-8 bg-white/10 rounded w-3/4 mx-auto" />
        <div className="h-6 bg-white/5 rounded w-1/2 mx-auto" />
      </div>
    </div>
  </div>
);

export const SyllabusSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-8 bg-white/10 rounded w-1/3" />
        <div className="ml-8 space-y-2">
          <div className="h-6 bg-white/5 rounded w-1/2" />
          <div className="h-6 bg-white/5 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="min-h-screen bg-cyber-black p-8">
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="h-12 bg-white/10 rounded w-1/3" />
      
      {/* Content area */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="h-64 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);
