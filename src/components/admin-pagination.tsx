import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: AdminPaginationProps) {
  if (totalItems <= pageSize) return null;

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = getVisiblePages(currentPage, pageCount);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-5 py-3",
        className,
      )}
    >
      <div className="text-[12.5px] text-muted-foreground">
        Showing {start}-{end} of {totalItems}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          aria-label="Previous page"
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-1 text-[12px] text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === currentPage ? "outline" : "ghost"}
              size="sm"
              className="min-w-8 px-2"
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          type="button"
          aria-label="Next page"
          variant="ghost"
          size="sm"
          disabled={currentPage === pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getVisiblePages(
  page: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const ordered = Array.from(pages)
    .filter((item) => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b);

  return ordered.flatMap((item, index) => {
    const previous = ordered[index - 1];
    if (previous && item - previous > 1) {
      return ["ellipsis" as const, item];
    }
    return [item];
  });
}
