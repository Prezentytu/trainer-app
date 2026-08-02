/** @deprecated — użyj sessionQueue; re-export dla kompatybilności. */
export {
  readPortalQueue,
  enqueuePortalWrite,
  clearPortalQueueItem,
  type QueuedPortalWrite,
} from "@/lib/sessionQueue";
