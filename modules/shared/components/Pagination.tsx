"use client";

import { Button, cn } from "@repo/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type PaginationProps = {
	totalItems: number;
	currentPage: number;
	itemsPerPage: number;
	onChangeCurrentPage: (page: number) => void;
};

export function Pagination({ totalItems, currentPage, itemsPerPage, onChangeCurrentPage }: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	if (totalPages <= 1) return null;

	const pages: (number | "...")[] = [];
	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) pages.push(i);
	} else {
		pages.push(1);
		if (currentPage > 3) pages.push("...");
		for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
		if (currentPage < totalPages - 2) pages.push("...");
		pages.push(totalPages);
	}

	return (
		<div className="flex items-center gap-1">
			<Button variant="outline" size="icon" className="size-8" disabled={currentPage <= 1} onClick={() => onChangeCurrentPage(currentPage - 1)}>
				<ChevronLeftIcon className="size-4" />
			</Button>
			{pages.map((p, i) =>
				p === "..." ? (
					<span key={`e${i}`} className="px-2 text-muted-foreground">
						...
					</span>
				) : (
					<Button
						key={p}
						variant={p === currentPage ? "primary" : "outline"}
						size="icon"
						className={cn("size-8 text-xs")}
						onClick={() => onChangeCurrentPage(p)}
					>
						{p}
					</Button>
				),
			)}
			<Button
				variant="outline"
				size="icon"
				className="size-8"
				disabled={currentPage >= totalPages}
				onClick={() => onChangeCurrentPage(currentPage + 1)}
			>
				<ChevronRightIcon className="size-4" />
			</Button>
		</div>
	);
}
