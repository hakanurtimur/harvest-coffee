import { router } from "expo-router";
import { DealerShell } from "../components/dealer-shell";
import { EmptyState, PrimaryButton, RentalCard, ScrollContent, SectionTitle } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function RentalsScreen() {
  const { rentals } = useMobileState();

  return (
    <DealerShell title="Rentals">
      <ScrollContent>
        <SectionTitle eyebrow="Equipment" title="Rental history" />
        <PrimaryButton label="Create rental" onPress={() => router.push("/create-rental")} />
        {rentals.length === 0 ? (
          <EmptyState title="No rentals yet" body="Create a rental request for eligible machine products." />
        ) : (
          rentals.map((rental) => <RentalCard key={rental.id} rental={rental} />)
        )}
      </ScrollContent>
    </DealerShell>
  );
}
