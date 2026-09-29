import { MapPin } from "lucide-react";
import { GeoBubbleMap } from "./GeoBubbleMap";
import type { VenueSummary } from "../types/data";

const hostCountryIds = ["124", "484", "840"];

export function VenueMap({
  venues,
  selectedVenueId,
  onSelectVenue
}: {
  venues: VenueSummary[];
  selectedVenueId?: number;
  onSelectVenue?: (venue: VenueSummary) => void;
}) {
  return (
    <GeoBubbleMap
      ariaLabel="World Cup host venue map"
      viewport={{
        minLon: -128,
        maxLon: -68,
        minLat: 13,
        maxLat: 56
      }}
      highlightedCountryIds={hostCountryIds}
      labelCountries
      selectedBubbleId={selectedVenueId}
      bubbles={venues.map((venue) => ({
        id: venue.id,
        longitude: venue.longitude,
        latitude: venue.latitude,
        value: venue.matchCount,
        label: `${venue.stadiumName}, ${venue.city}`,
        detail: `${venue.matchCount} matches · ${venue.avgGoals} avg goals`
      }))}
      onSelectBubble={(bubble) => {
        const venue = venues.find((item) => item.id === bubble.id);
        if (venue) onSelectVenue?.(venue);
      }}
      legend={
        <>
          <MapPin size={16} />
          <span>Focused on the host corridor. Northern Canada is cropped so stadium bubbles stay centered.</span>
        </>
      }
    />
  );
}
