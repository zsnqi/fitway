import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
	effectiveFreshness,
	fetchPublicOccupancy,
	nextPollDelay,
} from "@/lib/public-occupancy";

export function usePublicOccupancy(random: () => number = Math.random) {
	const [now, setNow] = useState(() => new Date());
	const [isVisible, setIsVisible] = useState(
		() => document.visibilityState === "visible",
	);
	const refetchedBoundary = useRef<string | null>(null);
	const query = useQuery({
		queryKey: ["public-occupancy"],
		queryFn: ({ signal }) => fetchPublicOccupancy(signal),
		retry: false,
		staleTime: 0,
		refetchOnWindowFocus: false,
		refetchInterval: false,
	});

	useEffect(() => {
		const value = query.data;
		if (!value?.pollSeconds || !isVisible) return;
		const timer = window.setTimeout(
			() => {
				if (!query.isFetching && isVisible) {
					void query.refetch();
				}
			},
			nextPollDelay(value.pollSeconds, random),
		);
		return () => window.clearTimeout(timer);
	}, [query.data, query.isFetching, query.refetch, random, isVisible]);

	useEffect(() => {
		const payload = query.data?.payload;
		if (payload?.freshness !== "fresh") return;
		const delay = Date.parse(payload.freshUntil) - Date.now();
		if (delay <= 0) {
			setNow(new Date());
			return;
		}
		const timer = window.setTimeout(() => setNow(new Date()), delay);
		return () => window.clearTimeout(timer);
	}, [query.data]);

	useEffect(() => {
		const payload = query.data?.payload;
		if (payload?.freshness !== "closed" || payload.nextOpenAt === null) return;
		const boundaryKey = `${payload.computedAt}/${payload.nextOpenAt}`;
		const boundary = Date.parse(payload.nextOpenAt);
		const expireAndRefetch = () => {
			setNow((current) =>
				current.getTime() >= boundary ? current : new Date(),
			);
			if (refetchedBoundary.current === boundaryKey || query.isFetching) return;
			refetchedBoundary.current = boundaryKey;
			void query.refetch();
		};
		const delay = boundary - Date.now();
		if (!Number.isFinite(delay) || delay <= 0) {
			expireAndRefetch();
			return;
		}
		const timer = window.setTimeout(expireAndRefetch, delay);
		return () => window.clearTimeout(timer);
	}, [query.data, query.isFetching, query.refetch]);

	useEffect(() => {
		const timer = window.setInterval(() => {
			if (document.visibilityState === "visible") setNow(new Date());
		}, 15_000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		const visible = () => {
			const nextVisible = document.visibilityState === "visible";
			setIsVisible(nextVisible);
			if (!nextVisible) return;
			setNow(new Date());
			if (!query.isFetching) void query.refetch();
		};
		document.addEventListener("visibilitychange", visible);
		return () => document.removeEventListener("visibilitychange", visible);
	}, [query.isFetching, query.refetch]);

	const payload = query.data?.payload;
	const derivedFreshness = payload
		? effectiveFreshness(payload, now)
		: undefined;
	const freshness =
		query.isError && derivedFreshness === "fresh" ? "stale" : derivedFreshness;
	return { ...query, payload, effectiveFreshness: freshness, now };
}
