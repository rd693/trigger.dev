import { useLocation } from "@remix-run/react";
import { LinkButton } from "~/components/primitives/Buttons";
import { Direction, RunList } from "~/presenters/RunListPresenter.server";
import { cn } from "~/utils/cn";

export function ListPagination({
  list,
  className,
}: {
  list: RunList;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <PreviousButton cursor={list.pagination.previous} />
      <NextButton cursor={list.pagination.next} />
    </div>
  );
}

function NextButton({ cursor }: { cursor?: string }) {
  const path = useCursorPath(cursor, "forward");

  return path ? (
    <LinkButton
      to={path}
      variant={"secondary/small"}
      TrailingIcon="chevron-right"
    >
      <span className="sr-only">Next</span>
    </LinkButton>
  ) : null;
}

function PreviousButton({ cursor }: { cursor?: string }) {
  const path = useCursorPath(cursor, "backward");

  return path ? (
    <LinkButton
      to={path}
      variant={"secondary/small"}
      LeadingIcon="chevron-left"
    >
      <span className="sr-only">Previous</span>
    </LinkButton>
  ) : null;
}

function useCursorPath(cursor: string | undefined, direction: Direction) {
  const location = useLocation();

  if (!cursor) {
    return undefined;
  }

  const search = new URLSearchParams(location.search);
  search.set("cursor", cursor);
  search.set("direction", direction);
  return location.pathname + "?" + search.toString();
}
