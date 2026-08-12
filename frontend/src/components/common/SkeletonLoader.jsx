/**
 * Reusable Skeleton Loading Components
 * Provides shimmer placeholders while data is being fetched.
 */

const Skeleton = ({ width = '100%', height = '1rem', rounded = '0.75rem', className = '' }) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius: rounded,
      minHeight: height,
    }}
  />
);

/** Skeleton row for tables — mimics a typical 4-5 column row */
const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-[var(--theme-border)]">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <Skeleton
          width={i === 0 ? '70%' : i === cols - 1 ? '50%' : '60%'}
          height="0.875rem"
        />
      </td>
    ))}
  </tr>
);

/** Full table skeleton with header + rows */
const TableSkeleton = ({ rows = 4, cols = 5 }) => (
  <div className="glass-panel p-6 rounded-2xl">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="12rem" height="1.25rem" />
      <Skeleton width="5rem" height="1.75rem" rounded="9999px" />
    </div>
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--theme-border)]">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="py-3 px-4">
              <Skeleton width="80%" height="0.625rem" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

/** Stat card skeleton */
const StatCardSkeleton = () => (
  <div className="stat-card rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width="60%" height="0.625rem" />
      <Skeleton width="2rem" height="2rem" rounded="0.5rem" />
    </div>
    <Skeleton width="40%" height="1.75rem" />
  </div>
);

/** Full dashboard skeleton — 3 stat cards + 2 glass panels + table */
const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
    {/* Header skeleton */}
    <div>
      <Skeleton width="16rem" height="2rem" className="mb-2" />
      <Skeleton width="24rem" height="0.875rem" />
    </div>

    {/* Stat cards row */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    {/* Content panels */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <Skeleton width="10rem" height="1.125rem" />
        <div className="flex flex-col items-center py-6 space-y-3">
          <Skeleton width="5rem" height="5rem" rounded="1rem" />
          <Skeleton width="8rem" height="1.5rem" />
          <Skeleton width="14rem" height="0.75rem" />
        </div>
      </div>
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <Skeleton width="10rem" height="1.125rem" />
        <Skeleton width="100%" height="12rem" rounded="1rem" />
        <Skeleton width="100%" height="2.75rem" rounded="0.75rem" />
      </div>
    </div>

    {/* Table skeleton */}
    <TableSkeleton rows={3} cols={5} />
  </div>
);

/** Verifier-style dashboard skeleton with tabs */
const VerifierDashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div>
      <Skeleton width="16rem" height="2rem" className="mb-2" />
      <Skeleton width="24rem" height="0.875rem" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    {/* Tab bar skeleton */}
    <div className="flex gap-1 bg-[var(--theme-surface)]/30 rounded-xl p-1 w-fit">
      <Skeleton width="10rem" height="2.5rem" rounded="0.5rem" />
      <Skeleton width="8rem" height="2.5rem" rounded="0.5rem" />
    </div>
    <TableSkeleton rows={4} cols={5} />
  </div>
);

/** Company-style dashboard skeleton with form + table */
const CompanyDashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div>
      <Skeleton width="16rem" height="2rem" className="mb-2" />
      <Skeleton width="24rem" height="0.875rem" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form skeleton */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <Skeleton width="8rem" height="1.125rem" />
        <Skeleton width="100%" height="0.75rem" />
        <div className="space-y-3 mt-4">
          <Skeleton width="5rem" height="0.75rem" />
          <Skeleton width="100%" height="2.75rem" rounded="0.75rem" />
          <Skeleton width="100%" height="2.75rem" rounded="0.75rem" />
        </div>
        <div className="mt-4 p-3 rounded-xl">
          <Skeleton width="100%" height="2rem" />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="md:col-span-2">
        <TableSkeleton rows={3} cols={4} />
      </div>
    </div>
  </div>
);

/** Verify integrity page skeleton */
const VerifyIntegritySkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <div>
      <Skeleton width="10rem" height="0.875rem" className="mb-4" />
      <Skeleton width="18rem" height="2rem" className="mb-2" />
      <Skeleton width="24rem" height="0.875rem" />
    </div>
    {/* Status banner skeleton */}
    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
      <Skeleton width="3rem" height="3rem" rounded="50%" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="1.5rem" />
        <Skeleton width="80%" height="0.75rem" />
      </div>
    </div>
    {/* Hash comparison cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton width="1.25rem" height="1.25rem" rounded="0.25rem" />
          <Skeleton width="10rem" height="1.125rem" />
        </div>
        <Skeleton width="80%" height="0.75rem" />
        <Skeleton width="100%" height="3.5rem" rounded="0.5rem" />
      </div>
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton width="1.25rem" height="1.25rem" rounded="0.25rem" />
          <Skeleton width="10rem" height="1.125rem" />
        </div>
        <Skeleton width="80%" height="0.75rem" />
        <Skeleton width="100%" height="3.5rem" rounded="0.5rem" />
      </div>
    </div>
  </div>
);

export {
  Skeleton,
  TableSkeleton,
  DashboardSkeleton,
  VerifierDashboardSkeleton,
  CompanyDashboardSkeleton,
  VerifyIntegritySkeleton,
};

export default Skeleton;
